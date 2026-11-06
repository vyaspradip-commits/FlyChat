const s=require("../services/uploadService");
const run=fn=>async(req,res,next)=>{try{const data=await fn(req);res.json({success:true,data});}catch(e){next(e)}};
const uploadImage=run(req=>{if(!req.file)throw Object.assign(new Error("image file is required"),{status:400});return s.uploadImage(req.file)});
const uploadFile=run(req=>{if(!req.file)throw Object.assign(new Error("file is required"),{status:400});return s.uploadFile(req.file)});
module.exports={uploadImage,uploadFile,getFiles:run(()=>s.getFiles()),getFileById:run(req=>s.getFileById(req.params.fileId)),deleteFile:run(req=>s.deleteFile(req.params.fileId)),downloadFile:run(req=>s.downloadFile(req.params.fileId)),uploadMultipleFiles:run(req=>s.uploadMultipleFiles(req.files||[]))};
