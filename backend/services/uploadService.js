const fs=require("fs");const path=require("path");const dir=path.join(__dirname,"..","uploads");if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});
function metadata(file){return {fileId:file.filename,originalName:file.originalname,mimetype:file.mimetype,size:file.size,url:`/uploads/${encodeURIComponent(file.filename)}`,createdAt:new Date().toISOString()};}
async function uploadImage(file){if(!file.mimetype.startsWith("image/"))throw new Error("Only image files are allowed");return metadata(file);}
async function uploadFile(file){return metadata(file);}
async function getFiles(){return fs.readdirSync(dir).filter(n=>n!==".gitkeep").map(fileId=>({fileId,url:`/uploads/${encodeURIComponent(fileId)}`}));}
async function getFileById(id){const filePath=path.join(dir,path.basename(id));if(!fs.existsSync(filePath))throw new Error("File not found");return {fileId:path.basename(id),url:`/uploads/${encodeURIComponent(path.basename(id))}`};}
async function deleteFile(id){const filePath=path.join(dir,path.basename(id));if(!fs.existsSync(filePath))throw new Error("File not found");fs.unlinkSync(filePath);return {fileId:id,deleted:true};}
async function downloadFile(id){return getFileById(id);}
async function uploadMultipleFiles(files){return files.map(metadata);}
module.exports={uploadImage,uploadFile,getFiles,getFileById,deleteFile,downloadFile,uploadMultipleFiles};
