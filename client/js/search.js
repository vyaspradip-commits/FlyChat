function initializeSearch(){
    const searchInput = document.getElementById("searchUser");
    if(!searchInput) return;
    searchInput.addEventListener("input", searchChats);
}
function searchChats(){
    const keyword =
        document.getElementById("searchUser")
        .value
        .trim()
        .toLowerCase();

    const chatItems = document.querySelectorAll(".chat-item");
    let found = false;
    chatItems.forEach(function(chat){
        let name = chat.dataset.name;
        if(!name){
            name=
                chat.querySelector("h3")
                .innerText;
        }
        name = name.toLowerCase();
        if(name.includes(keyword)){
            chat.style.display = "flex";
            found = true;
        }
        else{
            chat.style.display="none";
        }
    });
    let noResult = document.getElementById("noResult");
    if(noResult){
        if(found){
            noResult.style.display="none";
        }
        else{
            noResult.style.display="block";
        }
    }
}
function clearSearch(){
    let input=document.getElementById("searchUser");
    if(!input) return;
    input.value = "";
    searchChats();
}

window.addEventListener("load", function(){
    initializeSearch();
});