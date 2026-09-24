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

function openChat(userName) {
    showMobileChat();
    currentChat = userName;
    currentChatType="private";
    const app = document.querySelector(".app");
    if (app) {
        app.classList.add("mobile-chat-open");
    }
    const chatArea = document.getElementById("chatArea");
    if(!chatArea) return;
    chatArea.innerHTML = `
        <div class="chat-header">
            <div class="chat-header-left">
                <button
                    class="mobile-back-btn"
                    onclick="closeMobileChat()">
                    ←
                </button>
                <img class="avatar" src="images/user.png">
                <div>
                    <h3 id="chatTitle">${userName}</h3>
                    <small>🟢 Online</small>
                </div>
            </div>
        </div>
        <div id="messages" class="chat-box">
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
                placeholder="Type a message">
            <button onclick="sendMessage()">
                ➤
            </button>
        </div>
    `;
    const backBtn = document.getElementById("mobileBackBtn");
    if(backBtn){
        backBtn.addEventListener("click", closeMobileChat);
    }    
    if(typeof loadPrivateMessages==="function"){
        loadPrivateMessages();
    }
    if(typeof initializePrivateEnter==="function"){
        initializePrivateEnter();
    }
    if(typeof initializePrivateEmoji==="function"){
        initializePrivateEmoji();
    }
    console.log("Private chat opened:", userName);
}

function openGroup(groupName, groupId) {

    showMobileChat();

    currentChat = groupName;
    currentChatType = "group";
    currentGroupId = groupId;

    console.log("Opening group:", groupName);
    console.log("Group ID:", currentGroupId);

    const app = document.querySelector(".app");
    if (app) {
        app.classList.add("mobile-chat-open");
    }

    const chatArea = document.getElementById("chatArea");

    if (!chatArea) return;

    chatArea.innerHTML = `
        <div class="chat-header">

            <div class="chat-header-left">

                <button
                    class="mobile-back-btn"
                    onclick="closeMobileChat()">
                    ←
                </button>

                <img
                    class="avatar"
                    src="images/user.png"
                >

                <div>

                    <h3>${groupName}</h3>

                    <small>👥 Group Chat</small>

                </div>

            </div>

        </div>

        <div
            id="groupMessages"
            class="chat-box">
        </div>

        <div class="chat-input">

            <div class="emoji-wrapper">

                <button
                    id="groupEmojiBtn"
                    class="emoji-btn">
                    😊
                </button>

                <div
                    id="groupEmojiBox"
                    class="emoji-box">
                </div>

            </div>

            <button
                id="groupAttachBtn"
                class="attach-btn"
                title="Attach">
                ＋
            </button>

            <input
                type="file"
                id="groupFileInput"
                hidden
                multiple>

            <input
                id="groupMessageInput"
                type="text"
                placeholder="Type a message">

            <button onclick="sendGroupMessage()">
                ➤
            </button>

        </div>
    `;
    const backBtn = document.getElementById("mobileBackBtn");
    if(backBtn){
        backBtn.addEventListener("click",closeMobileChat);
    }
    // Load messages
    if (typeof loadGroupMessages === "function") {
        loadGroupMessages();
    }

    // Send button
    const sendButton =
        document.getElementById("groupSendButton");

    if (sendButton) {

        sendButton.addEventListener("click", function() {

            sendGroupMessage();

        });

    }

    // Enter key
    if (typeof initializeGroupEnter === "function") {
        initializeGroupEnter();
    }

    // Emoji
    if (typeof initializeGroupEmoji === "function") {
        initializeGroupEmoji();
    }
}
window.addEventListener("load", function(){
    if (document.getElementById("chatArea")) {
        loadWelcomeScreen();
        loadChatListImages();
        loadCurrentUserImage();
    }
});

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

    if (!container) {
        console.log("chatContainer not found");
        return;
    }

    const groups = loadData("groups") || [];

    console.log("Groups loaded:", groups);

    groups.forEach(function(group) {

        // Prevent duplicate groups
        if (
            container.querySelector(
                `[data-group-id="${group.id}"]`
            )
        ) {
            return;
        }

        const div = document.createElement("div");

        div.className = "chat-item";

        div.setAttribute("data-group-id", group.id);
        div.setAttribute("data-name", group.name);

        div.innerHTML = `
            <img
                class="avatar"
                src="${group.image || "images/user.png"}"
                alt="Group">

            <div class="chat-details">

                <h3>👥 ${group.name}</h3>

                <p>${group.members.length} Members</p>

            </div>
        `;

        div.onclick = function() {
            openGroup(group.name, group.id);
        };

        container.appendChild(div);

    });
}

window.addEventListener("load", function () {

    if (document.getElementById("chatArea")) {

        loadWelcomeScreen();

        loadCreatedGroups();

    }

});

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