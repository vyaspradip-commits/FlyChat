const {db,now}=require("./firestoreService");const {v4:uuidv4}=require("uuid");const col=db.collection("notifications");
async function sendNotification(data,uid){const id=uuidv4(),n={userId:data.userId||uid,title:data.title,body:data.body,data:data.data||{},isRead:false,createdAt:now()};await col.doc(id).set(n);return {id,...n};}
async function getNotifications(uid){const s=await col.where("userId","==",uid).get();return s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));}
async function getNotificationById(id,uid){const d=await col.doc(id).get();if(!d.exists||d.data().userId!==uid)throw new Error("Notification not found");return {id:d.id,...d.data()};}
async function markAsRead(id,uid){await getNotificationById(id,uid);await col.doc(id).update({isRead:true,readAt:now()});return getNotificationById(id,uid);}
async function deleteNotification(id,uid){await getNotificationById(id,uid);await col.doc(id).delete();return {id,deleted:true};}
async function deleteAllNotifications(uid){const s=await col.where("userId","==",uid).get();const b=db.batch();s.docs.forEach(d=>b.delete(d.ref));await b.commit();return {deletedCount:s.size};}
async function getUnreadCount(uid){const s=await col.where("userId","==",uid).where("isRead","==",false).get();return {count:s.size};}
module.exports={sendNotification,getNotifications,getNotificationById,markAsRead,deleteNotification,deleteAllNotifications,getUnreadCount};
