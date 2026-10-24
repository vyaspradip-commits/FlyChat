
let selectedGroupImage = "images/user.png";
let editingGroupId = null;

// =========================
// INITIALIZE CREATE / EDIT
// =========================

function initializeGroupForm() {
    const currentUser = getCurrentUser();

    editingGroupId = sessionStorage.getItem("editingGroupId");

    const groups = loadData("groups") || [];
    let editingGroup = null;

    if (editingGroupId) {
        editingGroup = groups.find(function (group) {
            return String(group.id) === String(editingGroupId);
        });

        if (!editingGroup) {
            sessionStorage.removeItem("editingGroupId");
            showAlert("Group not found.");
            window.location.href = "dashboard.html";
            return;
        }

        // Only the group creator can edit group details.
        if (
            editingGroup.creatorId &&
            (!currentUser ||
             String(editingGroup.creatorId) !== String(currentUser.id))
        ) {
            sessionStorage.removeItem("editingGroupId");
            showAlert("Only the group creator can edit this group.");
            window.location.href = "dashboard.html";
            return;
        }

        document.getElementById("groupFormTitle").textContent =
            "Edit Group";

        document.getElementById("createGroupButton").textContent =
            "💾 Save Changes";

        document.getElementById("groupName").value =
            editingGroup.name || "";

        document.getElementById("groupDescription").value =
            editingGroup.description || "";

        selectedGroupImage =
            editingGroup.image || "images/user.png";

        document.getElementById("groupImage").src =
            selectedGroupImage;
    } else {
        document.getElementById("groupFormTitle").textContent =
            "Create Group";

        document.getElementById("createGroupButton").textContent =
            "👥 Create Group";

        selectedGroupImage = "images/user.png";

        document.getElementById("groupName").value = "";
        document.getElementById("groupDescription").value = "";
        document.getElementById("groupImage").src = selectedGroupImage;
    }

    loadGroupMembers(editingGroup);
}


// =========================
// LOAD MEMBERS
// =========================

function loadGroupMembers(groupToEdit) {
    const memberList = document.getElementById("memberList");

    if (!memberList) return;

    memberList.innerHTML = "";

    const currentUser = getCurrentUser();
    const users = loadData("users") || [];

    let existingMemberIds = [];

    if (groupToEdit && Array.isArray(groupToEdit.members)) {
        existingMemberIds = groupToEdit.members.map(String);
    }

    users.forEach(function (user) {
        if (!user.id) return;

        // The current user is automatically retained in the group.
        if (
            currentUser &&
            String(user.id) === String(currentUser.id)
        ) {
            return;
        }

        const div = document.createElement("div");
        div.className = "member-item";

        const img = document.createElement("img");
        img.src = user.profileImage || "images/user.png";
        img.alt = user.name || "User";

        const info = document.createElement("div");
        info.className = "member-info";

        const name = document.createElement("h4");
        name.textContent = user.name || "User";

        const email = document.createElement("small");
        email.textContent = user.email || "";

        info.appendChild(name);
        info.appendChild(email);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "group-member";
        checkbox.value = user.id;

        // Preselect existing members in edit mode.
        checkbox.checked = existingMemberIds.includes(
            String(user.id)
        );

        div.appendChild(img);
        div.appendChild(info);
        div.appendChild(checkbox);

        memberList.appendChild(div);
    });
}


// =========================
// PREVIEW GROUP IMAGE
// =========================

function previewGroupImage() {
    const input = document.getElementById("groupImageUpload");
    const image = document.getElementById("groupImage");

    if (!input || !image) return;

    const file = input.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showAlert("Please choose an image file.");
        input.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        selectedGroupImage = event.target.result;
        image.src = selectedGroupImage;
    };

    reader.readAsDataURL(file);
}


// =========================
// CREATE OR UPDATE GROUP
// =========================

async function createGroup() {
    const nameInput = document.getElementById("groupName");
    const descriptionInput =
        document.getElementById("groupDescription");

    const groupName = nameInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!groupName) {
        showAlert("Please enter group name.");
        return;
    }

    const currentUser = getCurrentUser();

    if (!currentUser) {
        showAlert("Please login first.");
        return;
    }

    const groups = loadData("groups") || [];

    const checkboxes = document.querySelectorAll(
        ".group-member:checked"
    );

    const memberIds = Array.from(checkboxes).map(function (box) {
        return String(box.value);
    });

    // Retain the current user, who is not shown in the checkbox list.
    if (!memberIds.includes(String(currentUser.id))) {
        memberIds.unshift(String(currentUser.id));
    }

    if (memberIds.length < 2) {
        showAlert("Select at least one other member.");
        return;
    }

    // =========================
    // EDIT EXISTING GROUP
    // =========================

    if (editingGroupId) {

        const index = groups.findIndex(function (group) {
            return String(group.id) === String(editingGroupId);
        });

        if (index === -1) {
            showAlert("Group not found. Please try again.");
            return;
        }

        const existingGroup = groups[index];

        if (
            existingGroup.creatorId &&
            String(existingGroup.creatorId) !== String(currentUser.id)
        ) {
            showAlert("Only the group creator can edit this group.");
            return;
        }

        const updatedGroup = {
            ...existingGroup,
            name: groupName,
            description: description,
            image: selectedGroupImage,
            members: memberIds
        };

        try {

            const response = await fetch(
                `/api/groups/${encodeURIComponent(existingGroup.id)}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(updatedGroup)
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {

                showAlert(
                    result.message ||
                    "Could not update group."
                );

                return;
            }

            groups[index] = result.group;

            saveData("groups", groups);

            sessionStorage.removeItem("editingGroupId");

            showAlert(
                "Group updated successfully!"
            );

            window.location.href = "dashboard.html";

        } catch (error) {

            console.error(
                "Update group error:",
                error
            );

            showAlert(
                "Unable to connect to FlyChat server."
            );

        }

        return;
    }

    // =========================
    // CREATE NEW GROUP
    // =========================

    const group = {
        id: "group_" + Date.now().toString(36) +
            Math.random().toString(36).substring(2, 7),

        name: groupName,
        description: description,
        image: "images/user.png",
        creatorId: currentUser.id,
        members: memberIds,
        createdAt: new Date().toISOString()
    };

    try{
        const response = await fetch("/api/groups", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(group)
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            showAlert(result.message || "Could not create group.");
            return;
        }
        groups.push(result.group);
        saveData("groups", groups);
        showAlert("Group created successfully!");
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Create group error:", error);
        showAlert("Unable to connect to FlyChat server.");
    }
}