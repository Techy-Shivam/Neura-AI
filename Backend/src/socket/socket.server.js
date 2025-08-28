const { Server } = require("socket.io");
const cookie = require("cookie")
const jwt = require("jsonwebtoken");
const userModel = require("../Models/user.models");
const aiService = require("../service/ai.service")
const messageModel = require("../Models/message.model");
const { createMemory, queryMemory } = require('../service/vector.service');
const { text } = require("express");
const { chat } = require("@pinecone-database/pinecone/dist/assistant/data/chat");


function initSocketServer(httpServer) {

    // Initialize a new Socket.IO server
    const io = new Server(httpServer, {

        cors:{
            origin:"http://localhost:5173",
            allowedHeaders:["Content-Type", "Authorization"],
            credentials:true
        }

    })

    // --- Authentication middleware for sockets ---
    io.use(async (socket, next) => {

        // Extract cookies from client handshake headers
        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

        // If token is missing, block connection
        if (!cookies.token) {
            next(new Error("Authentication error: No token provided"));
        }

        try {
            // Decode and verify JWT token
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);

            // Fetch user from database using ID in token
            const user = await userModel.findById(decoded.id);

            // Attach user object to socket (for later use)
            socket.user = user

            next()

        } catch (err) {
            // If token is invalid/expired → reject connection
            next(new Error("Authentication error: Invalid token"));
        }

    })

    // --- When client connects successfully ---
    io.on("connection", (socket) => {

        // Listen for "ai-message" event from client
        socket.on("ai-message", async (messagePayload) => {

            // 1. Save the user's message in DB  and Generate vector embedding for the user message

            const [message, vectors] = await Promise.all([
                messageModel.create({
                    chat: messagePayload.chat,
                    user: socket.user._id,
                    content: messagePayload.content,
                    role: "user"
                }),
                aiService.generateVector(messagePayload.content)
            ])

            await createMemory({
                vectors,
                messageId:message._id,
                metadata:{
                    chat:messagePayload.chat,
                    user:socket.user._id,
                    text:messagePayload.content
                }
            })

            // 3. Query similar memories (semantic search from vector DB) and  Get last 20 messages from this chat (context for AI)
             
            const [memory, chatHistory] = await Promise.all([
                queryMemory({
                    queryVector: vectors,
                    limit: 3,
                    metadata: {
                        user: socket.user._id,
                    },
                }),

                messageModel
                    .find({ chat: messagePayload.chat })
                    .sort({ createdAt: -1 })
                    .limit(20)
                    .lean()
                    .then((messages) => messages.reverse())
            ]);

            const stm = chatHistory.map(item => {
                return {
                    role: item.role,
                    parts: [{ text: item.content }]
                }
            })

            const ltm = [{
                role: "user",
                parts: [{
                    text: `these are some previous chats, use them to generate a response ${memory.map(item => item.metadata.text).join("\n")}`
                }]
            }]

            // console.log([...ltm,...stm]);
            console.log(ltm[0]);
            console.log(stm);


            // 6. Generate AI response using chat history
            const response = await aiService.generateResponse([...ltm, ...stm])

            // 7. Save AI's response in DB and Generate vector for AI response

            //  Send AI response back to client
            socket.emit('ai-response', {
                content: response,
                chat: messagePayload.chat
            })

            const [responseMessage,resVectors]=await Promise.all([
                messageModel.create({
                chat: messagePayload.chat,
                user: socket.user._id,
                content: response,
                role: "model"
            }),
            aiService.generateVector(response)
            ])

            // 9. Store AI response vector into memory DB(PineCone)
            await createMemory({
                vectors: resVectors,
                messageId: responseMessage._id,
                metadata: {
                    chat: messagePayload.chat,
                    user: socket.user._id,
                    text: response
                }
            })

        })

    })
}


module.exports = initSocketServer;
