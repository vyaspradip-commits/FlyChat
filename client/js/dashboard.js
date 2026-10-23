console.log("====Dashboard Loaded====");
console.log("loggedIn:", sessionStorage.getItem("loggedIn"));
console.log("currentUser", sessionStorage.getItem("currentUser"));
console.log("currentEmail", sessionStorage.getItem("currentEmail"));
console.log("currentUserId", sessionStorage.getItem("currentUserId"));
let currentChat = null;
let currentChatType = null;
let currentGroupId = null;

function loadWelcomeScreen(){
    const chatArea = document.getElementById("chatArea");
    if (!chatArea) return;
    chatArea.innerHTML = `
        <div class="welcome-screen">
            <h1>💬 FlyChat</h1>
            <p>Select a chat to start messaging.</p>
        </div>
    `;
}

// =========================
// LOAD REGISTERED USERS
// =========================

async function loadRegisteredUsers() {

    const container =
        document.getElementById("chatContainer");

    if (!container) {
        console.log("chatContainer not found.");
        return;
    }

    try {

        const response =
            await fetch("/api/users");

        const result =
            await response.json();

        if (!response.ok || !result.success) {

            console.error(
                "Could not load registered users:",
                result.message
            );

            return;
        }

        console.log(
            "Registered users from server:",
            result.users
        );


        // =========================
        // CURRENT USER
        // =========================

        const currentUser =
            getCurrentUser();

        const currentEmail =
            currentUser &&
            currentUser.email
                ? currentUser.email.toLowerCase().trim()
                : "";


        // =========================
        // SYNC SERVER USERS
        // WITH LOCAL USERS
        // =========================

        const localUsers =
            loadData("users") || [];

        result.users.forEach(function(serverUser) {

            const existingIndex =
                localUsers.findIndex(function(user) {

                    return (
                        user.email &&
                        serverUser.email &&
                        user.email.toLowerCase().trim() ===
                        serverUser.email.toLowerCase().trim()
                    );

                });


            const syncedUser = {

                id:
                    serverUser.id,

                name:
                    serverUser.name,

                email:
                    serverUser.email,

                profileImage:
                    serverUser.profileImage ||
                    "images/user.png",

                status:
                    serverUser.status ||
                    "Hey there! I am using FlyChat."

            };


            if (existingIndex === -1) {

                localUsers.push(syncedUser);

            } else {

                localUsers[existingIndex] = {
                    ...localUsers[existingIndex],
                    ...syncedUser
                };

            }

        });


        saveData(
            "users",
            localUsers
        );


        // =========================
        // ADD USERS TO CHAT LIST
        // =========================

        result.users.forEach(function(user) {

            // Don't show yourself in your own chat list
            if (
                currentEmail &&
                user.email.toLowerCase().trim() ===
                currentEmail
            ) {
                return;
            }


            // Don't add duplicate user
            const existingChat =
                container.querySelector(
                    `[data-user-email="${CSS.escape(user.email)}"]`
                );

            if (existingChat) {
                return;
            }


            const div =
                document.createElement("div");

            div.className =
                "chat-item";

            div.setAttribute(
                "data-name",
                user.name
            );

            div.setAttribute(
                "data-user-email",
                user.email
            );


            div.innerHTML = `

                <img
                    class="avatar"
                    src="${user.profileImage || "images/user.png"}"
                    alt="${escapeHTML(user.name)}">

                <div class="chat-details">

                    <h3>
                        ${escapeHTML(user.name)}
                    </h3>

                    <p>
                        ${escapeHTML(
                            user.status ||
                            "Hey there! I am using FlyChat."
                        )}
                    </p>

                </div>

            `;


            div.addEventListener(
                "click",
                function() {

                    openChat(
                        user.name,
                        user.email
                    );

                }
            );


            container.appendChild(div);

        });


        console.log(
            "Registered users added to dashboard."
        );


    } catch (error) {

        console.error(
            "Load registered users error:",
            error
        );

    }
}

