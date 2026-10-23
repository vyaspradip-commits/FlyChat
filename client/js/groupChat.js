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
// LOAD GROUP MESSAGES
// =========================

function loadGroupMessages() {

    const box =
        document.getElementById("groupMessages");

    if (!box) {
        return;
    }

    const key =
        getCurrentGroupKey();

    if (!key) {
        return;
    }

    box.innerHTML = "";

    const messages =
        loadData(key) || [];

    console.log(
        "Group messages:",
        messages
    );

    messages.forEach(function(message) {

        createGroupMessage(message);

    });

    box.scrollTop =
        box.scrollHeight;
}


// =========================
// SEND GROUP MESSAGE
// =========================

function sendGroupMessage() {

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

    const key =
        getCurrentGroupKey();

    if (!key) {

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

    const now =
        new Date();

    const message = {

        id:
            generateID(),

        senderId:
            currentUser.id,

        senderEmail:
            currentUser.email,

        senderName:
            currentUser.name,

        text:
            text,

        time:
            now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            }),

        date:
            now.toLocaleDateString(),

        status:
            "sent"

    };


    const messages =
        loadData(key) || [];

    messages.push(message);

    saveData(
        key,
        messages
    );


    createGroupMessage(message);

    input.value = "";

    input.focus();
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

    console.log(
        "Initializing group page..."
    );


    loadGroupInformation();

    loadGroupMessages();

    initializeGroupEnter();

    if (typeof initializeGroupEmoji === "function") {
        initializeGroupEmoji();
    }
    if (typeof initializeGroupFileSharing === "function") {
        initializeGroupFileSharing();
    }
    const sendButton =
        document.getElementById(
            "groupSendButton"
        );

    if (sendButton) {

        sendButton.addEventListener(
            "click",
            sendGroupMessage
        );

    }

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

document.addEventListener(
    "DOMContentLoaded",
    initializeGroupPage
);