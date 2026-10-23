// =========================
// FILE ICON
// =========================

function getFileIcon(fileName) {

    const name =
        String(fileName || "").toLowerCase();

    const extension =
        name.includes(".")
            ? name.substring(
                name.lastIndexOf(".") + 1
            )
            : "";


    // =========================
    // IMAGES
    // =========================

    if (
        ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "ico"]
            .includes(extension)
    ) {
        return "🖼️";
    }


    // =========================
    // PDF
    // =========================

    if (extension === "pdf") {
        return "📕";
    }


    // =========================
    // WORD
    // =========================

    if (
        ["doc", "docx"].includes(extension)
    ) {
        return "📘";
    }


    // =========================
    // EXCEL
    // =========================

    if (
        ["xls", "xlsx", "csv"].includes(extension)
    ) {
        return "📊";
    }


    // =========================
    // POWERPOINT
    // =========================

    if (
        ["ppt", "pptx"].includes(extension)
    ) {
        return "📙";
    }


    // =========================
    // TEXT
    // =========================

    if (
        ["txt", "log"].includes(extension)
    ) {
        return "📝";
    }


    // =========================
    // ZIP / RAR
    // =========================

    if (
        ["zip", "rar", "7z", "tar", "gz"]
            .includes(extension)
    ) {
        return "🗜️";
    }


    // =========================
    // AUDIO
    // =========================

    if (
        ["mp3", "wav", "ogg", "m4a", "aac", "flac"]
            .includes(extension)
    ) {
        return "🎵";
    }


    // =========================
    // VIDEO
    // =========================

    if (
        ["mp4", "mkv", "avi", "mov", "webm", "3gp"]
            .includes(extension)
    ) {
        return "🎬";
    }


    // =========================
    // APK
    // =========================

    if (extension === "apk") {
        return "📱";
    }


    // =========================
    // CODE
    // =========================

    if (
        [
            "js",
            "html",
            "css",
            "php",
            "py",
            "java",
            "c",
            "cpp",
            "json",
            "xml"
        ].includes(extension)
    ) {
        return "💻";
    }


    // =========================
    // DEFAULT
    // =========================

    return "📄";
}


// =========================
// FILE SIZE
// =========================

function formatFileSize(bytes) {

    bytes =
        Number(bytes) || 0;

    if (bytes < 1024) {
        return bytes + " B";
    }

    if (bytes < 1024 * 1024) {
        return (
            (bytes / 1024).toFixed(1) +
            " KB"
        );
    }

    if (bytes < 1024 * 1024 * 1024) {
        return (
            (bytes / (1024 * 1024)).toFixed(1) +
            " MB"
        );
    }

    return (
        (bytes / (1024 * 1024 * 1024)).toFixed(1) +
        " GB"
    );
}


// =========================
// PRIVATE FILE SHARING
// =========================

function initializePrivateFileSharing() {

    const attachBtn =
        document.getElementById("attachBtn");

    const fileInput =
        document.getElementById("fileInput");

    if (!attachBtn || !fileInput) {
        return;
    }

    attachBtn.onclick = function () {
        fileInput.click();
    };

    fileInput.onchange = async function () {

        const file =
            fileInput.files[0];

        if (!file) {
            return;
        }

        await sendPrivateFile(file);

        fileInput.value = "";
    };
}


// =========================
// SEND PRIVATE FILE
// =========================

async function sendPrivateFile(file) {

    const currentUser =
        getCurrentUser();

    const chatUser =
        getChatUser();

    if (!currentUser || !chatUser) {

        alert("Chat user information not found.");

        return;
    }

    try {

        // =========================
        // UPLOAD FILE
        // =========================

        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );

        const uploadResponse =
            await fetch(
                "/api/chat/upload",
                {
                    method: "POST",
                    body: formData
                }
            );

        const uploadResult =
            await uploadResponse.json();

        console.log(
            "Private file upload result:",
            uploadResult
        );

        if (
            !uploadResponse.ok ||
            !uploadResult.success
        ) {

            alert(
                uploadResult.message ||
                "Unable to upload file."
            );

            return;
        }


        // =========================
        // SAVE FILE MESSAGE
        // =========================

        const fileData =
            uploadResult.file;

        const sendResponse =
            await fetch(
                "/api/chat/send-file",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        senderEmail:
                            currentUser.email,

                        receiverEmail:
                            chatUser.email,

                        fileName:
                            fileData.name,

                        fileUrl:
                            fileData.url,

                        fileSize:
                            fileData.size,

                        fileType:
                            fileData.type

                    })

                }
            );


        const sendResult =
            await sendResponse.json();

        console.log(
            "Private file message result:",
            sendResult
        );


        if (
            !sendResponse.ok ||
            !sendResult.success
        ) {

            alert(
                sendResult.message ||
                "File message could not be sent."
            );

            return;
        }


        // =========================
        // SHOW FILE IMMEDIATELY
        // =========================

        const box =
            document.getElementById(
                "messages"
            );

        if (box) {

            createPrivateMessage(
                sendResult.message
            );

        }

    }
    catch (error) {

        console.error(
            "Private file sharing error:",
            error
        );

        alert(
            "Unable to send file."
        );
    }
}