function openChat(userName, userEmail) {

    showMobileChat();

    currentChat = userName;
    currentChatType = "private";

    const app = document.querySelector(".app");

    if (app) {
        app.classList.add("mobile-chat-open");
    }

    // =========================
    // FIND CHAT USER
    // =========================

    const users = loadData("users") || [];

    const chatUser = users.find(function(user) {

        return (
            user.email &&
            userEmail &&
            user.email.toLowerCase() ===
            userEmail.toLowerCase()
        );

    });

    console.log("Opening private chat:", userName);
    console.log("Chat email:", userEmail);
    console.log("Chat user:", chatUser);

    // =========================
    // GET PROFILE IMAGE
    // =========================

    let chatImage = "images/user.png";

    if (
        chatUser &&
        chatUser.profileImage
    ) {

        chatImage = chatUser.profileImage;

    }

    // =========================
    // CHAT AREA
    // =========================

    const chatArea =
        document.getElementById("chatArea");

    if (!chatArea) {
        return;
    }

    chatArea.innerHTML = `

        <div class="chat-header">

            <div class="chat-header-left">

                <button
                    class="mobile-back-btn"
                    onclick="closeMobileChat()">
                    ←
                </button>

                <img
                    id="privateChatImage"
                    class="avatar"
                    src="${chatImage}"
                    alt="${userName}"
                >

                <div>

                    <h3 id="chatTitle">
                        ${userName}
                    </h3>

                    <small id="chatSubtitle">
                        🟢 Online
                    </small>

                </div>

            </div>

        </div>

        <div
            id="messages"
            class="chat-box">
        </div>

        <div class="chat-input">

            <div class="emoji-wrapper">

                <button
                    id="emojiBtn"
                    class="emoji-btn">
                    😊
                </button>

                <div
                    id="emojiBox"
                    class="emoji-box">
                </div>

            </div>

            <button
                type="button"
                id="attachBtn"
                class="attach-btn"
                title="Attach">
                ＋
            </button>

            <input
                type="file"
                id="fileInput"
                hidden
                multiple>

            <input
                id="messageInput"
                type="text"
                placeholder="Type a message"
                autocomplete="off">

            <button
                type="button"
                id="sendButton"
                onclick="sendMessage()">
                ➤
            </button>

        </div>
    `;

    // =========================
    // LOAD MESSAGES
    // =========================

    if (
        typeof loadPrivateMessages === "function"
    ) {

        loadPrivateMessages();

    }

    // =========================
    // ENTER KEY
    // =========================

    if (
        typeof initializePrivateEnter === "function"
    ) {

        initializePrivateEnter();

    }

    // =========================
    // EMOJI
    // =========================

    if (
        typeof initializePrivateEmoji === "function"
    ) {

        initializePrivateEmoji();

    }

    if(typeof initializePrivateFileSharing === "function") {
        initializePrivateFileSharing();
    }

}


function openGroup(groupName, groupId) {
    const groups = loadData("groups") || [];

    const selectedGroup = groups.find(function (group) {
        return String(group.id) === String(groupId);
    });

    if (!selectedGroup) {
        console.error("Group not found:", groupId);
        alert("This group does not exist in your saved groups.");
        return;
    }

    const currentUser = getCurrentUser();

    const canEditGroup = Boolean(
        currentUser &&
        String(selectedGroup.creatorId) === String(currentUser.id)
    );

    const editButtonHtml = canEditGroup
        ? '<button type="button" class="edit-group-btn" onclick="editCurrentGroup()">✏️</button>'
        : "";

    sessionStorage.setItem("currentGroupId", String(selectedGroup.id));
    sessionStorage.setItem("currentGroupName", selectedGroup.name);

    currentChat = selectedGroup.name;
    currentChatType = "group";
    currentGroupId = selectedGroup.id;

    const chatArea = document.getElementById("chatArea");

    if (!chatArea) {
        console.error("chatArea not found.");
        return;
    }

    showMobileChat();

    chatArea.innerHTML = `
        <div id="groupChatArea" class="group-chat-area">

            <div class="chat-header">
                <div class="chat-header-left">

                    <button
                        type="button"
                        class="group-back-btn"
                        onclick="closeGroupChat()"
                        aria-label="Back to chats">
                        ←
                    </button>

                    <img
                        id="groupProfileImage"
                        class="avatar"
                        src="images/user.png"
                        alt="Group profile">

                    <div class="group-header-info">
                        <h3 id="groupTitle">Group</h3>
                        <small>👥 Group Chat</small>
                    </div>

                </div>

                ${editButtonHtml}
            </div>

            <div id="groupMessages" class="chat-box"></div>

            <div class="chat-input">

                <div class="emoji-wrapper">
                    <button
                        type="button"
                        id="groupEmojiBtn"
                        class="emoji-btn">😊</button>

                    <div
                        id="groupEmojiBox"
                        class="emoji-box"></div>
                </div>

                <button
                    type="button"
                    id="groupAttachBtn"
                    class="attach-btn"
                    title="Attach">＋</button>

                <input
                    type="file"
                    id="groupFileInput"
                    hidden
                    multiple>

                <input
                    id="groupMessageInput"
                    type="text"
                    placeholder="Type a message..."
                    autocomplete="off">

                <button
                    type="button"
                    id="groupSendButton">➤</button>

            </div>
        </div>
    `;

    document.getElementById("groupTitle").textContent =
        selectedGroup.name || "Group";

    document.getElementById("groupProfileImage").src =
        selectedGroup.image || "images/user.png";

    if (typeof initializeGroupPage === "function") {
        initializeGroupPage();
    } else {
        console.error("groupChat.js is not loaded.");
    }
}


