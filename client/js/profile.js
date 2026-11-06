// =========================
// LOAD PROFILE
// =========================

function loadProfile() {

    const user = getCurrentUser();

    if (!user) {
        console.log("No current user found.");
        return;
    }

    const nameInput =
        document.getElementById("profileName");

    const emailInput =
        document.getElementById("profileEmail");

    const statusInput =
        document.getElementById("profileStatus");

    const profileImage =
        document.getElementById("profileImage");


    // =========================
    // LOAD NAME
    // =========================

    if (nameInput) {
        nameInput.value = user.name || "";
    }


    // =========================
    // LOAD EMAIL
    // =========================

    if (emailInput) {
        emailInput.value = user.email || "";
    }


    // =========================
    // LOAD STATUS
    // =========================

    if (statusInput) {
        statusInput.value =
            user.status ||
            "Hey there! I am using Flychat.";
    }


    // =========================
    // LOAD PROFILE PICTURE
    // =========================

    if (profileImage) {

        if (user.profileImage) {

            profileImage.src =
                user.profileImage;

        } else {

            // Keep the existing/default image
            console.log(
                "No profile picture found."
            );
        }
    }


    console.log(
        "Profile loaded:",
        user
    );
}


// =========================
// PREVIEW PROFILE IMAGE
// =========================

function previewImage() {

    const fileInput =
        document.getElementById("imageUpload");

    const image =
        document.getElementById("profileImage");


    if (!fileInput || !image) {
        return;
    }


    const file =
        fileInput.files[0];


    if (!file) {
        return;
    }


    // Only allow images

    if (!file.type.startsWith("image/")) {

        showAlert(
            "Please select an image file."
        );

        fileInput.value = "";

        return;
    }


    const reader =
        new FileReader();


    reader.onload = function (e) {

        const img =
            new Image();


        img.onload = function () {

            const canvas =
                document.createElement("canvas");


            const maxSize = 300;


            let width =
                img.width;

            let height =
                img.height;


            // =========================
            // RESIZE IMAGE
            // =========================

            if (width > height) {

                if (width > maxSize) {

                    height =
                        height * maxSize / width;

                    width =
                        maxSize;
                }

            } else {

                if (height > maxSize) {

                    width =
                        width * maxSize / height;

                    height =
                        maxSize;
                }
            }


            canvas.width =
                width;

            canvas.height =
                height;


            const ctx =
                canvas.getContext("2d");


            ctx.drawImage(
                img,
                0,
                0,
                width,
                height
            );


            // =========================
            // COMPRESS IMAGE
            // =========================

            const compressedImage =
                canvas.toDataURL(
                    "image/jpeg",
                    0.7
                );


            // Show preview

            image.src =
                compressedImage;


        };


        img.src =
            e.target.result;

    };


    reader.readAsDataURL(file);
}


// =========================
// SAVE PROFILE
// =========================

