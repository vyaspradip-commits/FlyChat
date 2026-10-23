let selectedEditGroupImage = null;

function getCurrentGroup() {
    const groups = loadData("groups") || [];
    if (!currentGroupId) {
        console.log("No current group ID.");
        return null;
    }
    const group = groups.find(function (g){
        return g.id === currentGroupId; 
    });

    if (!group) {
        console.log("Group not found:",currentGroupId);
        return null;
    }
    return group;
}

function openEditGroup() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert("Please login first.");
        return;
    }
    const group = getCurrentGroup();
    if (!group) {
        alert("Group not found.");
        return;
    }
    if (group.creatorId !== currentUser.id) {
        alert("Only the group admin can edit this group.");
        return;
    }
    const editBox = document.getElementById("editGroupBox");
    const nameInput = document.getElementById("editGroupName");
    const image = document.getElementById("editGroupImage");
    if (!editBox || !nameInput || !image) {
        return;
    }
    nameInput.value =group.name || "";
    image.src = group.image || "images/user.png";
    selectedEditGroupImage = group.image || "images/user.png";
    editBox.style.display = "block";
}

function closeEditGroup() {
    const editBox = document.getElementById("editGroupBox");
    if (!editBox) {
        return;
    }
    editBox.style.display = "none";
}

function previewEditGroupImage(){
    const input = document.getElementById("editGroupImageUpload");
    const image = document.getElementById("editgroupImage");
    if (!input || !image) {
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event){
        image.src = event.target.result;
        selectedEditGroupImage = event.target.result;
    };
    reader.readAsDataURL(file);
}

function saveGroupChanges() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert("Please login first.");
        return;
    }
    const groups = loadData("groups") || [];
    const groupIndex = group.findIndex(function (g){
        return g.id === currentGroupId;
    });
    if (groupIndex === -1) {
        alert("Group not found.");
        return;
    }
    const group = groups[groupIndex];

    if (group.creatorId !== currentUser.id) {
        alert("Only the group admin can edit this group.");
        return;
    }
    const nameInput = document.getElementById("editGroupName");
    if (!nameInput) {
        return;
    }
    const newName = nameInput.value.trim();
    if (newName === "") {
        alert("Please enter a group name.");
        return;
    }

    group.name = newName;
    if(selectedEditGroupImage){
        group.image =
            selectedEditGroupImage;

    }


    groups[groupIndex] =
        group;


    saveData(
        "groups",
        groups
    );


    console.log(
        "Group updated:",
        group
    );


    // =========================
    // UPDATE HEADER
    // =========================

    const headerName =
        document.getElementById(
            "groupHeaderName"
        );


    const headerImage =
        document.getElementById(
            "groupHeaderImage"
        );


    if (headerName) {

        headerName.textContent =
            group.name;

    }


    if (headerImage) {

        headerImage.src =
            group.image ||
            "images/user.png";

    }


    closeEditGroup();


    alert(
        "Group updated successfully!"
    );
}


// =========================
// IMAGE INPUT
// =========================

function initializeGroupEdit() {

    const input =
        document.getElementById(
            "editGroupImageUpload"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "change",
        previewEditGroupImage
    );
}