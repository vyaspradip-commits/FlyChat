const protectedPages = [
    "dashboard.html",
    "chat.html",
    "profile.html",
    "settings.html"
];

let currentPage = window.location.pathname.split("/").pop();

if (protectedPages.includes(currentPage)) {
    let loggedIn = localStorage.getItem("loggedIn");
    if (loggedIn !== "true") {
        window.location.href = "login.html";
    }
}
window.onload=function(){
    let messages = document.getElementById("messages");
    if (messages) {
        let params = new URLSearchParams(
            window.location.search
        );
        let user = params.get("user");
        if (!user) {
            user="Unknown";
        }
        let key = "chat_" + user;
        let sevedMessages = JSON.parse(
            localStorage.getItem(key)
        ) || [];
        sevedMessages.forEach(function(msg){
            if (typeof msg === "object") {
                addMessage(
                    msg.text,
                    msg.time,
                    msg.date
                );
            }
            else{
                addMessage(
                    msg,
                    "",
                    ""
                );
            }
        });
    }
}

function darkMode(){
    document.body.classList.toggle("dark");
    if(document.body.classList.contains("dark")){
        localStorage.setItem("theme","dark");
    }
    else{
        localStorage.setItem("theme","light");
    }
}

function logout(){
    let confirmLogout = confirm(
        "Are you sure you want to logout?"
    );
    if(confirmLogout){
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("currentUser");
        window.location.href="login.html";
    }
}

function sendMessage(){
    let input = document.getElementById("messageInput");
    let messages = document.getElementById("messages");
    let params = new URLSearchParams(window.location.search);
    let user = params.get("user");
    if (!user) {
        user="Unknown";
    }

    let text = input.value.trim();

    if (text !== "") {
        let now = new Date();
        let time = now.toLocaleTimeString([], {
            hour:"2-digit",
            minute:"2-digit"
        });
        let date = now.toLocaleDateString();
        addMessage(
            text,
            time,
            date
        );
        let key = "chat_" + user;
        let oldMessages = JSON.parse(
            localStorage.getItem(key)
        ) || [];
        oldMessages.push({
            text:text,
            time:time,
            date:date
        });
        localStorage.setItem(
            key,
            JSON.stringify(oldMessages)
        );
        input.value="";
        messages.scrollTop = messages.scrollHeight;
    }
}

