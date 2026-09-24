let selectedGroupImage = "images/user.png";
function loadGroupMembers() {
    const memberList = document.getElementById("memberList");
    if (!memberList) return;
    memberList.innerHTML = "";
    const currentUser = getCurrentUser();
    const users = loadData("users") || [];
    users.forEach(function(user){
        if (currentUser && user.id === currentUser.id) {
            return;
        }
        const div = document.createElement("div");
        div.className = "member-item";
        div.innerHTML=`
            <img src="${user.profileImage || "image/user.png"}" alt="user">
            <div class="member-info">
                <h4>${user.name}</h4>
                <small>${user.email}</small>
            </div>
            <input type="checkbox" class="group-member" value="${user.id}">
        `;
        memberList.appendChild(div);
    });
}

function previewGroupImage(){
    const input = document.getElementById("groupImageUpload");
    const image = document.getElementById("groupImage");
    if(!input || !image) return;
    const file = input.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e){
        image.src=e.target.result;
        selectedGroupImage = e.target.result;
    };
    reader.readAsDataURL(file);
}

function createGroup(){
    const nameInput = document.getElementById("groupName");
    const descriptionInput = document.getElementById("groupDescription");
    if(!nameInput) return;
    const groupName = nameInput.value.trim();
    const description = descriptionInput.value.trim();
    if (groupName === "") {
        showAlert("Please enter group name.");
        return;
    }
    const currentUser = getCurrentUser();
    if (!currentUser){
        showAlert("Please login first.");
        return;
    }
    const checkboxes = document.querySelectorAll(".group-member:checked");
    let memberIds = [];
    checkboxes.forEach(function(box){
        memberIds.push(box.value);
    });
    if (!memberIds.includes(currentUser.id)) {
        memberIds.unshift(currentUser.id);
    }
    if (memberIds.length < 2) {
        showAlert("Select at least one member.");
        return;
    }
    const group = {
        id: "group_" + Date.now().toString(36)+Math.random().toString(36).substring(2, 7),
        name: groupName,
        description:description,
        image:"images/user.png",
        creatorId:currentUser.id,
        members:memberIds,
        createdAt:new Date().toISOString()
    };
    const groups = loadData("groups") || [];
    groups.push(group);
    saveData("groups",groups);
    console.log("Group created:",group);
    showAlert("Group created successfully!");
    window.location.href="dashboard.html";
}