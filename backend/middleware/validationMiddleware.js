const check = (fields) => (req,res,next) => { for (const field of fields) { const value=req.body?.[field]; if(value===undefined || value===null || value==="") return res.status(400).json({success:false,message:`${field} is required`}); } next(); };
const validateRegister=(req,res,next)=>{ if(!req.body?.name || !req.body?.email || !req.body?.password) return res.status(400).json({success:false,message:"name, email and password are required"}); if(!/^\S+@\S+\.\S+$/.test(req.body.email)) return res.status(400).json({success:false,message:"Valid email is required"}); if(String(req.body.password).length<6) return res.status(400).json({success:false,message:"Password must contain at least 6 characters"}); next(); };
const validateLogin=check(["email","password"]);
const validateMessage=(req,res,next)=>{ if(!req.body?.chatId) return res.status(400).json({success:false,message:"chatId is required"}); if(!req.body?.message && !req.body?.fileUrl) return res.status(400).json({success:false,message:"message or fileUrl is required"}); next(); };
const validateGroup=check(["name"]);
const validateProfile=(req,res,next)=>{ if(req.body?.email || req.body?.password || req.body?.uid) return res.status(400).json({success:false,message:"Email, password and uid cannot be changed here"}); next(); };
const validateNotification=check(["title","body"]);
const validateUpload=(req,res,next)=>next();
module.exports = {
    validateRegister,
    validateLogin,
    validateMessage,
    validateGroup,
    validateProfile,
    validateNotification,
    validateUpload
};