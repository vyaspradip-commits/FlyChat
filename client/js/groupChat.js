// =========================
// GET CURRENT GROUP
// =========================

function getCurrentGroupKey() {

    const groupId =
        sessionStorage.getItem("currentGroupId");

    if (!groupId) {

        console.log("No current group selected.");

        return null;
    }

    return groupId;
}


// =========================
// GET CURRENT GROUP DATA
// =========================

function getCurrentGroup() {

    const groupId =
        getCurrentGroupKey();

    if (!groupId) {
        return null;
    }

    const groups =
        loadData("groups") || [];

    const group =
        groups.find(function(item) {

            return String(item.id) === String(groupId);

        });

    if (!group) {

        console.log(
            "Group not found:",
            groupId
        );

        return null;
    }

    return group;
}


// =========================
// LOAD GROUP INFORMATION
// =========================

function loadGroupInformation() {

    const group =
        getCurrentGroup();

    if (!group) {

        console.log("Group information not found.");

        return;
    }

    const title =
        document.getElementById("groupTitle");

    const image =
        document.getElementById("groupProfileImage");

    if (title) {

        title.textContent =
            group.name || "Group";

    }

    if (image) {

        image.src =
            group.image || "images/user.png";

    }

    console.log(
        "Current group:",
        group
    );
}

// =========================
// GROUP MESSAGE SYNC
// =========================

let renderedGroupMessageIds = new Set();
let lastSyncedGroupId = null;
let groupSyncInProgress = false;

async function loadGroupMessages() {

    const box =
        document.getElementById("groupMessages");

    if (!box) {
        return;
    }

    const groupId =
        sessionStorage.getItem("currentGroupId");

    if (!groupId) {
        console.error("Group ID not found.");
        return;
    }

    // =========================================
    // NEW / DIFFERENT GROUP
    // =========================================

    if (lastSyncedGroupId !== groupId) {

        lastSyncedGroupId =
            groupId;

        renderedGroupMessageIds =
            new Set();

        box.innerHTML = "";
    }

    // =========================================
    // PREVENT DUPLICATE REQUESTS
    // =========================================

    if (groupSyncInProgress) {
        return;
    }

    groupSyncInProgress = true;

    try {

        const response =
            await fetch(
                `/api/groups/${encodeURIComponent(groupId)}/messages?t=${Date.now()}`,
                {
                    method: "GET",
                    cache: "no-store",
                    headers: {
                        "Cache-Control": "no-cache"
                    }
                }
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {

            console.error(
                "Could not load group messages:",
                result.message
            );

            return;
        }

        const messages =
            Array.isArray(result.messages)
                ? result.messages
                : [];

        let newMessageAdded = false;

        // =========================================
        // ADD ONLY NEW MESSAGES
        // =========================================

        messages.forEach(function(message) {

            const messageId =
                String(
                    message.id ||
                    message._id ||
                    (
                        message.senderId +
                        "_" +
                        message.date +
                        "_" +
                        message.time +
                        "_" +
                        message.text
                    )
                );

            if (
                renderedGroupMessageIds.has(
                    messageId
                )
            ) {
                return;
            }

            renderedGroupMessageIds.add(
                messageId
            );

            createGroupMessage(
                message
            );

            newMessageAdded = true;
        });

        // =========================================
        // NEW GROUP MESSAGE
        // MOVE THIS GROUP TO TOP
        // =========================================

        if (newMessageAdded) {

            box.scrollTop =
                box.scrollHeight;

            const chatContainer =
                document.getElementById(
                    "chatContainer"
                );

            if (chatContainer) {

                const groupItem =
                    chatContainer.querySelector(
                        `[data-chat-type="group"][data-group-id="${CSS.escape(String(groupId))}"]`
                    );

                if (groupItem) {

                    // Update latest activity
                    groupItem.dataset.lastActivity =
                        new Date().toISOString();

                    // IMPORTANT:
                    // Move only inside chatContainer.
                    // NEVER prepend to .chat-list,
                    // otherwise it can appear above
                    // the search bar.

                    chatContainer.prepend(
                        groupItem
                    );

                    console.log(
                        "Latest group moved to top:",
                        groupId
                    );
                }
                else {

                    console.log(
                        "Group chat item not found:",
                        groupId
                    );
                }
            }
        }

    } catch (error) {

        console.error(
            "Load group messages error:",
            error
        );

    } finally {

        groupSyncInProgress = false;
    }
}


// =========================
// SEND GROUP MESSAGE
// =========================

async function sendGroupMessage() {

    const input =
        document.getElementById(
            "groupMessageInput"
        );

    if (!input) {
        return;
    }

    const text =
        input.value.trim();

    if (text === "") {
        return;
    }

    const groupId =
        currentGroupId ||
        sessionStorage.getItem("currentGroupId");

    if (!groupId) {

        alert(
            "Group ID not found."
        );

        return;
    }

    const currentUser =
        getCurrentUser();

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;
    }

    try {

        const response =
            await fetch(
                `/api/groups/${encodeURIComponent(groupId)}/messages`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        senderId:
                            currentUser.id,

                        senderEmail:
                            currentUser.email,

                        senderName:
                            currentUser.name,

                        text:
                            text
                    })
                }
            );

        const result =
            await response.json();

        if (!response.ok || !result.success) {

            console.error(
                "Group message send failed:",
                result
            );

            alert(
                result.message ||
                "Unable to send message."
            );

            return;
        }

        // =========================
        // UPDATE CHAT LIST
        // MESSAGE SUCCESSFULLY SENT
        // =========================

        updateChatActivityAndReorder(
            "group",
            groupId
        );

        console.log(
            "Group message sent:",
            result.message
        );

        createGroupMessage(
            result.message
        );

        input.value = "";

        input.focus();

    } catch (error) {

        console.error(
            "Send group message error:",
            error
        );

        alert(
            "Unable to connect to FlyChat server."
        );
    }
}


