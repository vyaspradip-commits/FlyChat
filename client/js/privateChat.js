// =========================
// GET CURRENT CHAT USER
// =========================
let currentPrivateChatUser = null;
function getChatUser() {
    if (currentPrivateChatUser) {
        return currentPrivateChatUser;
    }
    const users = loadData("users") || [];
    const chatTitle = document.getElementById("chatTitle");

    if (!chatTitle) {
        console.log("Chat title not found.");
        return null;
    }

    const chatName = chatTitle.textContent.trim();

    if (!chatName) {
        console.log("Chat name is empty.");
        return null;
    }

    const user = users.find(function (user) {
        return (
            user.name &&
            user.name.toLowerCase() === chatName.toLowerCase()
        );
    });

    if (!user) {
        console.log("User not found:", chatName);
    }

    return user || null;
}


// =========================
// LOAD PRIVATE MESSAGES
// =========================

async function loadPrivateMessages() {
    if (!currentChat) {
        return;
    }

    const box = document.getElementById("messages");

    if (!box) {
        return;
    }

    const currentUser = getCurrentUser();
    const chatUser = getChatUser();

    if (!currentUser || !chatUser) {
        console.log("User information not found.");
        return;
    }

    try {
        const response = await fetch(
            `/api/chat/messages?userEmail=${encodeURIComponent(currentUser.email)}&otherEmail=${encodeURIComponent(chatUser.email)}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error("Could not load messages:", result.message);
            return;
        }

        box.innerHTML = "";

        (result.messages || []).forEach(function (message) {
            createPrivateMessage(message);
        });

        box.scrollTop = box.scrollHeight;

        // Status updates are separate from rendering.
        // They do not clear/rebuild the chat every 2 seconds.
        await fetch("/api/chat/delivered", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userEmail: currentUser.email,
                senderEmail: chatUser.email
            })
        });

        await fetch("/api/chat/read", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userEmail: currentUser.email,
                senderEmail: chatUser.email
            })
        });
    } catch (error) {
        console.error("Load messages error:", error);
    }
}


// =========================
// SEND TEXT MESSAGE
// =========================

async function sendMessage() {
    const input = document.getElementById("messageInput");

    if (!input) {
        return;
    }

    const text = input.value.trim();

    if (text === "") {
        return;
    }

    const currentUser = getCurrentUser();
    const chatUser = getChatUser();

    if (!currentUser || !chatUser) {
        alert("Chat user information not found.");
        return;
    }

    try {
        const response = await fetch("/api/chat/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                senderEmail: currentUser.email,
                receiverEmail: chatUser.email,
                text: text
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.message || "Message could not be sent.");
            return;
        }

        input.value = "";
        await loadPrivateMessages();
        input.focus();
    } catch (error) {
        console.error("Send message error:", error);
        alert("Unable to connect to FlyChat server.");
    }
}


// =========================
// CREATE PRIVATE MESSAGE UI
// =========================

function createPrivateMessage(message) {

    const box =
        document.getElementById("messages");

    if (!box) {
        return;
    }

    const currentUser =
        getCurrentUser();

    if (!currentUser) {
        return;
    }


    // =========================
    // MESSAGE ID
    // =========================

    const div =
        document.createElement("div");

    const messageId =
        String(
            message.id ||
            message._id ||
            generateID()
        );

    div.dataset.messageId =
        messageId;


    // =========================
    // SENDER
    // =========================

    const senderEmail =
        String(
            message.senderEmail || ""
        ).toLowerCase();

    const currentEmail =
        String(
            currentUser.email || ""
        ).toLowerCase();

    const isMine =
        senderEmail === currentEmail;


    div.className =
        isMine
            ? "message sent"
            : "message received";


    // =========================
    // MESSAGE TIME + STATUS
    // =========================

    const timeHtml = `

        <div class="message-time">

            ${escapeHTML(message.time || "")}

            ${
                message.date
                    ? " | " +
                      escapeHTML(message.date)
                    : ""
            }

            ${
                isMine
                    ? `
                        <span
                            class="message-status ${
                                message.status === "read"
                                    ? "read"
                                    : ""
                            }">

                            ${
                                message.status === "sent"
                                    ? "✓"
                                    : "✓✓"
                            }

                        </span>
                    `
                    : ""
            }

        </div>

    `;


    // =========================
    // FILE MESSAGE
    // =========================

    if (
        message.file &&
        message.file.url
    ) {

        const fileName =
            message.file.name ||
            "Shared File";

        const fileSize =
            Number(message.file.size) || 0;

        const fileUrl =
            message.file.url;

        div.innerHTML = `

            <div class="file-info">

                <span class="file-icon">

                    ${getFileIcon(fileName)}

                </span>


                <div class="file-details">

                    <b>
                        ${escapeHTML(fileName)}
                    </b>

                    <small>
                        ${formatFileSize(fileSize)}
                    </small>

                </div>

            </div>


            <div class="file-actions">

                <a
                    href="${escapeHTML(fileUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    download="${escapeHTML(fileName)}"
                    class="file-download-btn">

                    ⬇ Download

                </a>

            </div>


            ${timeHtml}

        `;

        box.appendChild(div);

        box.scrollTop =
            box.scrollHeight;

        return;
    }


    // =========================
    // TEXT MESSAGE
    // =========================

    div.innerHTML = `

        <div class="message-text">

            ${escapeHTML(message.text || "")}

        </div>

        ${timeHtml}

    `;


    box.appendChild(div);

    box.scrollTop =
        box.scrollHeight;
}


// =========================
// ENTER KEY
// =========================

function initializePrivateEnter() {
    const input = document.getElementById("messageInput");

    if (!input || input.dataset.enterInitialized === "true") {
        return;
    }

    input.dataset.enterInitialized = "true";

    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });
}


// =========================
// REFRESH ONLY MESSAGE STATUS
// =========================

async function refreshMessageStatus() {
    if (!currentChat || currentChatType !== "private") {
        return;
    }

    const currentUser = getCurrentUser();
    const chatUser = getChatUser();
    const box = document.getElementById("messages");

    if (!currentUser || !chatUser || !box) {
        return;
    }

    try {
        const response = await fetch(
            `/api/chat/messages?userEmail=${encodeURIComponent(currentUser.email)}&otherEmail=${encodeURIComponent(chatUser.email)}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            return;
        }

        (result.messages || []).forEach(function (message) {
            const messageId = String(message.id || message._id || "");

            if (!messageId) {
                return;
            }

            const existingMessage = box.querySelector(
                `[data-message-id="${messageId}"]`
            );

            // Add only genuinely new messages.
            if (!existingMessage) {
                createPrivateMessage(message);
                return;
            }

            // Update only the status ticks of our existing message.
            const isMine =
                String(message.senderEmail || "").toLowerCase() ===
                String(currentUser.email || "").toLowerCase();

            if (!isMine) {
                return;
            }

            const status = existingMessage.querySelector(".message-status");

            if (status) {
                status.textContent =
                    message.status === "sent" ? "✓" : "✓✓";

                status.classList.toggle(
                    "read",
                    message.status === "read"
                );
            }
        });
    } catch (error) {
        console.error("Message status refresh error:", error);
    }
}


// Run status checking every 2 seconds without rebuilding the chat.
setInterval(function () {
    if (currentChat && currentChatType === "private") {
        refreshMessageStatus();
    }
}, 2000);
