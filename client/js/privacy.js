async function loadPrivacyPage() {

    const currentUser = getCurrentUser();

    if (!currentUser) {
        return;
    }

    loadPrivacyUsers();

    try {

        const response = await fetch(
            `/api/privacy/${encodeURIComponent(currentUser.id)}`
        );

        const result = await response.json();

        let privacy = {
            visibility: "everyone",
            selectedUsers: []
        };

        if (
            response.ok &&
            result.success &&
            result.privacy
        ) {
            privacy = result.privacy;
        }

        // Select saved visibility option
        const radio = document.querySelector(
            `input[name="profileVisibility"][value="${privacy.visibility}"]`
        );

        if (radio) {
            radio.checked = true;
        }

        // Select saved accounts
        const checkboxes = document.querySelectorAll(
            ".privacy-user"
        );

        checkboxes.forEach(function (checkbox) {

            checkbox.checked =
                privacy.selectedUsers.includes(
                    checkbox.value
                );

        });

        updateSelectedUsersBox();

    }
    catch (error) {

        console.error(
            "Load privacy settings error:",
            error
        );

        const defaultRadio =
            document.querySelector(
                'input[name="profileVisibility"][value="everyone"]'
            );

        if (defaultRadio) {
            defaultRadio.checked = true;
        }

        updateSelectedUsersBox();
    }
}


// =========================
// LOAD USERS
// =========================

async function loadPrivacyUsers() {

    const currentUser = getCurrentUser();

    if (!currentUser) {
        return;
    }

    const userList =
        document.getElementById(
            "privacyUserList"
        );

    if (!userList) {
        return;
    }

    try {

        const response =
            await fetch("/api/users?privacyCandidates=true")

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success ||
            !Array.isArray(result.users)
        ) {

            console.error(
                "Unable to load privacy users."
            );

            return;
        }

        userList.innerHTML = "";

        result.users.forEach(function (user) {

            if (
                String(user.id) ===
                String(currentUser.id)
            ) {
                return;
            }

            const div =
                document.createElement("div");

            div.className =
                "privacy-user-item";

            div.innerHTML = `
                <img
                    src="${user.profileImage || "images/user.png"}"
                    class="privacy-avatar"
                    alt="User"
                >
                <div class="privacy-user-info">
                    <b>${user.name || "Unknown"}</b>
                    <small>${user.email || ""}</small>
                </div>
                <input type="checkbox" class="privacy-user" value="${user.id}">
            `;

            userList.appendChild(div);

        });

        console.log(
            "Privacy users loaded:",
            document.querySelectorAll(
                ".privacy-user"
            ).length
        );

    }
    catch (error) {

        console.error(
            "Load privacy users error:",
            error
        );

    }
}


// =========================
// SAVE PRIVACY
// =========================

async function savePrivacy() {

    const currentUser =
        getCurrentUser();

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;
    }

    const selectedOption =
        document.querySelector(
            'input[name="profileVisibility"]:checked'
        );

    if (!selectedOption) {

        alert(
            "Please select a privacy option."
        );

        return;
    }

    const selectedUsers = [];

    const checkboxes =
        document.querySelectorAll(
            ".privacy-user:checked"
        );

    checkboxes.forEach(function (checkbox) {

        selectedUsers.push(
            checkbox.value
        );

    });

    if (
        selectedOption.value === "selected" &&
        selectedUsers.length === 0
    ) {

        alert(
            "Please select at least one account."
        );

        return;
    }

    const privacy = {

        visibility:
            selectedOption.value,

        selectedUsers:
            selectedUsers

    };

    try {

        const response =
            await fetch(
                `/api/privacy/${encodeURIComponent(currentUser.id)}`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(privacy)
                }
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {

            alert(
                result.message ||
                "Unable to save privacy settings."
            );

            return;
        }

        // =========================
        // SAVE PRIVACY LOCALLY
        // =========================

        saveData(
            "privacy_" + currentUser.id,
            privacy
        );

        console.log(
            "Privacy settings saved locally:",
            privacy
        );

        alert(
            "Privacy settings saved."
        );
    }
    catch (error) {

        console.error(
            "Save privacy settings error:",
            error
        );

        alert(
            "Unable to connect to FlyChat server."
        );
    }
}


// =========================
// SHOW / HIDE ACCOUNT LIST
// =========================

function updateSelectedUsersBox() {

    const selected =
        document.querySelector(
            'input[name="profileVisibility"]:checked'
        );

    const box =
        document.getElementById(
            "selectedUsersBox"
        );

    if (!box) {
        return;
    }

    if (
        selected &&
        selected.value === "selected"
    ) {

        box.style.display = "block";

    }
    else {

        box.style.display = "none";

    }
}


// =========================
// RADIO BUTTON EVENTS
// =========================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadPrivacyPage();

        const radios =
            document.querySelectorAll(
                'input[name="profileVisibility"]'
            );

        radios.forEach(function (radio) {

            radio.addEventListener(
                "change",
                updateSelectedUsersBox
            );

        });

    }
);

// =========================
// PRIVACY USER SEARCH
// =========================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const searchInput =
            document.getElementById(
                "privacyUserSearch"
            );

        if (!searchInput) {
            return;
        }

        searchInput.addEventListener(
            "input",
            function () {

                const searchText =
                    searchInput.value
                        .toLowerCase()
                        .trim();

                const users =
                    document.querySelectorAll(
                        ".privacy-user-item"
                    );

                users.forEach(function (item) {

                    const name =
                        item.querySelector(
                            ".privacy-user-info b"
                        )?.textContent
                        .toLowerCase() || "";

                    const email =
                        item.querySelector(
                            ".privacy-user-info small"
                        )?.textContent
                        .toLowerCase() || "";

                    if (
                        name.includes(searchText) ||
                        email.includes(searchText)
                    ) {

                        item.style.display = "flex";

                    } else {

                        item.style.display = "none";

                    }

                });

            }
        );

    }
);