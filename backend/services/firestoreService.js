const { db, admin } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");
const now = () => new Date().toISOString();
async function list(collection, field, value) { let q=db.collection(collection); if(field) q=q.where(field,"==",value); const s=await q.get(); return s.docs.map(d=>({id:d.id,...d.data()})); }
async function get(collection,id) { const d=await db.collection(collection).doc(id).get(); if(!d.exists){const e=new Error("Record not found");e.status=404;throw e;} return {id:d.id,...d.data()}; }
async function create(collection,data,id) { const key=id||uuidv4(); const record={...data,createdAt:now(),updatedAt:now()}; await db.collection(collection).doc(key).set(record); return {id:key,...record}; }
async function update(collection,id,data) { const ref=db.collection(collection).doc(id); const d=await ref.get(); if(!d.exists){const e=new Error("Record not found");e.status=404;throw e;} const safe={...data,updatedAt:now()}; delete safe.id; delete safe.uid; delete safe.password; await ref.update(safe); return get(collection,id); }
async function remove(collection,id) { await get(collection,id); await db.collection(collection).doc(id).delete(); return {id,deleted:true}; }
module.exports={db,admin,now,list,get,create,update,remove};
