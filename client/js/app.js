const currentPage = window.location.pathname.split("/").pop();
const protectedPages = [
    "dashboard.html",
    "profile.html",
    "settings.html",
    "create-group.html",
    "chat.html",
    "group.html",
    "privacy.html"
];
if(protectedPages.includes(currentPage)){
    let loggedIn = sessionStorage.getItem("loggedIn");
    let currentUser = sessionStorage.getItem("currentUser");
    if(loggedIn !== "true" || currentUser === null){
        window.location.replace("login.html");
    }
}
document.addEventListener("DOMContentLoaded", function(){
    console.log("FlyChat Started");
    loadCurrentUserImage();
});
function darkMode() {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("darkMode", "enabled");
    } else {
        localStorage.setItem("darkMode", "disabled");
    }
}

window.addEventListener("DOMContentLoaded", function () {
    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark-mode");
    }
});

function setMobileHeight(){
    let height = window.innerHeight;

    if (window.visualViewport) {
        height = window.visualViewport.height;
    }
    document.documentElement.style.setProperty("--mobile-height", height + "px");
}

setMobileHeight();

if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", setMobileHeight);
}

// =========================
// FLYCHAT REAL-TIME SYNC
// =========================

function startRealtimeSync() {

    if (!window.EventSource) {
        console.warn("Realtime updates are not supported.");
        return;
    }

    const realtime = new EventSource("/api/realtime");

    realtime.onopen = function () {
        console.log("FlyChat realtime connection established.");
    };

    realtime.onmessage = function (event) {

        try {

            const data = JSON.parse(event.data);

            if (data.type === "connected") {
                console.log("Realtime sync connected.");
                return;
            }
            if (data.type === "message-received") {

                console.log(
                    "New message received:",
                    data
                );

                window.dispatchEvent(
                    new CustomEvent("flychat-message-received", {
                        detail: data
                    })
                );

            }
            if (data.type === "group-updated") {

                console.log(
                    "Group updated on another device:",
                    data.group
                );

                window.dispatchEvent(
                    new CustomEvent("flychat-group-updated", {
                        detail: data
                    })
                );

                // Refresh current page so the new group data appears.
                location.reload();
            }
            if (data.type === "message-received") {

                const message =
                    data.message;

                if (!message) {
                    return;
                }

                const currentUser =
                    typeof getCurrentUser === "function"
                        ? getCurrentUser()
                        : null;

                if (!currentUser) {
                    return;
                }

                // Only move the chat for the RECEIVER
                if (
                    String(currentUser.email)
                        .toLowerCase()
                        .trim() !==
                    String(message.receiverEmail)
                        .toLowerCase()
                        .trim()
                ) {
                    return;
                }

                console.log(
                    "New message received:",
                    message
                );

                // Find sender's chat
                const chatItem =
                    document.querySelector(
                        `.chat-item[data-user-email="${CSS.escape(
                            message.senderEmail
                        )}"]`
                    );

                if (chatItem) {

                    // Update activity time
                    chatItem.dataset.lastActivity =
                        new Date().toISOString();

                    // Move sender's chat to TOP
                    const chatList =
                        document.querySelector(".chat-list").prepend(item);

                    if (chatList) {
                        chatList.prepend(chatItem);
                    }

                    console.log(
                        "Sender chat moved to top:",
                        message.senderEmail
                    );
                }

            }
            if (data.type === "profile-updated") {

                console.log(
                    "Profile updated on another device:",
                    data.user
                );

                window.dispatchEvent(
                    new CustomEvent("flychat-profile-updated", {
                        detail: data
                    })
                );

                // Refresh current page so the new profile appears.
                location.reload();
            }

        } catch (error) {

            console.error(
                "Realtime event error:",
                error
            );

        }
    };

    realtime.onerror = function () {
        console.warn(
            "Realtime connection interrupted. Browser will retry automatically."
        );
    };
}

startRealtimeSync();