async function saveProfile() {

    const currentUser =
        getCurrentUser();


    if (!currentUser) {

        showAlert(
            "User not found."
        );

        return;
    }


    // =========================
    // GET ELEMENTS
    // =========================

    const nameInput =
        document.getElementById("profileName");

    const emailInput =
        document.getElementById("profileEmail");

    const statusInput =
        document.getElementById("profileStatus");

    const profileImage =
        document.getElementById("profileImage");

    const fileInput =
        document.getElementById("imageUpload");


    if (
        !nameInput ||
        !emailInput ||
        !statusInput ||
        !profileImage
    ) {

        console.error(
            "Profile elements not found."
        );

        return;
    }


    // =========================
    // GET VALUES
    // =========================

    const name =
        nameInput.value.trim();

    const email =
        emailInput.value.trim().toLowerCase();

    const status =
        statusInput.value.trim();


    // =========================
    // VALIDATION
    // =========================

    if (
        name === "" ||
        email === ""
    ) {

        showAlert(
            "Name and Email are required."
        );

        return;
    }


    // =========================
    // GET TOKEN
    // =========================

    const token =
        sessionStorage.getItem("token");


    if (!token) {

        showAlert(
            "Session expired. Please login again."
        );

        return;
    }


    try {

        // =================================================
        // STEP 1: UPLOAD PROFILE PICTURE IF SELECTED
        // =================================================

        if (
            fileInput &&
            fileInput.files &&
            fileInput.files.length > 0
        ) {

            const file =
                fileInput.files[0];


            // Check file type

            if (!file.type.startsWith("image/")) {

                showAlert(
                    "Please select an image file."
                );

                return;
            }


            const formData =
                new FormData();


            formData.append(
                "file",
                file
            );


            console.log(
                "Uploading profile picture..."
            );


            const uploadResponse =
                await fetch(
                    "/upload",
                    {
                        method: "POST",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        },

                        body: formData
                    }
                );


            const uploadResult =
                await uploadResponse.json();


            console.log(
                "Profile picture upload response:",
                uploadResult
            );


            if (
                !uploadResponse.ok ||
                !uploadResult.success
            ) {

                console.error(
                    "Profile picture upload failed:",
                    uploadResult
                );


                showAlert(
                    uploadResult.message ||
                    "Unable to upload profile picture."
                );


                return;
            }


            // =================================================
            // GET PROFILE PICTURE URL FROM SERVER
            // =================================================

            if (uploadResult.fileUrl) {
                currentUser.profileImage = uploadResult.fileUrl;
            } else {
                showAlert("Profile picture uploaded, but URL was not returned.");
                return;
            }

            profileImage.src = currentUser.profileImage;


            // Update image immediately

            profileImage.src =
                currentUser.profileImage;


            console.log(
                "Profile picture uploaded successfully:",
                currentUser.profileImage
            );
        }


        // =================================================
        // STEP 2: UPDATE PROFILE INFORMATION
        // =================================================

        const response =
            await fetch(
                "/api/users/update",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        id:
                            currentUser.id || "",

                        email:
                            currentUser.email || email,

                        name:
                            name,

                        profileImage:
                            currentUser.profileImage || ""

                    })
                }
            );


        const result =
            await response.json();


        console.log(
            "Profile update response:",
            result
        );


        if (
            !response.ok ||
            !result.success
        ) {

            console.error(
                "Server profile update failed:",
                result
            );


            showAlert(
                result.message ||
                "Could not update profile."
            );


            return;
        }


        // =================================================
        // STEP 3: UPDATE CURRENT USER
        // =================================================

        currentUser.id =
            result.user.id ||
            result.user._id;


        currentUser.name =
            result.user.name;


        currentUser.email =
            result.user.email ||
            email;


        currentUser.profileImage =
            result.user.profileImage ||
            currentUser.profileImage ||
            "";


        // Keep status locally
        // Note: your current User.js schema does not
        // contain a "status" field.

        currentUser.status =
            status;


        // =================================================
        // STEP 4: UPDATE PROFILE IMAGE ON PAGE
        // =================================================

        if (
            profileImage &&
            currentUser.profileImage
        ) {

            profileImage.src =
                currentUser.profileImage;
        }


        // =================================================
        // STEP 5: UPDATE LOCAL USERS
        // =================================================

        const users =
            loadData("users") || [];


        const index =
            users.findIndex(function (user) {

                return (
                    String(
                        user.id ||
                        user._id
                    ) ===
                    String(
                        currentUser.id
                    )
                );

            });


        if (index !== -1) {

            users[index] = {
                ...users[index],
                ...currentUser
            };

        } else {

            users.push(
                currentUser
            );
        }


        saveData(
            "users",
            users
        );


        // =================================================
        // STEP 6: UPDATE LOGGED-IN USER
        // =================================================

        setCurrentUser(
            currentUser
        );


        // =================================================
        // SUCCESS
        // =================================================

        showAlert(
            "Profile Updated Successfully"
        );


        console.log(
            "Profile saved:",
            currentUser
        );


        // Clear selected file

        if (fileInput) {
            fileInput.value = "";
        }


    } catch (error) {

        console.error(
            "Profile save error:",
            error
        );


        showAlert(
            "Unable to connect to FlyChat server."
        );
    }
}