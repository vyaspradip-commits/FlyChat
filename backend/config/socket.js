const {Server}=require("socket.io");let io;
function initializeSocket(server){io=new Server(server,{cors:{origin:process.env.CLIENT_ORIGIN?process.env.CLIENT_ORIGIN.split(","):"*",methods:["GET","POST","PUT","DELETE"]}});io.on("connection",socket=>{socket.on("joinRoom",room=>{if(typeof room==="string"&&room.length<200)socket.join(room)});socket.on("leaveRoom",room=>{if(typeof room==="string")socket.leave(room)});socket.on("disconnect",()=>{});});return io;}
function getIO(){if(!io)throw new Error("Socket.IO has not been initialized");return io;}
module.exports={initializeSocket,getIO};
