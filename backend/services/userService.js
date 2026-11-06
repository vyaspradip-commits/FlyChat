const {db,now}=require("./firestoreService"); const users=db.collection("users");
const safe=d=>{const x={uid:d.id,...d.data()};delete x.password;return x;};
async function getAllUsers(){const s=await users.get();return s.docs.map(safe);}
async function getUserById(uid){const d=await users.doc(uid).get();if(!d.exists){const e=new Error("User not found");e.status=404;throw e;}return safe(d);}
async function getProfile(uid){return getUserById(uid);}
async function updateProfile(uid,updates){const allowed={};for(const k of ["name","photoURL","about"]){if(updates[k]!==undefined)allowed[k]=updates[k];}allowed.updatedAt=now();await users.doc(uid).update(allowed);return getUserById(uid);}
async function deleteUser(uid){await users.doc(uid).delete();return {uid,deleted:true};}
async function searchUsers(term){if(!term)return [];const all=await getAllUsers();const t=term.toLowerCase();return all.filter(u=>(u.name||"").toLowerCase().includes(t)||(u.email||"").toLowerCase().includes(t));}
async function updateStatus(uid,status){if(!["online","offline","away"].includes(status))throw new Error("Status must be online, offline or away");await users.doc(uid).update({status,updatedAt:now()});return getUserById(uid);}
module.exports={getAllUsers,getUserById,getProfile,updateProfile,deleteUser,searchUsers,updateStatus};
