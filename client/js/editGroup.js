let editingGroup = null;
let selectedEditGroupImage = "images/user.png";


// =====================================================
// INITIALIZE EDIT GROUP
// =====================================================

async function initializeEditGroup() {

    const currentUser = getCurrentUser();

    if (!currentUser) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    const editingGroupId =
        sessionStorage.getItem("editingGroupId");

    if (!editingGroupId) {
        alert("No group selected for editing.");
        window.location.href = "dashboard.html";
        return;
    }


    // =================================================
    // LOAD LOCAL GROUPS
    // =================================================

    let groups = loadData("groups") || [];


    // =================================================
    // TRY TO LOAD FRESH GROUP DATA FROM SERVER
    // =================================================

    try {

        const response = await fetch(
            "/api/groups?userId=" +
            encodeURIComponent(currentUser.id)
        );

        if (response.ok) {

            const result = await response.json();

            if (
                result &&
                result.success &&
                Array.isArray(result.groups)
            ) {

                // Replace local cache with latest server data
                groups = result.groups;

                saveData(
                    "groups",
                    groups
                );

                console.log(
                    "Edit Group: fresh groups loaded from server:",
                    groups
                );
            }
        }

    } catch (error) {

        console.warn(
            "Could not load fresh groups. Using local groups.",
            error
        );
    }


    // =================================================
    // FIND SELECTED GROUP
    // =================================================

    editingGroup =
        groups.find(function (group) {

            return String(group.id) ===
                String(editingGroupId);

        });


    if (!editingGroup) {

        alert(
            "Selected group was not found."
        );

        sessionStorage.removeItem(
            "editingGroupId"
        );

        window.location.href =
            "dashboard.html";

        return;
    }


    // =================================================
    // CHECK GROUP CREATOR
    // =================================================

    if (
        editingGroup.creatorId &&
        String(editingGroup.creatorId) !==
        String(currentUser.id)
    ) {

        alert(
            "Only the group creator can edit this group."
        );

        sessionStorage.removeItem(
            "editingGroupId"
        );

        window.location.href =
            "dashboard.html";

        return;
    }


    // =================================================
    // LOAD GROUP DATA INTO FORM
    // =================================================

    const nameInput =
        document.getElementById(
            "editGroupName"
        );

    const descriptionInput =
        document.getElementById(
            "editGroupDescription"
        );

    const image =
        document.getElementById(
            "editGroupImage"
        );


    if (nameInput) {

        nameInput.value =
            editingGroup.name || "";

    }


    if (descriptionInput) {

        descriptionInput.value =
            editingGroup.description || "";

    }


    selectedEditGroupImage =
        editingGroup.image ||
        "images/user.png";


    if (image) {

        image.src =
            selectedEditGroupImage;

    }


    // Load members
    await loadEditGroupMembers();

}


// =====================================================
// LOAD GROUP MEMBERS
// =====================================================

