async function verifyOtp() {

    const otp =
        document.getElementById("otpCode").value.trim();

    const message =
        document.getElementById("otpMessage");

    const pendingData =
        sessionStorage.getItem("pendingRegistration");


    // =========================
    // CHECK REGISTRATION DATA
    // =========================

    if (!pendingData) {

        message.textContent =
            "Registration details not found. Please register again.";

        return;
    }


    // =========================
    // CHECK OTP
    // =========================

    if (!/^\d{6}$/.test(otp)) {

        message.textContent =
            "Please enter a valid 6-digit OTP.";

        return;
    }


    // =========================
    // READ REGISTRATION DATA
    // =========================

    let registration;

    try {

        registration =
            JSON.parse(pendingData);

    } catch (error) {

        console.error(
            "Registration data error:",
            error
        );

        message.textContent =
            "Registration details are invalid. Please register again.";

        return;
    }


    // =========================
    // VERIFY OTP
    // =========================

    try {

        const response =
            await fetch(
                "/api/auth/verify-otp",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        email:
                            registration.email,

                        otp:
                            otp

                    })
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            message.textContent =
                result.message ||
                "OTP verification failed.";

            return;
        }


        // =========================
        // CREATE USER ON SERVER
        // =========================

        const serverResponse =
            await fetch(
                "/api/users/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        name:
                            registration.name,

                        email:
                            registration.email,

                        password:
                            registration.password

                    })
                }
            );


        const serverResult =
            await serverResponse.json();


        if (
            !serverResponse.ok ||
            !serverResult.success
        ) {

            message.textContent =
                serverResult.message ||
                "Could not create your account.";

            return;
        }


        console.log(
            "User created on server:",
            serverResult.user
        );


        // =========================
        // SAVE USER LOCALLY
        // =========================

        const users =
            loadData("users") || [];


        const serverUser =
            serverResult.user;


        const localUser = {

            id:
                serverUser.id,

            name:
                serverUser.name,

            email:
                serverUser.email,

            password:
                registration.password,

            profileImage:
                serverUser.profileImage ||
                "images/user.png",

            status:
                serverUser.status ||
                "Hey there! I am using FlyChat."

        };


        // Remove old local copy
        const filteredUsers =
            users.filter(function(user) {

                return (
                    user.email &&
                    user.email.toLowerCase() !==
                    registration.email.toLowerCase()
                );

            });


        filteredUsers.push(localUser);


        saveData(
            "users",
            filteredUsers
        );


        // =========================
        // CLEANUP
        // =========================

        sessionStorage.removeItem(
            "pendingRegistration"
        );


        // =========================
        // SUCCESS
        // =========================

        message.textContent =
            "Email verified! Opening login page...";


        window.location.replace(
            "/login.html"
        );


    } catch (error) {

        console.error(
            "OTP verification error:",
            error
        );

        message.textContent =
            "Unable to connect to FlyChat server. Please try again.";

    }
}

async function resendOtp() { 
    const message = document .getElementById("otpMessage");
    const pendingData = sessionStorage.getItem( "pendingRegistration" );
    if (!pendingData) {
        message.textContent = "Registration details not found. Please register again.";
        return; 
    }
    const registration = JSON.parse(pendingData);
    try { 
        const response = await fetch( "/api/auth/request-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }, 
            body: JSON.stringify({
                email: registration.email
            })
        }
    );
    const result = await response.json();
    message.textContent = result.message || (result.success ? "A new OTP has been sent." : "Unable to resend OTP.");
    } catch (error) {
        console.error("Resend OTP error:", error);
        message.textContent = "Unable to connect to the server.";
    }
}