function addMessage(text,time,date){
    let messages = document.getElementById("messages");
    let div = document.createElement("div");
    div.className = "message sent";
    div.innerHTML = `
        <div>
            ${text}
        </div>
        
        ${
            time ?
            `<small class="message-time">
                ${time} || ${date}
            </small>`
            :
            ""
        }
    `;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

let emojis=["😀","😂","😍","❤️","👍","🔥","🚀","😊","😎","😭","😡","👏","🎉"];
let emojiBtn=document.getElementById("emojiBtn");
let emojiBox=document.getElementById("emojiBox");
if (emojiBtn) {
    emojis.forEach(function(e){
        let span=document.createElement("span");
        span.innerHTML=e;
        span.onclick=function(){
            document.getElementById("messageInput").value += e;
        };
        emojiBox.appendChild(span);
    });
    emojiBtn.onclick=function(){
        if(emojiBox.style.display==="block"){
            emojiBox.style.display="none";
        }
        else{
            emojiBox.style.display="block";
        }
    };
}

function saveProfile(){
    let profile={
        name:
        document.getElementById("profileName").value,
        email:
        document.getElementById("profileEmail").value,
        status:
        document.getElementById("profileStatus").value
    };
    localStorage.setItem(
        "profile",
        JSON.stringify(profile)
    );

    alert("Profile Saved");
}

window.addEventListener("load", ()=>{
    let data=JSON.parse(
        localStorage.getItem("profile")
    );
    if (data) {
        if (document.getElementById("profileName")) {
            document.getElementById("profileName").value=data.name;
            document.getElementById("profileEmail").value=data.email;
            document.getElementById("profileStatus").value=data.status;
        }
    }
});

function registerUser(){

    let name = document.getElementById("registerName").value.trim();
    let email = document.getElementById("registerEmail").value.trim();
    let password = document.getElementById("registerPassword").value;

    let passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;

    if(!passwordPattern.test(password)){
        alert("Password is not strong enough.");
        return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];

    let exists = users.find(user => user.email === email);

    if(exists){
        alert("Email already registered.");
        return;
    }

    users.push({
        name:name,
        email:email,
        password:password
    });

    localStorage.setItem("users", JSON.stringify(users));

    alert("Account Created Successfully");

    window.location.href="login.html";
}

function loginUser(){

    let email = document.getElementById("loginEmail").value.trim();
    let password = document.getElementById("loginPassword").value;

    let users = JSON.parse(localStorage.getItem("users")) || [];

    let user = users.find(
        u => u.email === email && u.password === password
    );

    if(user){

        localStorage.setItem("loggedIn","true");
        localStorage.setItem("currentUser",user.name);
        localStorage.setItem("currentEmail",user.email);

        window.location.href="dashboard.html";

    }else{

        alert("Invalid Email or Password");

    }

}

function checkLogin(){

    console.log("checkLogin is running");


    let loggedIn = localStorage.getItem("loggedIn");


    console.log("Login:", loggedIn);


    if(loggedIn !== "true"){

        window.location.href="login.html";

    }

}

function loadChatUser(){

    console.log("loadChatUser started");


    let chatUser = document.getElementById("chatUser");


    console.log("Header element:", chatUser);


    let params = new URLSearchParams(window.location.search);


    let user = params.get("user");


    console.log("User from URL:", user);


    if(chatUser && user){

        chatUser.innerHTML = "💬 Chat with " + user;

    }

}

window.addEventListener("load", function(){

    loadChatUser();

});

if (searchBox) {
    searchBox.addEventListener("keyup", function(){
        let value = searchBox.value.toLowerCase();
        let chatLinks = document.querySelectorAll(".chat-list a");
        let found = false;
        chatLinks.forEach(function(link){
            let name = link
            .querySelector("h3")
            .innerText
            .toLowerCase();
            if (name.includes(value)) {
                link.style.display="block";
                found=true;
            }
            else{
                link.style.display="none";
            }
        });
        let noUser = document.getElementById("noUser");
        if (noUser) {
            if (found) {
                noUser.style.display="none";
            }
            else{
                noUser.style.display="block";
            }
        }
    });
}

function sendGroupMessage(){
    let input=document.getElementById("groupMessageInput");
    console.log("Group send clicked");
    console.log("Input:", input.value);
    let text=input.value.trim();
    if (text==="") {
        return;
    }
    let now=new Date();
    let message={
        sender:
        localStorage.getItem("currentUser") || "User",
        text:text,
        time:
        now.toLocaleTimeString([],{
            hour:"2-digit",
            minute:"2-digit"
        }),

        date:
        now.toLocaleDateString()
    };
    let messages=JSON.parse(
        localStorage.getItem("group_FlyChatTeam")
    ) || [];
    messages.push(message);
    localStorage.setItem(
        "group_FlyChatTeam",
        JSON.stringify(messages)
    );
    showGroupMessage(message);
    input.value="";
}

function showGroupMessage(message){
    let box = document.getElementById("groupMessages");
    console.log("Message box:", box);
    if(!box){
        console.log("Group message area not found");
        return;
    }
    let div = document.createElement("div");
    div.className = "message sent";
    div.innerHTML = `
        <div>
            <b>${message.sender}</b>
        </div>
        <div>
            ${message.text}
        </div>
        <small class="message-time">
            ${message.time} | ${message.date}
        </small>
    `;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function loadGroupMessages(){
    let box = document.getElementById("groupMessages");
    if (!box) {
        return;
    }
    let messages = JSON.parse(
        localStorage.getItem("group_FlyChatTeam")
    ) || [];
    messages.forEach(function(msg){
        showGroupMessage(msg);
    });
    box.scrollTop = box.scrollHeight;
}

let groupEmojiBtn = document.getElementById("groupEmojiBtn");
let groupEmojiBox = document.getElementById("groupEmojiBox");
let groupEmojis = [
    "😀",
    "😂",
    "😍",
    "❤️",
    "👍",
    "🔥",
    "🚀",
    "😊",
    "😎",
    "😭",
    "😡",
    "👏",
    "🎉"
];

if (groupEmojiBtn && groupEmojiBox) {
    groupEmojis.forEach(function(e){
        let span = document.createElement("span");
        span.innerHTML = e;
        span.onclick = function(){
            document.getElementById("groupMessageInput").value += e;
        };
        groupEmojiBox.appendChild(span);
    });
    groupEmojiBtn.onclick=function(){
        if (groupEmojiBox.style.display==="block") {
            groupEmojiBox.style.display="none";
        }
        else{
            groupEmojiBox.style.display="block";
        }
    };
}

document.addEventListener("DOMContentLoaded", function(){
    let messageInput = document.getElementById("messageInput");
    if (messageInput) {
        messageInput.addEventListener("keydown", function(event){
            if (event.key === "Enter") {
                event.preventDefault();
                sendMessage();
            }
        });
    }
});
let groupMessageInput = document.getElementById("groupMessageInput");
if (groupMessageInput) {
    groupMessageInput.addEventListener("keydown", function(event){
        if (event.key === "Enter") {
            event.preventDefault();
            sendGroupMessage();
        }
    });
}

window.addEventListener("load", function(){
    loadGroupMessages();
});

function loadProfile(){

    let user = JSON.parse(
        localStorage.getItem("user")
    );


    let profile = JSON.parse(
        localStorage.getItem("profile")
    );


    if(user){

        document.getElementById("profileName").value =
        user.name;


        document.getElementById("profileEmail").value =
        user.email;

    }


    if(profile){

        document.getElementById("profileName").value =
        profile.name;


        document.getElementById("profileStatus").value =
        profile.status;

    }

}

function previewImage(){


    let file =
    document.getElementById("imageUpload").files[0];


    let image =
    document.getElementById("profileImage");



    if(file){


        let reader=new FileReader();



        reader.onload=function(e){

            image.src=e.target.result;

        }


        reader.readAsDataURL(file);

    }

}

function loadProfileImage(){
    let image = localStorage.getItem("profileImage");
    if (image) {
        let images = document.querySelectorAll(".profile-image, .avatar, .user-dp");
        images.forEach(function(img){
            img.src=image;
        });
    }
}

window.addEventListener("load", function(){
    loadProfileImage();
})

let currentChatUser = "";

function openChat(user){

    currentChatUser = user;

    let chatArea = document.getElementById("chatArea");

    chatArea.innerHTML = `

        <div class="chat-header">

            <img class="avatar"
                 src="images/user.png">

            <div>

                <h3>${user}</h3>

                <small>🟢 Online</small>

            </div>

        </div>

        <div class="chat-box" id="messages">

        </div>

        <div class="chat-input">

            <button
                class="emoji-btn"
                id="emojiBtn">
                😊
            </button>

            <input
                id="messageInput"
                type="text"
                placeholder="Type a message...">

            <button onclick="sendMessage()">
                Send
            </button>

        </div>

        <div id="emojiBox"
             class="emoji-box">

        </div>

    `;
    initializeEnterToSend();
    initializeEmoji();
}

// =========================
// SEARCH USERS & GROUPS
// =========================

function initializeSearch() {

    const searchInput = document.getElementById("searchUser");

    if (!searchInput) return;

    searchInput.addEventListener("input", function () {

        const keyword = this.value.trim().toLowerCase();

        const chatItems = document.querySelectorAll(".chat-item");

        let found = false;

        chatItems.forEach(item => {

            const name = item.dataset.name.toLowerCase();

            if (name.includes(keyword)) {

                item.style.display = "flex";
                found = true;

            } else {

                item.style.display = "none";

            }

        });

        const noResult = document.getElementById("noResult");

        if (noResult) {

            noResult.style.display = found ? "none" : "block";

        }

    });

}
// =========================
// EMOJI PICKER
// =========================

function toggleEmojiPicker() {

    const picker = document.getElementById("emojiPicker");

    if (!picker) return;

    picker.classList.toggle("show");

}
function insertEmoji(emoji) {

    const privateInput = document.getElementById("messageInput");

    const groupInput = document.getElementById("groupMessage");

    const input = privateInput || groupInput;

    if (!input) return;

    input.value += emoji;

    input.focus();

}
document.addEventListener("click", function (e) {

    const picker = document.getElementById("emojiPicker");

    const button = document.getElementById("emojiBtn");

    if (!picker || !button) return;

    if (
        !picker.contains(e.target) &&
        !button.contains(e.target)
    ) {

        picker.classList.remove("show");

    }

});
// =========================
// ENTER TO SEND
// =========================

function initializeEnterToSend() {

    const privateInput = document.getElementById("messageInput");

    if (privateInput) {

        privateInput.addEventListener("keydown", function (e) {

            if (e.key === "Enter" && !e.shiftKey) {

                e.preventDefault();

                sendMessage();

            }

        });

    }

    const groupInput = document.getElementById("groupMessageInput");

    if (groupInput) {

        groupInput.addEventListener("keydown", function (e) {

            if (e.key === "Enter" && !e.shiftKey) {

                e.preventDefault();

                sendGroupMessage();

            }

        });

    }

}
document.addEventListener("DOMContentLoaded", () => {

    initializeSearch();

    initializeEnterToSend();

});