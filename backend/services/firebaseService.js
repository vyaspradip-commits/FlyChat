
const { db, auth, bucket, admin } = require("../config/firebase");

const getDocument = async (collection, id) => {
    const doc = await db.collection(collection).doc(id).get();

    if (!doc.exists) {
        return null;
    }

    return { id: doc.id, ...doc.data() };
};

const createDocument = async (collection, data, id = null) => {
    const docRef = id
        ? db.collection(collection).doc(id)
        : db.collection(collection).doc();

    const documentData = {
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.set(documentData);

    return { id: docRef.id, ...documentData };
};

const updateDocument = async (collection, id, data) => {
    const docRef = db.collection(collection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
        throw new Error("Document not found");
    }

    const updateData = {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.update(updateData);

    return getDocument(collection, id);
};

const deleteDocument = async (collection, id) => {
    const docRef = db.collection(collection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
        throw new Error("Document not found");
    }

    await docRef.delete();

    return { id, deleted: true };
};

const getCollection = async (collection, field = null, value = null) => {
    let query = db.collection(collection);

    if (field !== null) {
        query = query.where(field, "==", value);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }));
};

const uploadFile = async (filePath, destination, metadata = {}) => {
    const [file] = await bucket.upload(filePath, {
        destination,
        metadata: {
            metadata
        }
    });

    return {
        name: file.name,
        url: `gs://${bucket.name}/${file.name}`
    };
};

const deleteFile = async (fileName) => {
    await bucket.file(fileName).delete();

    return { deleted: true, fileName };
};

const verifyToken = async (token) => {
    return auth.verifyIdToken(token);
};

const createAuthUser = async (userData) => {
    return auth.createUser(userData);
};

const getAuthUser = async (uid) => {
    return auth.getUser(uid);
};

const deleteAuthUser = async (uid) => {
    await auth.deleteUser(uid);

    return { uid, deleted: true };
};

module.exports = {
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    getCollection,
    uploadFile,
    deleteFile,
    verifyToken,
    createAuthUser,
    getAuthUser,
    deleteAuthUser
};
