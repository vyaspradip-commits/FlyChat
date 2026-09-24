function getCurrentGroupKey(){
    if(!currentGroupId){
        console.log("No current group selected.");
        return null;
    }
    return "group_" + currentGroupId;
}
function loadGroupMessages(){
    let box = document.getElementById("groupMessages");
    if(!box) return;
    const key = getCurrentGroupKey();
    if (!key) return;
    box.innerHTML = "";
    let messages = loadData(key) || [];
    messages.forEach(function(msg){
        createGroupMessage(msg);
    });
    box.scrollTop = box.scrollHeight;
}
function sendGroupMessage(){
    let input = document.getElementById("groupMessageInput");
    if(!input) return;
    let text = input.value.trim();
    if(text === "") return;
    const key = getCurrentGroupKey();
    if(!key){
        alert("Group ID not found.");
        return;
    }
    let currentUser = getCurrentUser();
    let sender = currentUser ? currentUser.name:"Unknownn";
    let now = new Date();
    let message = {
        id: generateID(),
        sender: sender,
        text: text,
        time:
            now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            }),
        status: "✓"
    };
    let messages = loadData(key) || [];
    messages.push(message);
    saveData(key, messages);
    createGroupMessage(message);
    input.value = "";
    input.focus();
}

function createGroupMessage(message){
    let box = document.getElementById("groupMessages");
    if(!box) return;
    let div = document.createElement("div");
    div.className = "message sent";
    div.innerHTML=`
        <div class="message-sender">
            <b>${message.sender}</b>
        </div>
        <div class="message-text">
            ${message.text}
        </div>
        <small class="message-time">
            ${message.time} ${message.status || "✓"}
        </small>
    `;
    box.appendChild(div);
    box.scrollTop=box.scrollHeight;
}

function initializeGroupEnter(){
    let input = document.getElementById("groupMessageInput");
    if(!input) return;
    input.addEventListener("keydown", function(e){
        if(e.key === "Enter") {
            e.preventDefault();
            sendGroupMessage();
        }
    });
}