function editCurrentGroup(){
    const groupId = currentGroupId || sessionStorage.getItem("currentGroupId");
    if (!groupId) {
        alert("Please open a group first.");
    }
    sessionStorage.setItem("editingGroupId", groupId);
    window.location.href = "create-group.html";
}

function updateChatHeader(name, subtitle) {
    const title = document.getElementById("chatTitle");
    const sub = document.getElementById("chatSubtitle");
    if (title) title.innerHTML = name;
    if (sub) sub.innerText = subtitle;
}

function highlightSelectedChat(name) {
    const chats = document.querySelectorAll(".chat-item");
    chats.forEach(function (chat) {
        chat.classList.remove("active-chat");
    });
    chats.forEach(function(chat){
        const chatName = chat.querySelector("h3").innerText.trim();
        if(chatName === name || chatName === "👥" + name){
            chat.classList.add("active-chat");
        }
    });
}

function loadChatListImages(){
    let users = loadData("users") || [];
    const chatItems = document.querySelectorAll(".chat-item");
    chatItems.forEach(function(chat){
        let name = chat.getAttribute("data-name");
        if(!name) return;
        if(name.toLowerCase() === "vyas"){
            name = "Pradip";
        }
        let user = users.find(function(u){
            return u.name && u.name.toLowerCase() === name.toLowerCase();
        });
        if(!user){
            return;
        }
        let avatar = chat.querySelector(".avatar");
        if(avatar){
            avatar.src = user.profileImage || "images/user.png";
        }
    });
}


function loadCreatedGroups() {
    const container = document.getElementById("chatContainer");

    if (!container) return;

    const groups = loadData("groups") || [];

    groups.forEach(function (group) {
        if (!group || !group.id) return;

        // Prevent duplicate group cards
        const alreadyExists = Array.from(
            container.querySelectorAll("[data-group-id]")
        ).some(function (item) {
            return item.dataset.groupId === String(group.id);
        });

        if (alreadyExists) return;

        const div = document.createElement("div");
        div.className = "chat-item";
        div.dataset.groupId = group.id;
        div.dataset.name = group.name || "Group";
        const memberCount = (group.members || []).filter(function(memberId){
            return String(memberId) !== String(group.creatorId);
        }).length;
        div.innerHTML = `
            <img
                class="avatar"
                src="${group.image || "images/user.png"}"
                alt="Group">

            <div class="chat-details">
                <h3>👥 ${group.name || "Group"}</h3>
                <p>${memberCount} Members</p>
            </div>
        `;

        div.onclick = function () {
            openGroup(group.name, group.id);
        };

        container.appendChild(div);
    });
}
window.addEventListener("load", function () {

    if (document.getElementById("chatArea")) {

        loadWelcomeScreen();
        loadRegisteredUsers();
        loadCreatedGroups();
        loadChatListImages();
        loadCurrentUserImage();
    }

});
function closeGroupChat() {
    currentChat = null;
    currentChatType = null;
    currentGroupId = null;

    const app = document.querySelector(".app");

    if (app) {
        app.classList.remove("mobile-chat-open");
    }

    loadWelcomeScreen();
}

function closeMobileChat() {
    const app = document.querySelector(".app");
    console.log("Mobile back clicked");
    if (!app) {
        console.log("App not found");
        return;
    }

    app.classList.remove("mobile-chat-open");

    currentChat = null;
    currentChatType = null;
    currentGroupId = null;
}

function showMobileChat(){
    let app = document.querySelector(".app");
    if (app) {
        app.classList.add("mobile-chat-open");
    }
}

function closeMobileChat() {
    let app = document.querySelector(".app");
    if(app){
        app.classList.remove("mobile-chat-open");
    }
}