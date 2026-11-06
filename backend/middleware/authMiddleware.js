const jwt = require("jsonwebtoken");
const verifyToken = (req, res, next) => {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return res.status(401).json({ success:false, message:"Bearer token required" });
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(503).json({ success:false, message:"JWT_SECRET is not configured in .env" });
    try { req.user = jwt.verify(header.slice(7), secret); return next(); }
    catch { return res.status(401).json({ success:false, message:"Invalid or expired token" }); }
};
const isAdmin = (req,res,next) => req.user?.role === "admin" ? next() : res.status(403).json({success:false,message:"Admin access required"});
const optionalAuth = (req,res,next) => { const h=req.headers.authorization||""; if(h.startsWith("Bearer ") && process.env.JWT_SECRET){try{req.user=jwt.verify(h.slice(7),process.env.JWT_SECRET)}catch{}} next(); };
module.exports = { verifyToken, authenticate:verifyToken, isAdmin, optionalAuth };