async function loadEditGroupMembers() {

    const memberList =
        document.getElementById(
            "editMemberList"
        );

    if (!memberList) {
        return;
    }


    memberList.innerHTML = "";


    const currentUser =
        getCurrentUser();


    if (!currentUser) {
        return;
    }


    // =================================================
    // LOAD USERS FROM SERVER
    // =================================================

    let users = [];

    try {

        const response =
            await fetch("/api/users");

        if (response.ok) {

            const result =
                await response.json();

            // Handle different possible API formats
            if (Array.isArray(result)) {

                users = result;

            } else if (
                result &&
                Array.isArray(result.users)
            ) {

                users = result.users;

            }

        }

    } catch (error) {

        console.warn(
            "Could not load users from server. Using local users.",
            error
        );

    }


    // =================================================
    // FALLBACK TO LOCAL USERS
    // =================================================

    if (!users.length) {

        users =
            loadData("users") || [];

    }


    // =================================================
    // EXISTING MEMBERS
    // =================================================

    const existingMembers =
        Array.isArray(editingGroup.members)
            ? editingGroup.members.map(String)
            : [];


    // =================================================
    // CREATE USER LIST
    // =================================================

    users.forEach(function (user) {

        if (!user || !user.id) {
            return;
        }


        // Don't show current user/creator
        // because creator is automatically retained.
        if (
            String(user.id) ===
            String(currentUser.id)
        ) {

            return;

        }


        // =============================================
        // MAIN MEMBER ITEM
        // =============================================

        const div =
            document.createElement("div");

        div.className =
            "member-item";


        // =============================================
        // PROFILE IMAGE
        // =============================================

        const img =
            document.createElement("img");

        img.className =
            "avatar";

        img.src =
            user.profileImage ||
            "images/user.png";

        img.alt =
            user.name ||
            "User";


        // =============================================
        // USER INFORMATION
        // =============================================

        const info =
            document.createElement("div");

        info.className =
            "member-info";


        const name =
            document.createElement("h4");

        name.textContent =
            user.name ||
            "User";


        const email =
            document.createElement("small");

        email.textContent =
            user.email ||
            "";


        info.appendChild(name);
        info.appendChild(email);


        // =============================================
        // CHECKBOX
        // =============================================

        const checkbox =
            document.createElement("input");

        checkbox.type =
            "checkbox";

        checkbox.className =
            "edit-group-member";

        checkbox.value =
            String(user.id);


        checkbox.checked =
            existingMembers.includes(
                String(user.id)
            );


        // =============================================
        // CLICK WHOLE USER ROW
        // =============================================

        div.addEventListener(
            "click",
            function (event) {

                // Don't toggle twice when checkbox itself
                // is clicked.
                if (
                    event.target !== checkbox
                ) {

                    checkbox.checked =
                        !checkbox.checked;

                }

            }
        );


        // =============================================
        // APPEND
        // =============================================

        div.appendChild(img);
        div.appendChild(info);
        div.appendChild(checkbox);

        memberList.appendChild(div);

    });


    console.log(
        "Edit group members loaded:",
        users.length
    );

}


// =====================================================
// PREVIEW GROUP IMAGE
// =====================================================

function previewEditGroupImage() {

    const input =
        document.getElementById(
            "editGroupImageUpload"
        );

    const image =
        document.getElementById(
            "editGroupImage"
        );


    if (!input || !image) {
        return;
    }


    const file =
        input.files[0];


    if (!file) {
        return;
    }


    // =================================================
    // CHECK IMAGE TYPE
    // =================================================

    if (
        !file.type ||
        !file.type.startsWith("image/")
    ) {

        alert(
            "Please choose an image file."
        );

        input.value = "";

        return;
    }


    // =================================================
    // PREVIEW IMAGE
    // =================================================

    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            selectedEditGroupImage =
                event.target.result;

            image.src =
                selectedEditGroupImage;

        };


    reader.onerror =
        function () {

            alert(
                "Could not read the selected image."
            );

        };


    reader.readAsDataURL(file);

}


// =====================================================
// SAVE EDITED GROUP
// =====================================================