// =========================
// CREATE GROUP MESSAGE
// =========================

function createGroupMessage(message) {

    const box =
        document.getElementById(
            "groupMessages"
        );

    if (!box) {
        return;
    }
    if (message.id) {
        renderedGroupMessageIds.add(String(message.id));
    }
    const currentUser =
        getCurrentUser();

    if (!currentUser) {
        return;
    }


    // =========================
    // FIND SENDER
    // =========================

    const senderEmail = message.senderEmail || message.snederEmail || "";

    const normalizedSenderEmail =
        senderEmail
            .toLowerCase()
            .trim();

    const currentEmail =
        currentUser.email
            .toLowerCase()
            .trim();


    let isMine =
        normalizedSenderEmail ===
        currentEmail;


    // Old messages compatibility
    if (!senderEmail && message.sender) {

        isMine =
            message.sender
                .toLowerCase()
                .trim() ===
            currentUser.name
                .toLowerCase()
                .trim();

    }


    // =========================
    // SENDER NAME
    // =========================

    const senderName =
        message.senderName ||
        message.sender ||
        "Unknown";


    // =========================
    // MESSAGE DIV
    // =========================

    const div =
        document.createElement("div");

    div.className = isMine ? "message sent" : "message received";
    if (message.type === "file") {

        div.innerHTML = `

            <div class="message-sender">
                <b>
                    ${escapeHTML(
                        message.senderName ||
                        message.sender ||
                        "Unknown"
                    )}
                </b>
            </div>

            <div class="file-info">

                <span class="file-icon">
                    ${getFileIcon(message.fileName || "File")}
                </span>

                <div class="file-details">

                    <b>
                        ${escapeHTML(
                            message.fileName ||
                            "Shared File"
                        )}
                    </b>

                    <small>
                        ${formatFileSize(
                            message.fileSize || 0
                        )}
                    </small>

                </div>

            </div>

            <div class="file-actions">

                <a
                    href="${message.fileUrl}"
                    target="_blank"
                    download="${escapeHTML(
                        message.fileName || "file"
                    )}"
                    class="file-download-btn">
                    ⬇ Download
                </a>

            </div>

            <small class="message-time">

                ${message.time || ""}

                ${
                    message.date
                        ? " | " + message.date
                        : ""
                }

            </small>

        `;

        box.appendChild(div);

        box.scrollTop =
            box.scrollHeight;

        return;
    }


    // =========================
    // SENDER NAME
    // =========================

    div.innerHTML = `

        <div class="message-sender">
            <b>
                ${escapeHTML(senderName)}
            </b>
        </div>

        <div class="message-text">
            ${escapeHTML(message.text)}
        </div>

        <small class="message-time">

            ${message.time || ""}

            ${
                message.date
                    ? " | " + message.date
                    : ""
            }

            ${
                isMine
                    ? " " + (
                        message.status ||
                        "sent"
                    )
                    : ""
            }

        </small>

    `;


    box.appendChild(div);


    box.scrollTop =
        box.scrollHeight;
}


