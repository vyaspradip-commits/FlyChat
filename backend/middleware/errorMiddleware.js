function notFound(req,res) { res.status(404).json({success:false,message:"API route not found",path:req.originalUrl}); }
function errorHandler(err,req,res,next) { if(res.headersSent) return next(err); console.error(err); const status=Number(err.status || err.statusCode) || 500; res.status(status).json({success:false,message:status<500 ? err.message : (process.env.NODE_ENV==="development" ? err.message : "Internal server error")}); }
module.exports = { notFound, errorHandler };