async function saveEditedGroup() {

    if (!editingGroup) {

        alert(
            "No group selected."
        );

        return;
    }


    // =================================================
    // CURRENT USER
    // =================================================

    const currentUser =
        getCurrentUser();


    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;
    }


    // =================================================
    // GET FORM DATA
    // =================================================

    const nameInput =
        document.getElementById(
            "editGroupName"
        );

    const descriptionInput =
        document.getElementById(
            "editGroupDescription"
        );


    if (!nameInput || !descriptionInput) {

        alert(
            "Group form fields were not found."
        );

        return;
    }


    const groupName =
        nameInput.value.trim();

    const description =
        descriptionInput.value.trim();


    // =================================================
    // VALIDATE GROUP NAME
    // =================================================

    if (!groupName) {

        alert(
            "Please enter group name."
        );

        return;
    }


    // =================================================
    // CHECK CREATOR
    // =================================================

    if (
        editingGroup.creatorId &&
        String(editingGroup.creatorId) !==
        String(currentUser.id)
    ) {

        alert(
            "Only the group creator can edit this group."
        );

        return;
    }


    // =================================================
    // GET SELECTED MEMBERS
    // =================================================

    const checkboxes =
        document.querySelectorAll(
            ".edit-group-member:checked"
        );


    const memberIds =
        Array.from(
            checkboxes
        ).map(function (box) {

            return String(box.value);

        });


    // =================================================
    // ALWAYS RETAIN CREATOR
    // =================================================

    if (
        !memberIds.includes(
            String(currentUser.id)
        )
    ) {

        memberIds.unshift(
            String(currentUser.id)
        );

    }


    // =================================================
    // MINIMUM TWO MEMBERS
    // =================================================

    if (memberIds.length < 2) {

        alert(
            "A group must contain at least one other member."
        );

        return;
    }


    // =================================================
    // LOAD LOCAL GROUPS
    // =================================================

    const groups =
        loadData("groups") || [];


    const index =
        groups.findIndex(
            function (group) {

                return String(group.id) ===
                    String(editingGroup.id);

            }
        );


    // =================================================
    // GROUP MUST EXIST
    // =================================================

    if (index === -1) {

        alert(
            "Group not found in local data."
        );

        return;
    }


    // =================================================
    // EXISTING GROUP
    // =================================================

    const existingGroup =
        groups[index];


    // =================================================
    // FINAL CREATOR CHECK
    // =================================================

    if (
        existingGroup.creatorId &&
        String(existingGroup.creatorId) !==
        String(currentUser.id)
    ) {

        alert(
            "Only the group creator can edit this group."
        );

        return;
    }


    // =================================================
    // CREATE UPDATED GROUP
    // =================================================

    const updatedGroup = {

        ...existingGroup,

        name:
            groupName,

        description:
            description,

        image:
            selectedEditGroupImage,

        members:
            memberIds,

        // IMPORTANT:
        // Editing the group counts as activity.
        // This value is used for chat-list ordering.
        lastActivity:
            new Date().toISOString()

    };


    console.log(
        "Updating group:",
        updatedGroup
    );


    // =================================================
    // UPDATE GROUP ON SERVER
    // =================================================

    try {

        const response =
            await fetch(
                "/api/groups/" +
                encodeURIComponent(
                    existingGroup.id
                ),
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            updatedGroup
                        )
                }
            );


        const result =
            await response.json();


        // =================================================
        // CHECK SERVER RESPONSE
        // =================================================

        if (
            !response.ok ||
            !result.success
        ) {

            alert(
                result.message ||
                "Could not update group."
            );

            return;
        }


        // =================================================
        // UPDATE LOCAL CACHE
        // =================================================

        // The edited group must become the FIRST group.
        //
        // Remove the old copy first so we don't create
        // a duplicate group.

        const serverUpdatedGroup =
            result.group;


        const oldIndex =
            groups.findIndex(
                function (group) {

                    return String(group.id) ===
                        String(serverUpdatedGroup.id);

                }
            );


        if (oldIndex !== -1) {

            groups.splice(
                oldIndex,
                1
            );

        }


        // Put ONLY the edited group at the top.
        groups.unshift(
            serverUpdatedGroup
        );


        saveData(
            "groups",
            groups
        );


        // Also update editingGroup
        editingGroup =
            serverUpdatedGroup;


        // =================================================
        // REMOVE EDIT STATE
        // =================================================

        sessionStorage.removeItem(
            "editingGroupId"
        );


        // =================================================
        // SUCCESS
        // =================================================

        console.log(
            "Group updated successfully:",
            serverUpdatedGroup
        );


        alert(
            "Group updated successfully!"
        );


        // =================================================
        // RETURN TO DASHBOARD
        // =================================================

        window.location.href =
            "dashboard.html";


    } catch (error) {

        console.error(
            "Update group error:",
            error
        );

        alert(
            "Unable to connect to FlyChat server."
        );

    }

}


// =====================================================
// CANCEL EDIT
// =====================================================

function cancelEditGroup() {

    sessionStorage.removeItem(
        "editingGroupId"
    );


    window.location.href =
        "dashboard.html";

}


// =====================================================
// PAGE LOAD
// =====================================================

window.addEventListener(
    "load",
    function () {

        initializeEditGroup();


        // =============================================
        // IMAGE UPLOAD
        // =============================================

        const imageInput =
            document.getElementById(
                "editGroupImageUpload"
            );


        if (imageInput) {

            imageInput.addEventListener(
                "change",
                previewEditGroupImage
            );

        }

    }
);