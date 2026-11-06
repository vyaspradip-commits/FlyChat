(function () {
    const token = localStorage.getItem("token");
    let savedUser = {};

    try {
        savedUser = JSON.parse(localStorage.getItem("user") || "{}") || {};
    } catch (error) {
        savedUser = {};
    }

    const currentUserId = String(savedUser.id || savedUser._id || "");
    const elements = {
        userLabel: document.getElementById("userLabel"),
        socketStatus: document.getElementById("socketStatus"),
        statusMessage: document.getElementById("statusMessage"),
        conversationList: document.getElementById("conversationList"),
        emptyState: document.getElementById("emptyState"),
        conversationView: document.getElementById("conversationView"),
        chatAvatar: document.getElementById("chatAvatar"),
        chatTitle: document.getElementById("chatTitle"),
        messages: document.getElementById("messages"),
        messageForm: document.getElementById("messageForm"),
        messageInput: document.getElementById("messageInput"),
        sendButton: document.getElementById("sendButton"),
        fileInput: document.getElementById("fileInput"),
        attachButton: document.getElementById("attachButton"),
        chatSubtitle: document.getElementById("chatSubtitle"),
        refreshButton: document.getElementById("refreshButton"),
        logoutButton: document.getElementById("logoutButton")
    };

    const state = {
        conversations: [],
        activeConversation: null,
        activeConversationId: "",
        socket: null,
        renderedMessageIds: new Set()
    };

    function getId(value) {
        if (value && typeof value === "object") {
            value = value._id || value.id || "";
        }
        return value === null || value === undefined ? "" : String(value);
    }

    function setStatus(message, type) {
        elements.statusMessage.textContent = message || "";
        elements.statusMessage.className = "status-message" + (type ? " " + type : "");
    }

    function showLoginLink() {
        const link = document.createElement("a");
        link.href = "/pages/login.html";
        link.textContent = "Log in";
        elements.statusMessage.appendChild(link);
    }

    async function apiRequest(url, options) {
        const requestOptions = options || {};
        const headers = Object.assign({}, requestOptions.headers || {}, {
            Authorization: "Bearer " + token
        });

        if (requestOptions.body) {
            headers["Content-Type"] = "application/json";
        }

        const response = await fetch(url, Object.assign({}, requestOptions, { headers: headers }));
        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (!response.ok || data.success === false) {
            if (response.status === 401) {
                setStatus("Your login has expired.", "error");
                showLoginLink();
            }
            throw new Error(data.message || "The request could not be completed.");
        }

        return data;
    }

    function getOtherParticipant(conversation) {
        const participants = Array.isArray(conversation.participants) ? conversation.participants : [];
        return participants.find(function (participant) {
            return getId(participant) !== currentUserId;
        }) || participants[0] || null;
    }

    function conversationName(conversation) {
        if (conversation.isGroup && conversation.groupName) {
            return conversation.groupName;
        }

        const participant = getOtherParticipant(conversation);
        return participant && participant.name ? participant.name : "FlyChat conversation";
    }

    function initials(name) {
        const words = String(name || "F").trim().split(/\s+/).filter(Boolean);
        if (!words.length) {
            return "F";
        }
        return words.slice(0, 2).map(function (word) {
            return word.charAt(0).toUpperCase();
        }).join("");
    }

    function formatTime(value) {
        if (!value) {
            return "";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return new Intl.DateTimeFormat(undefined, {
            hour: "numeric",
            minute: "2-digit"
        }).format(date);
    }

    function lastMessagePreview(conversation) {
        const lastMessage = conversation.lastMessage;
        if (!lastMessage) {
            return "No messages yet";
        }
        if (lastMessage.text) {
            return lastMessage.text;
        }
        if (lastMessage.messageType === "image") {
            return "Photo";
        }
        if (lastMessage.messageType === "file") {
            return "File";
        }
        return "No messages yet";
    }

    function renderConversations() {
        elements.conversationList.replaceChildren();

        if (!state.conversations.length) {
            const empty = document.createElement("p");
            empty.className = "status-message";
            empty.textContent = "No conversations yet.";
            elements.conversationList.appendChild(empty);
            return;
        }

        state.conversations.forEach(function (conversation) {
            const id = getId(conversation);
            const name = conversationName(conversation);
            const button = document.createElement("button");
            button.type = "button";
            button.className = "conversation-item" + (id === state.activeConversationId ? " active" : "");
            button.setAttribute("aria-label", "Open conversation with " + name);

            const avatar = document.createElement("span");
            avatar.className = "avatar";
            avatar.textContent = initials(name);

            const copy = document.createElement("span");
            copy.className = "conversation-copy";

            const top = document.createElement("span");
            top.className = "conversation-copy-top";

            const title = document.createElement("span");
            title.className = "conversation-name";
            title.textContent = name;

            const time = document.createElement("span");
            time.className = "conversation-time";
            time.textContent = formatTime(
                conversation.lastMessage && conversation.lastMessage.createdAt
                    ? conversation.lastMessage.createdAt
                    : conversation.updatedAt
            );

            const preview = document.createElement("span");
            preview.className = "conversation-preview";
            preview.textContent = lastMessagePreview(conversation);

            top.append(title, time);
            copy.append(top, preview);
            button.append(avatar, copy);
            button.addEventListener("click", function () {
                selectConversation(conversation);
            });
            elements.conversationList.appendChild(button);
        });
    }

    function updateConversationPreview(message) {
        const conversationId = getId(message.conversation);
        const conversation = state.conversations.find(function (item) {
            return getId(item) === conversationId;
        });

        if (conversation) {
            conversation.lastMessage = message;
            conversation.updatedAt = message.createdAt || conversation.updatedAt;
            state.conversations.sort(function (a, b) {
                return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
            });
            renderConversations();
        }
    }

    function appendMessage(message) {
        const messageId = getId(message);
        if (messageId && state.renderedMessageIds.has(messageId)) {
            return;
        }
        if (messageId) {
            state.renderedMessageIds.add(messageId);
        }

        const senderId = getId(message.sender);
        const isOwnMessage = senderId && senderId === currentUserId;
        const row = document.createElement("div");
        row.className = "message-row" + (isOwnMessage ? " own" : "");

        const senderName = message.sender && typeof message.sender === "object"
            ? message.sender.name
            : "";

        if (!isOwnMessage && senderName) {
            const sender = document.createElement("span");
            sender.className = "message-sender";
            sender.textContent = senderName;
            row.appendChild(sender);
        }

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        if (message.messageType === "image" && message.imageUrl) {
            const image = document.createElement("img");
            image.src = message.imageUrl;
            image.alt = "Shared image";
            image.style.maxWidth = "220px";
            image.style.maxHeight = "220px";
            image.style.display = "block";
            image.style.borderRadius = "8px";
            bubble.appendChild(image);
        } else if (message.messageType === "file" && message.imageUrl) {
            const link = document.createElement("a");
            link.href = message.imageUrl;
            link.textContent = "Open shared file";
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            bubble.appendChild(link);
        } else {
            bubble.textContent = message.text || "";
        }

        const time = document.createElement("span");
        time.className = "message-time";
        time.textContent = formatTime(message.createdAt);

        row.append(bubble, time);

        const placeholder = elements.messages.querySelector(".messages-empty");
        if (placeholder) {
            placeholder.remove();
        }
        elements.messages.appendChild(row);
        elements.messages.scrollTop = elements.messages.scrollHeight;
    }

    async function selectConversation(conversation) {
        const id = getId(conversation);
        if (!id) {
            return;
        }

        state.activeConversation = conversation;
        state.activeConversationId = id;
        state.renderedMessageIds.clear();
        elements.emptyState.hidden = true;
        elements.conversationView.hidden = false;
        elements.chatTitle.textContent = conversationName(conversation);
        elements.chatAvatar.textContent = initials(conversationName(conversation));
        elements.messages.replaceChildren();

        const loading = document.createElement("p");
        loading.className = "messages-empty";
        loading.textContent = "Loading messages…";
        elements.messages.appendChild(loading);

        elements.messageInput.disabled = false;
        elements.sendButton.disabled = false;
        elements.attachButton.disabled = false;
        renderConversations();

        if (state.socket && state.socket.connected) {
            state.socket.emit("joinConversation", id);
        }

        try {
            const data = await apiRequest(
                "/api/chat/conversations/" + encodeURIComponent(id) + "/messages"
            );

            if (state.activeConversationId !== id) {
                return;
            }

            elements.messages.replaceChildren();
            if (!Array.isArray(data.messages) || !data.messages.length) {
                const empty = document.createElement("p");
                empty.className = "messages-empty";
                empty.textContent = "No messages yet. Send the first one.";
                elements.messages.appendChild(empty);
                return;
            }

            data.messages.forEach(appendMessage);
        } catch (error) {
            if (state.activeConversationId === id) {
                elements.messages.replaceChildren();
                const problem = document.createElement("p");
                problem.className = "messages-empty";
                problem.textContent = error.message;
                elements.messages.appendChild(problem);
            }
        }
    }

    async function loadConversations() {
        setStatus("Loading conversations…");

        try {
            const data = await apiRequest("/api/chat/conversations");
            state.conversations = Array.isArray(data.conversations) ? data.conversations : [];
            setStatus("");
            renderConversations();

            if (!state.conversations.length) {
                state.activeConversation = null;
                state.activeConversationId = "";
                elements.conversationView.hidden = true;
                elements.emptyState.hidden = false;
                return;
            }

            const current = state.conversations.find(function (conversation) {
                return getId(conversation) === state.activeConversationId;
            });

            if (current) {
                state.activeConversation = current;
                renderConversations();
            } else {
                selectConversation(state.conversations[0]);
            }
        } catch (error) {
            if (!elements.statusMessage.classList.contains("error")) {
                setStatus(error.message, "error");
            }
        }
    }

    elements.messageForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const text = elements.messageInput.value.trim();
        const conversationId = state.activeConversationId;
        if (!text || !conversationId) {
            return;
        }

        elements.sendButton.disabled = true;

        try {
            const data = await apiRequest("/api/chat/messages", {
                method: "POST",
                body: JSON.stringify({
                    conversationId: conversationId,
                    text: text
                })
            });

            if (data.message && conversationId === getId(data.message.conversation)) {
                if (state.activeConversationId === conversationId) {
                    appendMessage(data.message);
                }
                updateConversationPreview(data.message);
            }

            if (state.activeConversationId === conversationId) {
                elements.messageInput.value = "";
                elements.messageInput.style.height = "auto";
            }
            setStatus("");
        } catch (error) {
            setStatus(error.message, "error");
        } finally {
            elements.sendButton.disabled = !state.activeConversationId;
            elements.messageInput.focus();
        }
    });

    elements.messageInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            elements.messageForm.requestSubmit();
        }
    });

    elements.messageInput.addEventListener("input", function () {
        elements.messageInput.style.height = "auto";
        elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 120) + "px";
    });

    elements.refreshButton.addEventListener("click", loadConversations);

    elements.attachButton.addEventListener("click", function () {
        if (state.activeConversationId) {
            elements.fileInput.click();
        }
    });

    elements.fileInput.addEventListener("change", async function () {
        const file = elements.fileInput.files[0];
        const conversationId = state.activeConversationId;

        if (!file || !conversationId) {
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setStatus("File must be smaller than 5 MB.", "error");
            elements.fileInput.value = "";
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("conversationId", conversationId);

        elements.attachButton.disabled = true;
        setStatus("Uploading file…");

        try {
            const response = await fetch("/api/chat/upload", {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + token
                },
                body: formData
            });

            const contentType = response.headers.get("content-type") || "";

            let data = {};

            if (contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const errorText = await response.text();
                data.message = errorText.includes("Only JPG")
                    ? "Unsupported file type. Choose JPG, PNG, GIF, WebP, PDF, or TXT."
                    : "File upload failed. Please try again.";
            }

            if (!response.ok || !data.success) {
                throw new Error(data.message || "File upload failed.");
            }

            if (state.activeConversationId === conversationId) {
                appendMessage(data.message);
            }

            updateConversationPreview(data.message);
            setStatus("File uploaded successfully.");
        } catch (error) {
            setStatus(error.message, "error");
        } finally {
            elements.attachButton.disabled = !state.activeConversationId;
            elements.fileInput.value = "";
        }
    });

    elements.logoutButton.addEventListener("click", function () {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/pages/login.html";
    });

    elements.userLabel.textContent = savedUser.name ? "Signed in as " + savedUser.name : "";

    if (!token) {
        elements.socketStatus.textContent = "Sign in for live updates";
        elements.logoutButton.hidden = true;
        setStatus("Please log in to see your conversations.", "error");
        showLoginLink();
        elements.emptyState.hidden = false;
        elements.emptyState.querySelector("h2").textContent = "Log in to chat";
        elements.emptyState.querySelector("p").textContent = "Your account is needed to load your conversations.";
        return;
    }

    if (typeof window.io === "function") {
        state.socket = window.io({
            auth: {
                token: token
            }
        });

        state.socket.on("connect", function () {
            elements.socketStatus.textContent = "Live updates connected";
            elements.socketStatus.className = "socket-status connected";
            if (state.activeConversationId) {
                state.socket.emit("joinConversation", state.activeConversationId);
            }
        });

        state.socket.on("disconnect", function () {
            elements.socketStatus.textContent = "Reconnecting…";
            elements.socketStatus.className = "socket-status disconnected";
        });

        state.socket.on("newMessage", function (message) {
            if (getId(message.conversation) !== state.activeConversationId) {
                return;
            }
            appendMessage(message);
            updateConversationPreview(message);
        });
    } else {
        elements.socketStatus.textContent = "Live updates unavailable";
        elements.socketStatus.className = "socket-status disconnected";
    }

    window.loadConversations = loadConversations;
    window.selectConversation = selectConversation;
    loadConversations();
})();


