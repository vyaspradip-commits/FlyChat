function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function removeData(key) {
    localStorage.removeItem(key);
}


// =========================
// CURRENT USER
// =========================

function setCurrentUser(user) {

    sessionStorage.setItem(
        "currentUser",
        JSON.stringify(user)
    );

}

function getCurrentUser() {

    const data =
        sessionStorage.getItem("currentUser");

    if (!data) {
        return null;
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        console.error(
            "Could not read current user:",
            error
        );
        return null;
    }
}


// =========================
// LOGIN STATUS
// =========================

function isLoggedIn() {

    return (
        sessionStorage.getItem("loggedIn") === "true" &&
        sessionStorage.getItem("currentUser") !== null
    );

}

function getCurrentTime(){
    let now = new Date();
    return now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getCurrentDate(){
    let now = new Date();
    return now.toLocaleDateString();
}

function getPrivateChatKey(userEmail){
    let current = getCurrentUser();
    if(!current) return "";
    return "chat_" + current.email + "_" + userEmail;
}

function getGroupChatKey(groupName){
    return "group_" + groupName;
}

function getProfileImage(){
    const user = getCurrentUser();
    if(user && user.profileImage){
        return user.profileImage;
    }
    return "images/user.png";
}

function escapeHTML(text){
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}

function scrollToBottom(id) {
    let box = document.getElementById(id);
    if(!box) return;
    box.scrollTop = box.scrollHeight;
}

function showAlert(message){
    alert(message);
}

function showConfirm(message) {
    return confirm(message);
}

function generateID(){
    return Date.now().toString(36) + Math.random().toString(36).substring(2,8);
}

function loadCurrentUserImage(){
    const user = getCurrentUser();
    if(!user) return;
    const images = document.querySelectorAll(".user-dp");
    images.forEach(function(img){
        img.src=user.profileImage || "images/user.png";
    });
}

function applyDarkMode(){
    const darkMode = localStorage.getItem("darkMode") === "true";
    if (darkMode) {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
}

function toggleDarkMode(){
    const enabled = document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode",enabled?"true":"false");
}

window.addEventListener("DOMContentLoaded", function () {
    applyDarkMode();
})