const flyChatEmojis = [
    "😀","😁","😂","🤣","😊","😍","😘","😎",
    "😭","😡","🥳","🤔","🙄","😴","😇","🤗",
    "👍","👎","👏","🙏","👌","💪","🤝","✌️",
    "❤️","💙","💚","💛","🧡","💜","🖤","🤍",
    "🔥","✨","⭐","🌹","🎉","🎂","🎁","🎈",
    "🚀","📱","💻","📷","🎵","⚽","🏆","🍕"
];
function initializePrivateEmoji(){
    const btn =
        document.getElementById("emojiBtn");
    const box =
        document.getElementById("emojiBox");
    const input =
        document.getElementById("messageInput");
    if(!btn || !box || !input) return;
    box.innerHTML = "";
    flyChatEmojis.forEach(function(emoji){
        let span = document.createElement("span");
        span.className = "emoji-item";
        span.textContent = emoji;
        span.onclick = function(event){
            event.stopPropagation();
            input.value += emoji;
            input.focus();
            box.style.display = "none";
        };
        box.appendChild(span);
    });
    btn.onclick = function(event){
        event.stopPropagation();
        if(box.style.display === "flex"){
            box.style.display = "none";
        }
        else{
            box.style.display = "flex";
        }
    };
}
function initializeGroupEmoji(){
    const btn =
        document.getElementById("groupEmojiBtn");
    const box =
        document.getElementById("groupEmojiBox");
    const input =
        document.getElementById("groupMessageInput");
    if(!btn || !box || !input) return;
    box.innerHTML = "";
    flyChatEmojis.forEach(function(emoji){
        let span = document.createElement("span");
        span.className = "emoji-item";
        span.textContent = emoji;
        span.onclick = function(event){
            event.stopPropagation();
            input.value += emoji;
            input.focus();
            box.style.display = "none";
        };
        box.appendChild(span);
    });
    btn.onclick = function(event){
        event.stopPropagation();
        if(box.style.display === "flex"){
            box.style.display = "none";
        }
        else{
            box.style.display = "flex";
        }
    };
}
document.addEventListener("click",function(e){
    let privateBox =
        document.getElementById("emojiBox");
    let privateBtn =
        document.getElementById("emojiBtn");
    if(privateBox && privateBtn){
        if(
            !privateBox.contains(e.target) &&
            !privateBtn.contains(e.target)
        ){
            privateBox.style.display="none";
        }
    }
    let groupBox =
        document.getElementById("groupEmojiBox");
    let groupBtn =
        document.getElementById("groupEmojiBtn");
    if(groupBox && groupBtn){
        if(
            !groupBox.contains(e.target) &&
            !groupBtn.contains(e.target)
        ){
            groupBox.style.display="none";
        }
    }
});