const userSearchInput = document.getElementById("userSearchInput");
const userSearchResults = document.getElementById("userSearchResults");

let userSearchTimer;

if (userSearchInput && userSearchResults) {
    userSearchInput.addEventListener("input", function () {
        clearTimeout(userSearchTimer);

        const query = userSearchInput.value.trim();

        if (query.length < 2) {
            userSearchResults.innerHTML = "";
            userSearchResults.classList.remove("visible");
            return;
        }

        userSearchResults.innerHTML =
            '<div class="user-search-message">Searching...</div>';
        userSearchResults.classList.add("visible");

        userSearchTimer = setTimeout(async function () {
            try {
                const response = await fetch(
                    "/api/users/search?q=" + encodeURIComponent(query),
                    {
                        headers: {
                            Authorization:
                                "Bearer " + localStorage.getItem("token")
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Search failed");
                }

                userSearchResults.innerHTML = "";

                if (!data.users.length) {
                    userSearchResults.innerHTML =
                        '<div class="user-search-message">No users found.</div>';
                } else {
                    data.users.forEach(function (user) {
                        const item = document.createElement("div");
                        item.className = "user-search-result";item.style.cursor = "pointer";

                        item.addEventListener("click", async function () {
                            try {
                                const response = await fetch("/api/chat/conversations", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "Authorization": "Bearer " + localStorage.getItem("token")
                                    },
                                    body: JSON.stringify({
                                        participantId: user._id
                                    })
                                });

                                const result = await response.json();

                                if (!response.ok || !result.success) {
                                    throw new Error(result.message || "Could not start conversation");
                                }

                                userSearchResults.classList.remove("visible");
                                userSearchInput.value = "";

                                await window.loadConversations();

                                const conversation = result.conversation;

                                if (conversation) {
                                    await window.selectConversation(conversation);
                                }
                            } catch (error) {
                                alert(error.message);
                            }
                        });

                        const name = document.createElement("strong");
                        name.textContent = user.name;

                        const email = document.createElement("span");
                        email.textContent = user.email;

                        item.append(name, email);
                        userSearchResults.appendChild(item);
                    });
                }

                userSearchResults.classList.add("visible");
            } catch (error) {
                userSearchResults.innerHTML = "";

                const message = document.createElement("div");
                message.className = "user-search-message";
                message.textContent = error.message;

                userSearchResults.appendChild(message);
                userSearchResults.classList.add("visible");
            }
        }, 300);
    });

    document.addEventListener("click", function (event) {
        if (!event.target.closest(".user-search")) {
            userSearchResults.classList.remove("visible");
        }
    });
}
