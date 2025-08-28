
const userModel=require('../Models/user.models')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')

//register controller passed in indexRoutes.....
async function registerUser(req,res) {
    
    const {fullName:{firstName,lastName} ,email,password}=req.body
    
    //If User already exist--->
    const isUserAlreaadyExist=await userModel.findOne({email})
    if(isUserAlreaadyExist){
        return res.status(400).json({
            message:"User Already Exist"
        })
    }
    
    //hasing password making to secure--->
    const hashPassword=await bcrypt.hash(password,10)
    
    //creating a new user or Registring a new user---> 
    const user=await userModel.create({
        fullName:{
            firstName,
            lastName
        },
        email:email,
        password:hashPassword
    })
    
    //creating a token for our particular id--->
    const token=jwt.sign({id:user._id},process.env.JWT_SECRET)
    
    res.cookie("token",token)
    
    res.status(201).json({
        message:"User Registerd successfully...",
        user:{
            email:user.email,
            _id:user._id,
            fullName:user.fullName
        }
    })
}

//login controller passed in indexRoutes.....
async function loginUser(req,res) { 
    const {email,password}=req.body

    const user=await userModel.findOne({email})

    if(!user){
        res.status(400).json({
            message:"Invalid email or password!"
        })
    }
    const isPasswordValid=await bcrypt.compare(password,user.password)
    if(!isPasswordValid){
        return res.status(400).json({
            message:"Invalid Password!"
        })
    }
    const token=jwt.sign({id:user._id},process.env.JWT_SECRET)

    res.cookie("cookie",token)

    res.status(200).json({
        message:"User Logged In successfully..",
        user:{
            email:user.email,
            _id:user.id,
            fullName:user.fullName
        }
    })
}

module.exports={
    registerUser,
    loginUser
}