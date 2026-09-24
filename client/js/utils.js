function saveData(key, value){
    localStorage.setItem(key, JSON.stringify(value));
}

function loadData(key){
    let data = localStorage.getItem(key);
    if(data === null){
        return null;
    }
    return JSON.parse(data);
}

function removeData(key) {
    localStorage.removeItem(key);
}

function getCurrentUser(){
    return loadData("currentUser");
}

function setCurrentUser(user){
    saveData("currentUser",user);
}
function isLoggedIn(){
    return localStorage.getItem("loggedIn") === "true";
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
    let image = localStorage.getItem("profileImage");
    if(image){
        return image;
    }
    return "image/user.png";
}

function escapeHTML(text){
    const div = document.customElement("div");
    div.innerText = text;
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