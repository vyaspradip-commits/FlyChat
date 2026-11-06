const service=require("../services/authService");
const wrap=fn=>async(req,res,next)=>{try{const data=await fn(req,res);if(data!==undefined&&!res.headersSent)res.json({success:true,data});}catch(e){next(e)}};
const register=wrap(async(req,res)=>{const data=await service.register(req.body);res.status(201).json({success:true,message:"Registration successful",data});});
const login=wrap(async(req,res)=>{const data=await service.login(req.body);res.json({success:true,message:"Login successful",data});});
const forgotPassword=wrap(async(req,res)=>{const data=await service.forgotPassword(req.body.email);res.json({success:true,...data});});
const verifyEmail=wrap(async(req,res)=>{const data=await service.verifyEmail(req.body.uid);res.json({success:true,data});});
const logout=wrap(async(req,res)=>{const data=await service.logout(req.user.uid);res.json({success:true,...data});});
const me=wrap(async(req,res)=>{const data=await service.getUser(req.user.uid);res.json({success:true,data});});
module.exports={register,login,forgotPassword,verifyEmail,logout,me};