// =========================
// ENTER KEY
// =========================

function initializeGroupEnter() {

    const input =
        document.getElementById(
            "groupMessageInput"
        );

    if (!input) {
        return;
    }


    input.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                event.preventDefault();

                sendGroupMessage();

            }

        }
    );
}


// =========================
// INITIALIZE GROUP PAGE
// =========================

function initializeGroupPage() {

    console.log("Initializing group page...");

    loadGroupInformation();
    loadGroupMessages();
    if (window.groupMessageSyncTimer) {
        clearInterval(
            window.groupMessageSyncTimer
        );
    }

    window.groupMessageSyncTimer =
        setInterval(function () {

            loadGroupMessages();

        }, 1500);
    initializeGroupEnter();

    if (typeof initializeGroupEmoji === "function") {
        initializeGroupEmoji();
    }

    if (typeof initializeGroupFileSharing === "function") {
        initializeGroupFileSharing();
    }

    const sendButton =
        document.getElementById("groupSendButton");

    if (sendButton) {
        sendButton.addEventListener(
            "click",
            sendGroupMessage
        );
    }

    // Refresh messages from server every 1.5 seconds
    setInterval(function () {
        loadGroupMessages();
    }, 1500);
}

const emojiBtn = document.getElementById("groupEmojiBtn");
const emojiBox = document.getElementById("groupEmojiBox");
const fileBtn = document.getElementById("groupAttachBtn");
const fileInput = document.getElementById("groupFileInput");

if (emojiBtn && emojiBox) {
    emojiBtn.onclick = function () {
        emojiBox.style.display =
            emojiBox.style.display === "block" ? "none" : "block";
    };

    emojiBox.querySelectorAll("button").forEach(function (button) {
        button.onclick = function () {
            const input = document.getElementById("groupMessageInput");
            input.value += button.textContent;
            input.focus();
            emojiBox.style.display = "none";
        };
    });
}

if (fileBtn && fileInput) {
    fileBtn.onclick = function () {
        fileInput.click();
    };
}

let groupMessageRefreshInterval = null;

function initializeGroupPage() {
    console.log("Initializing group page...");
    loadGroupInformation();
    loadGroupMessages();
    setInterval(function(){
        loadGroupMessages()
    }, 1500);
    initializeGroupEnter();
    if (typeof initializeGroupEmoji === "function") {
        initializeGroupEmoji();
    }
    if (typeof initializeGroupFileSharing === "function") {
        initializeGroupFileSharing();
    }
    const sendButton = document.getElementById("groupSendButton");
    if (sendButton) {
        sendButton.addEventListener("click", sendGroupMessage);
    }
    if (groupMessageRefreshInterval) {
        clearInterval(groupMessageRefreshInterval);
    }
    groupMessageRefreshInterval = setInterval(function() {
        loadGroupMessages();
    }, 1500);
}

document.addEventListener("DOMContentLoaded", initializeGroupPage);