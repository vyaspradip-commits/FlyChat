function loadProfile() {
    let user = getCurrentUser();
    if(!user){
        console.log("No current user found.");
        return;
    }
    const nameInput = document.getElementById("profileName");
    const emailInput = document.getElementById("profileEmail");
    const statusInput = document.getElementById("profileStatus");
    const profileImage = document.getElementById("profileImage");
    if(nameInput){
        nameInput.value = user.name || "";
    }
    if(emailInput){
        emailInput.value = user.email || "";
    }
    if(statusInput){
        statusInput.value = user.status || "Hey there! I am using Flychat.";
    }
    if (profileImage && user.profileImage) {
        profileImage.src = user.profileImage;
    }
    console.log("Profile loaded:", user);
}

function previewImage(){

    const fileInput =
        document.getElementById("imageUpload");

    const image =
        document.getElementById("profileImage");

    if(!fileInput || !image){
        return;
    }

    const file = fileInput.files[0];

    if(!file){
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e){

        const img = new Image();

        img.onload = function(){

            const canvas =
                document.createElement("canvas");

            const maxSize = 300;

            let width = img.width;
            let height = img.height;

            if(width > height){

                if(width > maxSize){

                    height =
                        height * maxSize / width;

                    width = maxSize;

                }

            }
            else{

                if(height > maxSize){

                    width =
                        width * maxSize / height;

                    height = maxSize;

                }

            }

            canvas.width = width;
            canvas.height = height;

            const ctx =
                canvas.getContext("2d");

            ctx.drawImage(
                img,
                0,
                0,
                width,
                height
            );

            // Compress image
            const compressedImage =
                canvas.toDataURL(
                    "image/jpeg",
                    0.7
                );

            image.src = compressedImage;

        };

        img.src = e.target.result;

    };

    reader.readAsDataURL(file);
}

async function saveProfile(){

    let currentUser = getCurrentUser();

    if(!currentUser){
        showAlert("User not found.");
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

    const fileInput =
        document.getElementById("imageUpload");


    if(!nameInput || !emailInput || !statusInput || !profileImage){
        return;
    }


    let name =
        nameInput.value.trim();

    let email =
        emailInput.value.trim().toLowerCase();

    let status =
        statusInput.value.trim();


    if(name === "" || email === ""){
        showAlert("Name and Email are required.");
        return;
    }


    // =========================
    // SAVE BASIC PROFILE DATA
    // =========================

    currentUser.name =
        name;

    currentUser.email =
        email;

    currentUser.status =
        status;


    // =========================
    // UPLOAD PROFILE IMAGE
    // =========================

    if(
        fileInput &&
        fileInput.files &&
        fileInput.files.length > 0
    ){

        const file =
            fileInput.files[0];


        try{

            const formData =
                new FormData();

            formData.append(
                "file",
                file
            );


            const response =
                await fetch(
                    "/api/chat/upload",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const result =
                await response.json();


            if(
                !response.ok ||
                !result.success
            ){

                console.error(
                    "Profile image upload failed:",
                    result
                );

                showAlert(
                    result.message ||
                    "Unable to upload profile picture."
                );

                return;
            }


            // Save server URL
            currentUser.profileImage =
                result.file.url;


            console.log(
                "Profile image uploaded:",
                result.file.url
            );


        }
        catch(error){

            console.error(
                "Profile image upload error:",
                error
            );

            showAlert(
                "Unable to upload profile picture."
            );

            return;
        }

    }
    else{

        // Keep existing profile image
        currentUser.profileImage =
            currentUser.profileImage ||
            "images/user.png";

    }


    // =========================
    // UPDATE LOCAL USERS
    // =========================

    let users =
        loadData("users") || [];


    let index =
        users.findIndex(function(user){

            return String(user.id) ===
                   String(currentUser.id);

        });


    // Fallback: find by old email
    if(index === -1){

        index =
            users.findIndex(function(user){

                return (
                    user.email &&
                    user.email.toLowerCase() ===
                    email
                );

            });

    }


    if(index === -1){

        console.log(
            "User not found in local users array."
        );

        showAlert(
            "Could not find your account."
        );

        return;
    }


    // Keep original ID
    currentUser.id =
        users[index].id;


    users[index] = {
        ...users[index],
        ...currentUser
    };


    saveData(
        "users",
        users
    );


    // =========================
    // SAVE CURRENT USER
    // =========================

    setCurrentUser(
        currentUser
    );


    console.log(
        "Local profile saved:",
        currentUser
    );


    // =========================
    // UPDATE SERVER PROFILE
    // =========================

    try{

        const response =
            await fetch(
                "/api/users/update",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        id:
                            currentUser.id,

                        name:
                            currentUser.name,

                        email:
                            currentUser.email,

                        status:
                            currentUser.status,

                        profileImage:
                            currentUser.profileImage

                    })
                }
            );


        const result =
            await response.json();


        if(
            !response.ok ||
            !result.success
        ){

            console.error(
                "Server profile update failed:",
                result
            );

            showAlert(
                result.message ||
                "Profile saved locally, but server update failed."
            );

            return;
        }


        console.log(
            "Server profile updated:",
            result
        );


        showAlert(
            "Profile Updated Successfully"
        );


    }
    catch(error){

        console.error(
            "Server profile update error:",
            error
        );

        showAlert(
            "Profile saved locally, but server could not be updated."
        );

    }

}