// =========================
// SEND PRIVATE FILE
// =========================

async function sendPrivateFile(file) {

    const currentUser =
        getCurrentUser();

    const chatUser =
        getChatUser();

    if (!currentUser || !chatUser) {
        alert("Chat user information not found.");
        return;
    }

    try {

        // =========================
        // UPLOAD FILE
        // =========================

        const formData =
            new FormData();

        formData.append("file", file);

        const uploadResponse =
            await fetch("/api/chat/upload", {
                method: "POST",
                body: formData
            });

        const uploadResult =
            await uploadResponse.json();
        if (!uploadResponse.ok ||
            !uploadResult.success) {

            alert(
                uploadResult.message ||
                "Unable to upload file."
            );

            return;
        }

        console.log(
            "Private file uploaded:",
            uploadResult
        );


        // =========================
        // FILE INFORMATION
        // =========================

        const uploadedFile =
            uploadResult.file;

        if (!uploadedFile ||
            !uploadedFile.url) {

            alert("File upload response is invalid.");
            return;
        }


        // =========================
        // SAVE FILE MESSAGE
        // =========================

        const response =
            await fetch("/api/chat/send", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    senderEmail:
                        currentUser.email,

                    receiverEmail:
                        chatUser.email,

                    text:
                        "📎 " + uploadedFile.name,

                    file: {

                        name:
                            uploadedFile.name,

                        filename:
                            uploadedFile.filename,

                        url:
                            uploadedFile.url,

                        size:
                            uploadedFile.size,

                        type:
                            uploadedFile.type

                    }

                })

            });


        const result =
            await response.json();


        if (!response.ok ||
            !result.success) {

            console.error(
                "File message save error:",
                result
            );

            alert(
                result.message ||
                "File could not be shared."
            );

            return;
        }


        // =========================
        // REFRESH CHAT
        // =========================

        await loadPrivateMessages();

        console.log(
            "Private file shared successfully."
        );

    }
    catch (error) {

        console.error(
            "Private file sharing error:",
            error
        );

        alert(
            "Unable to share file."
        );
    }
}


// =========================
// GROUP FILE SHARING
// =========================

function initializeGroupFileSharing() {

    const attachBtn =
        document.getElementById(
            "groupAttachBtn"
        );

    const fileInput =
        document.getElementById(
            "groupFileInput"
        );


    if (!attachBtn || !fileInput) {
        return;
    }


    attachBtn.onclick = function () {

        fileInput.click();

    };


    fileInput.onchange = async function () {

        const file =
            fileInput.files[0];

        if (!file) {
            return;
        }


        await sendGroupFile(file);


        fileInput.value = "";

    };

}


// =========================
// SEND GROUP FILE
// =========================

async function sendGroupFile(file) {

    const currentUser =
        getCurrentUser();


    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;
    }


    const groupId =
        sessionStorage.getItem(
            "currentGroupId"
        );


    if (!groupId) {

        alert(
            "Group ID not found."
        );

        return;
    }


    try {

        // Upload physical file
        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );


        const uploadResponse =
            await fetch(
                "/upload",
                {
                    method: "POST",
                    body: formData
                }
            );


        const uploadResult =
            await uploadResponse.json();


        if (
            !uploadResponse.ok ||
            !uploadResult.success
        ) {

            alert(
                uploadResult.message ||
                "File upload failed."
            );

            return;
        }


        // Create group file message
        const message = {

            id:
                generateID(),

            senderId:
                currentUser.id,

            senderEmail:
                currentUser.email,

            senderName:
                currentUser.name,

            type:
                "file",

            fileName:
                uploadResult.fileName,

            fileUrl:
                uploadResult.fileUrl,

            fileSize:
                file.size,

            time:
                new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                }),

            date:
                new Date().toLocaleDateString(),

            status:
                "sent"

        };


        const messages =
            loadData(groupId) || [];


        messages.push(message);


        saveData(
            groupId,
            messages
        );


        createGroupMessage(
            message
        );

    }
    catch (error) {

        console.error(
            "Group file sharing error:",
            error
        );

        alert(
            "Unable to upload file."
        );

    }

}