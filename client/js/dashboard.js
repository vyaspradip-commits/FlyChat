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
    // Remove existing user chats before rebuilding the list
    container
        .querySelectorAll('.chat-item[data-chat-type="user"]')
        .forEach(function (item) {
            item.remove();
        });
    if (!container) {
        console.log("chatContainer not found.");
        return;
    }

    try {

        const currentUser = getCurrentUser();

        if (!currentUser) {
            return;
        }

        const response = await fetch(
            "/api/users?viewerId=" +
            encodeURIComponent(currentUser.id)
        );

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

        // =========================
        // ADD USERS TO CHAT LIST
        // =========================

        const hiddenChatUsers =
            JSON.parse(
                localStorage.getItem("hiddenChatUsers") || "[]"
            );

        result.users.forEach(function(user) {

            // Don't show hidden users
            if (
                hiddenChatUsers.includes(
                    user.email.toLowerCase().trim()
                )
            ) {
                return;
        }
            // Don't show yourself in your own chat list
            if (
                currentEmail &&
                user.email.toLowerCase().trim() ===
                currentEmail
            ) {
                return;
            }
            // =========================
            // PRIVACY: SHOW ONLY SELECTED USERS
            // =========================
            const myPrivacy =
                loadData("privacy_" + currentUser.id);

            if (
                myPrivacy &&
                myPrivacy.visibility === "selected"
            ) {

                const allowedUsers =
                    (myPrivacy.selectedUsers || [])
                        .map(String);

                if (
                    !allowedUsers.includes(
                        String(user.id)
                    )
                ) {
                    return;
                }
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
            div.dataset.userId =
                String(user.id);

            div.dataset.chatType =
                "user";

            div.dataset.chatId =
                String(user.id);

            div.dataset.lastActivity =
                user.lastActivityAt ||
                user.updatedAt ||
                user.createdAt ||
                "1970-01-01T00:00:00.000Z";

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

    let chatUser = users.find(function(user) {

        return (
            user.email &&
            userEmail &&
            user.email.toLowerCase() ===
            userEmail.toLowerCase()
        );

    });
    if(!chatUser && userEmail){
        chatUser = {
            id: "",
            name: userName,
            email: userEmail,
            profileImage: "images/user.png",
            status: "Hey there! I am using FlyChat."
        };
    }
    currentPrivateChatUser = chatUser;
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
    window.location.href = "edit-group.html";
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
// =========================
// RENDER GROUP CHAT ITEM
// =========================

function renderGroupChatItem(group) {

    const memberCount =
        Array.isArray(group.members)
            ? group.members.length
            : 0;

    const groupImage =
        group.image ||
        "images/user.png";

    const groupName =
        group.name ||
        "Unnamed Group";

    const groupStatus =
        group.description &&
        String(group.description).trim()
            ? String(group.description).trim()
            : "No status";

    const div =
        document.createElement("div");

    div.className =
        "chat-user group-chat-item";

    div.dataset.groupId =
        group.id;
    div.dataset.lastActivity =
        group.lastActivity ||
        group.updatedAt ||
        group.createdAt ||
        "1970-01-01T00:00:00.000Z";
    div.dataset.chatType = "group";
    div.dataset.chatId = String(group.id);
    div.dataset.lastActivity = String(group.lastActivityAt || group.updatedAt || group.createdAt || 0);
    div.dataset.name =
        groupName;

    div.innerHTML = `

        <img
            class="chat-avatar"
            src="${escapeHTML(groupImage)}"
            alt="${escapeHTML(groupName)}"
        >

        <div class="chat-user-info">

            <h3 class="chat-user-name">

                <span class="group-icon">👥</span>

                ${escapeHTML(groupName)}

            </h3>

            <p class="group-status">
                ${escapeHTML(groupStatus)}
            </p>

            <p class="group-members">
                ${memberCount} Members
            </p>

        </div>
    `;

    div.addEventListener(
        "click",
        function () {

            if (
                typeof openGroup ===
                "function"
            ) {

                openGroup(
                    group.name,
                    group.id
                );

            } else {

                console.error(
                    "openGroup() is not defined."
                );

            }

        }
    );

    return div;
}

async function loadCreatedGroups() {

    const container =
        document.getElementById("chatContainer");

    if (!container) {

        console.log(
            "chatContainer not found."
        );

        return;
    }

    const currentUser =
        getCurrentUser();

    if (!currentUser || !currentUser.id) {

        console.log(
            "Current user not found."
        );

        return;
    }

    try {

        const response =
            await fetch(
                "/api/groups?userId=" +
                encodeURIComponent(
                    currentUser.id
                )
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {

            console.error(
                "Could not load groups:",
                result.message
            );

            return;
        }

        console.log(
            "Groups from server:",
            result.groups
        );


        // =========================================
        // SERVER = SOURCE OF TRUTH
        // =========================================

        const serverGroups =
            Array.isArray(result.groups)
                ? result.groups
                : [];


        // =========================================
        // SYNC LOCAL STORAGE
        // =========================================

        saveData(
            "groups",
            serverGroups
        );


        // =========================================
        // UPDATE / CREATE GROUP ITEMS
        // =========================================

        serverGroups.forEach(
            function(group) {

                if (
                    !group ||
                    !group.id
                ) {
                    return;
                }


                const groupId =
                    String(group.id);


                // =====================================
                // GET LAST ACTIVITY
                // =====================================

                const activityTime =
                    group.lastActivityAt ||
                    group.updatedAt ||
                    group.createdAt ||
                    0;


                // =====================================
                // FIND EXISTING GROUP
                // =====================================

                const existingItem =
                    container.querySelector(
                        `[data-group-id="${CSS.escape(groupId)}"]`
                    );


                // =====================================
                // EXISTING GROUP
                // =====================================

                if (existingItem) {

                    // Update activity timestamp
                    existingItem.dataset.lastActivity =
                        String(activityTime);

                    // Update group name
                    const nameElement =
                        existingItem.querySelector(
                            ".chat-user-name"
                        );

                    if (nameElement) {

                        nameElement.innerHTML =
                            `<span class="group-icon">👥</span> ` +
                            `${escapeHTML(
                                group.name ||
                                "Group"
                            )}`;
                    }


                    // Update group status
                    const statusElement =
                        existingItem.querySelector(
                            ".group-status"
                        );

                    if (statusElement) {

                        statusElement.textContent =
                            group.description &&
                            String(
                                group.description
                            ).trim()
                                ? String(
                                    group.description
                                ).trim()
                                : "No status";
                    }


                    // Update member count
                    const memberElement =
                        existingItem.querySelector(
                            ".group-members"
                        );

                    if (memberElement) {

                        const memberCount =
                            Array.isArray(
                                group.members
                            )
                                ? group.members.length
                                : 0;

                        memberElement.textContent =
                            `${memberCount} Members`;
                    }


                    // Update group image
                    const imageElement =
                        existingItem.querySelector(
                            ".chat-avatar"
                        );

                    if (imageElement) {

                        imageElement.src =
                            group.image ||
                            "images/user.png";
                    }


                    // IMPORTANT:
                    // DO NOT call moveChatToTop()
                    // here.

                    return;
                }


                // =====================================
                // NEW GROUP
                // =====================================

                const groupItem =
                    renderGroupChatItem(
                        group
                    );


                groupItem.dataset.lastActivity =
                    String(activityTime);


                container.appendChild(
                    groupItem
                );

            }
        );


        // =========================================
        // IMPORTANT
        // SORT ONLY ONCE
        // AFTER ALL GROUPS ARE PROCESSED
        // =========================================

        reorderChatList();

        console.log(
            "Server groups added to dashboard."
        );


    } catch (error) {

        console.error(
            "Load groups error:",
            error
        );

    }
}
// =========================
// LIVE GROUP SYNCHRONIZATION
// =========================

let groupSyncTimer = null;

function startGroupLiveSync() {

    // Prevent multiple timers
    if (groupSyncTimer) {
        return;
    }

    groupSyncTimer =
        setInterval(
            async function() {

                try {

                    await loadCreatedGroups();

                } catch (error) {

                    console.error(
                        "Live group sync error:",
                        error
                    );

                }

            },
            1500
        );
}
window.addEventListener("load", async function () {

    if (document.getElementById("chatArea")) {

        loadWelcomeScreen();

        await loadRegisteredUsers();

        await loadCreatedGroups();

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

function getChatActivityTime(item){
    if (!item) {
        return 0;
    }
    const value = item.dataset.lastActivity;
    if (!value) {
        return 0;
    }
    if (!isNaN(Number(value))) {
        return Number(value);
    }
    const parsed = Date.parse(value);
    return isNaN(parsed) ? 0 : parsed;
}

function moveChatToTop(chatId, chatType) {
    const container = document.getElementById("chatContainer");

    if (!container) return;

    const items = [
        ...container.querySelectorAll(".chat-item")
    ];

    const chatItem = items.find(function (item) {
        return (
            item.dataset.chatType === chatType &&
            String(item.dataset.chatId) === String(chatId)
        );
    });

    if (chatItem) {
        container.prepend(chatItem);
    }
}
function updateChatActivityAndReorder(chatType, chatId) {

    const container =
        document.getElementById("chatContainer");

    if (!container || !chatId) {
        return;
    }

    let item = null;

    if (chatType === "group") {

        item =
            container.querySelector(
                `[data-chat-type="group"][data-group-id="${CSS.escape(String(chatId))}"]`
            );

    } else {

        item =
            container.querySelector(
                `[data-chat-type="user"][data-user-id="${CSS.escape(String(chatId))}"]`
            );
    }

    if (!item) {

        console.log(
            "Chat item not found:",
            chatType,
            chatId
        );

        return;
    }

    // Newest activity
    item.dataset.lastActivity =
        new Date().toISOString();

    // Move only inside #chatContainer
    container.prepend(item);

    console.log(
        "Activity updated:",
        chatType,
        chatId
    );
}
function sortChatListByActivity() {

    const container =
        document.getElementById("chatContainer");

    if (!container) {
        return;
    }

    // Get only group/chat items
    const items =
        Array.from(
            container.querySelectorAll(
                ".group-chat-item, .chat-user, .chat-item"
            )
        );

    // Remove duplicate references
    const uniqueItems =
        Array.from(new Set(items));

    // Sort newest activity first
    uniqueItems.sort(function (a, b) {

        const aValue =
            a.dataset.lastActivity || "0";

        const bValue =
            b.dataset.lastActivity || "0";

        const aTime =
            Date.parse(aValue) ||
            Number(aValue) ||
            0;

        const bTime =
            Date.parse(bValue) ||
            Number(bValue) ||
            0;

        return bTime - aTime;
    });

    // Put sorted items back into the container
    uniqueItems.forEach(function (item) {

        container.appendChild(item);

    });
}
// =========================================
// MOVE ONE CHAT TO TOP
// ONLY INSIDE #chatContainer
// =========================================

function moveChatToTop(chatId, chatType) {

    const container =
        document.getElementById("chatContainer");

    if (!container) {
        return;
    }

    const item =
        Array.from(
            container.children
        ).find(function (element) {

            return (
                element.dataset &&
                element.dataset.chatType === chatType &&
                String(element.dataset.chatId) === String(chatId)
            );

        });

    if (!item) {
        console.log(
            "Chat item not found:",
            chatType,
            chatId
        );
        return;
    }

    // IMPORTANT:
    // Move ONLY inside #chatContainer.
    // Never use .chat-list.prepend()

    container.prepend(item);

    console.log(
        "Chat moved to top:",
        chatType,
        chatId
    );
}


// =========================================
// MOVE USER CHAT TO TOP
// =========================================

function moveUserChatToTop(userId) {

    const container =
        document.getElementById("chatContainer");

    if (!container || !userId) {
        return;
    }

    moveChatToTop(
        userId,
        "user"
    );

}


// =========================================
// MOVE GROUP CHAT TO TOP
// =========================================

function moveGroupChatToTop(groupId) {

    const container =
        document.getElementById("chatContainer");

    if (!container || !groupId) {
        return;
    }

    moveChatToTop(
        groupId,
        "group"
    );

}


// =========================================
// UPDATE ACTIVITY + REORDER
// =========================================

function updateChatActivityAndReorder(
    chatType,
    chatId
) {

    const container =
        document.getElementById("chatContainer");

    if (!container || !chatId) {
        return;
    }

    let item = null;

    if (chatType === "group") {

        item =
            container.querySelector(
                `[data-chat-type="group"][data-group-id="${CSS.escape(String(chatId))}"]`
            );

    } else {

        item =
            container.querySelector(
                `[data-chat-type="user"][data-user-id="${CSS.escape(String(chatId))}"]`
            );

    }

    if (!item) {

        console.log(
            "Chat item not found for activity update:",
            chatType,
            chatId
        );

        return;
    }

    item.dataset.lastActivity =
        new Date().toISOString();

    reorderChatList();

}


// =========================================
// REORDER ENTIRE CHAT LIST
// GLOBAL ORDER
// USER + GROUP TOGETHER
// NEWEST ACTIVITY = TOP
// =========================================

function reorderChatList() {

    const container =
        document.getElementById("chatContainer");

    if (!container) {
        return;
    }

    const items =
        Array.from(
            container.querySelectorAll(".chat-item")
        ).filter(function (item) {

            return (
                item.dataset &&
                (
                    item.dataset.chatType === "user" ||
                    item.dataset.chatType === "group"
                )
            );

        });


    // =========================================
    // SORT EVERYTHING TOGETHER
    // =========================================

    items.sort(function (a, b) {

        const timeA =
            Date.parse(
                a.dataset.lastActivity || ""
            ) || 0;

        const timeB =
            Date.parse(
                b.dataset.lastActivity || ""
            ) || 0;

        return timeB - timeA;

    });


    // =========================================
    // PUT BACK INSIDE #chatContainer
    // =========================================

    items.forEach(function (item) {

        container.appendChild(item);

    });


    console.log(
        "Chat list reordered:",
        items.map(function (item) {

            return {
                type:
                    item.dataset.chatType,

                id:
                    item.dataset.chatId,

                groupId:
                    item.dataset.groupId,

                lastActivity:
                    item.dataset.lastActivity
            };

        })
    );

}
function moveUserChatToTop(userId) {

    const container =
        document.getElementById("chatContainer");

    if (!container || !userId) {
        return;
    }

    const item =
        container.querySelector(
            `[data-user-id="${CSS.escape(String(userId))}"]`
        );

    if (!item) {
        return;
    }

    container.prepend(item);
}

function moveGroupChatToTop(groupId) {

    const container =
        document.getElementById("chatContainer");

    if (!container || !groupId) {
        return;
    }

    const item =
        container.querySelector(
            `[data-group-id="${CSS.escape(String(groupId))}"]`
        );

    if (!item) {
        return;
    }

    container.appendChild(item);
}

// =========================================
// REORDER ENTIRE CHAT LIST
// NEWEST ACTIVITY = TOP
// =========================================

// =========================================
// REORDER CHAT LIST
// DIRECT CHATS FIRST
// NEWEST DIRECT CHAT = TOP
// GROUPS AFTER DIRECT CHATS
// =========================================

function reorderChatList() {

    const container =
        document.getElementById("chatContainer");

    if (!container) {
        return;
    }

    // Get only actual chat/group items
    const items =
        Array.from(
            container.children
        ).filter(function (item) {

            return (
                item.dataset &&
                (
                    item.dataset.chatType === "user" ||
                    item.dataset.chatType === "group"
                )
            );

        });

    // =========================================
    // SORT ALL CHATS TOGETHER
    // NEWEST ACTIVITY = TOP
    // =========================================

    items.sort(function (a, b) {

        const timeA =
            Date.parse(
                a.dataset.lastActivity || ""
            ) || 0;

        const timeB =
            Date.parse(
                b.dataset.lastActivity || ""
            ) || 0;

        return timeB - timeA;
    });

    // =========================================
    // PUT ITEMS BACK ONLY INSIDE CHAT CONTAINER
    // =========================================

    items.forEach(function (item) {

        container.appendChild(item);

    });

    console.log(
        "Chat list reordered:",
        items.map(function (item) {

            return {
                type: item.dataset.chatType,
                id:
                    item.dataset.chatType === "group"
                        ? item.dataset.groupId
                        : item.dataset.userId,
                lastActivity:
                    item.dataset.lastActivity
            };

        })
    );
}
// =========================================
// RECEIVER: MOVE RECEIVED PRIVATE CHAT
// TO TOP OF #chatContainer
// =========================================

window.addEventListener(
    "flychat-message-received",
    function (event) {

        const data =
            event.detail || {};

        const currentUser =
            typeof getCurrentUser === "function"
                ? getCurrentUser()
                : null;

        if (!currentUser) {
            return;
        }

        const senderEmail =
            String(
                data.senderEmail || ""
            )
            .trim()
            .toLowerCase();

        const receiverEmail =
            String(
                data.receiverEmail || ""
            )
            .trim()
            .toLowerCase();

        const currentUserEmail =
            String(
                currentUser.email || ""
            )
            .trim()
            .toLowerCase();

        // =====================================
        // ONLY RECEIVER HANDLES THIS EVENT
        // =====================================

        if (
            receiverEmail !== currentUserEmail
        ) {
            return;
        }

        if (!senderEmail) {
            return;
        }

        const container =
            document.getElementById(
                "chatContainer"
            );

        if (!container) {
            return;
        }

        // =====================================
        // FIND SENDER CHAT
        // =====================================

        const item =
            container.querySelector(
                `[data-chat-type="user"][data-user-email="${CSS.escape(senderEmail)}"]`
            );

        if (!item) {

            console.log(
                "Received message, but sender chat is not loaded:",
                senderEmail
            );

            return;
        }

        // =====================================
        // UPDATE LAST ACTIVITY
        // =====================================

        item.dataset.lastActivity =
            new Date().toISOString();

        // =====================================
        // MOVE ONLY INSIDE #chatContainer
        // =====================================

        container.prepend(item);

        console.log(
            "RECEIVER: chat moved to top:",
            senderEmail
        );
    }
);