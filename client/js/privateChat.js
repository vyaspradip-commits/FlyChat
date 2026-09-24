function loadPrivateMessages() {
    if(!currentChat) return;
    let box = document.getElementById("messages");
    if(!box) return;
    box.innerHTML="";
    let key = "private_"+currentChat;
    let messages = JSON.parse(localStorage.getItem(key)) || [];
    messages.forEach(function(msg){
        createPrivateMessage(msg);
    });
    box.scrollTop = box.scrollHeight;
}

function sendMessage() {
    let input = document.getElementById("messageInput");
    if (!input) return;
    let text = input.value.trim();
    if(text == "") return;
    let now = new Date();
    let message = {
        sender:
            localStorage.getItem("currentUser"),
        text: text,
        time:
            now.toLocaleTimeString([],{
                hour:"2-digit",
                minute:"2-digit"
            }),
        status:"✓"
    };
    let key = "private_" + currentChat;
    let messages = JSON.parse(localStorage.getItem(key)) || [];
    messages.push(message);
    localStorage.setItem(
        key,
        JSON.stringify(messages)
    );
    createPrivateMessage(message);
    input.value="";
    input.focus();
}

function createPrivateMessage(message) {
    let box = document.getElementById("messages");
    if (!box) return;
    let div = document.createElement("div");
    div.className="message sent";
    div.innerHTML=`
        <div class="message-text">
            ${message.text}
        </div>
        <small class="message-time">
            ${message.time}
            ${message.status}
        </small>
    `;    
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function initializePrivateEnter() {
    let input = document.getElementById("messageInput");
    if(!input) return;
    input.addEventListener("keydown",function(e){
        if(e.key==="Enter"){
            e.preventDefault();
            sendMessage();
        }
    });
}