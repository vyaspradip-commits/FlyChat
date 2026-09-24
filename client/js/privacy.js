function loadPrivacyPage() {
    let currentUser = getCurrentUser();
    if(!currentUser){
        return;
    }
    loadPrivacyUsers();
    let key = "privacy_"+currentUser.id;
    let privacy = loadData(key);
    if(!privacy){
        privacy={visibility:"everyone",selectedUsers: []};
    }
    let radio = document.querySelector('input[value="'+privacy.visibility+'"]');
    if (radio) {
        radio.checked = true;
    }
    let checkboxes = document.querySelectorAll(".privacy-user");
    checkboxes.forEach(function(checkbox){
        if(privacy.selectedUsers.includes(checkbox.value)){
            checkbox.checked=true;
        }
    });
    updateSelectedUsersBox();
}

function loadPrivacyUsers(){
    let currentUser = getCurrentUser();
    let users= loadData("users") || [];
    let userList = document.getElementById("privacyUserList");
    if(!userList){
        return;
    }
    userList.innerHTML="";
    users.forEach(function(user){
        if(user.id===currentUser.id){
            return;
        }
        let div = document.createElement("div");
        div.className="privacy-user-item";
        div.innerHTML=`
            <img src="${user.profileImage || "images/user.png"}" class="privacy-avatar">
                <div class="privacy-user-info">
                    <b>${user.name}</b>
                </div>
                <small>
                    ${user.email}
                </small>
            </div>
            <input
                type="checkbox"
                class="privacy-user"
                value="${user.id}">
        `;
        userList.appendChild(div);
    });
}

function savePrivacy(){
    let currentUser = getCurrentUser();
    if (!currentUser) {
        return;
    }
    let selectedOption = document.querySelector('input[name="profileVisibility"]:checked');
    if (!selectedOption) {
        alert("Please select a privacy option.");
        return;
    }
    let selectedUsers=[];
    let checkboxes = document.querySelectorAll(".privacy-user:checked");
    checkboxes.forEach(function(checkbox){
        selectedUsers.push(checkbox.value);
    });
    if (selectedOption.value === "selected" && selectedUsers.length === 0) {
        alert("Please select at lease one account.");
        return;
    }
    let privacy = {visibility:selectedOption.value, selectedUsers:selectedUsers};
    let key = "privacy_" +currentUser.id;
    saveData(key,privacy);
    alert("Privacy settings saved.");
}

function updateSelectedUsersBox(){
    let selected = document.querySelector('input[name="profileVisibility"]:checked');
    let box = document.getElementById("selectedUsersBox");
    if (!box) {
        return
    }
    if (selected && selected.value === "selected") {
        box.style.display="block";
    }else{
        box.style.display="none";
    }
}

document.addEventListener("DOMContentLoaded", function(){
    loadPrivacyPage();
    let radios = document.querySelectorAll('input[name="profileVisibility"]');
    radios.forEach(function(radio){
        radio.addEventListener("change",updateSelectedUsersBox);
    });
});