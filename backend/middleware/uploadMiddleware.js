const multer=require("multer");const path=require("path");const fs=require("fs");const dir=path.join(__dirname,"..","uploads");if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});
const storage=multer.diskStorage({destination:(req,file,cb)=>cb(null,dir),filename:(req,file,cb)=>cb(null,`${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname).toLowerCase()}`)});
const upload=multer({storage,limits:{fileSize:10*1024*1024},fileFilter:(req,file,cb)=>{if(file.originalname.includes(".."))return cb(new Error("Invalid filename"));cb(null,true);}});
module.exports={upload};
