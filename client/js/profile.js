

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

function saveProfile(){

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

    let name = nameInput.value.trim();
    let email = emailInput.value.trim();
    let status = statusInput.value.trim();

    if(name === "" || email === ""){
        showAlert("Name and Email are required.");
        return;
    }

    // Get current image
    let image = profileImage.src;

    // Update current user
    currentUser.name = name;
    currentUser.email = email;
    currentUser.status = status;

    if(image && image.startsWith("data:image")){
        currentUser.profileImage = image;
    }

    // Get all users
    let users = loadData("users") || [];

    // Find user by ID first
    let index = users.findIndex(function(user){
        return user.id === currentUser.id;
    });

    // If ID doesn't match, find by email
    if(index === -1){

        index = users.findIndex(function(user){
            return user.email === currentUser.email;
        });

    }

    // Update users array
    if(index !== -1){

        // Keep the original registered ID
        currentUser.id = users[index].id;

        users[index] = currentUser;

        saveData("users", users);

    }
    else{

        console.log("User not found in users array.");

        showAlert("Could not find your account.");
        return;
    }

    // Save synchronized current user
    setCurrentUser(currentUser);

    showAlert("Profile Updated Successfully");

    console.log("Profile saved:", currentUser);
    console.log("Users updated:", loadData("users"));
}