const mongoose=require('mongoose')

async function connectDB(){

    try {
    
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to DB");

    } catch (error) {
        console.error("Error in connecting database to mongonDB",error)    
    }
    
}

module.exports=connectDB