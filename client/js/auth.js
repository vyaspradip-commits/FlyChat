// =========================
// PASSWORD VALIDATION

// =========================
const OTP_ENABLED = false;
function validatePassword(password){

    let pattern =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

    return pattern.test(password);
}

async function registerUserOnServer(user) {
    try{
        const response = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                name: user.name,
                email: user.email,
                password: user.password
            })
        });
        const result = await response.json();

        if (!response.ok || !result.success) {

            console.error(
                "Server registration failed:",
                result.message
            );

            return {
                success: false,
                message:
                    result.message ||
                    "Could not register user on server."
            };
        }

        console.log(
            "User registered on server:",
            result.user
        );

        return {
            success: true,
            user: result.user
        };

    } catch (error) {

        console.error(
            "Server registration error:",
            error
        );

        return {
            success: false,
            message:
                "Unable to connect to FlyChat server."
        };
    }
}
// =========================
// REGISTER USER
// =========================

async function registerUser(){
    console.log("Register Button worked.");
    const name =
        document.getElementById("registerName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim().toLowerCase();

    const password =
        document.getElementById("registerPassword").value;


    // Check empty fields
    if (!name || !email || !password) {

        showAlert("Please fill all fields.");

        return;
    }


    // Validate password
    if (!validatePassword(password)) {

        showAlert(
            `Password must contain
            âœ” 8 Characters
            âœ” 1 Uppercase
            âœ” 1 Lowercase
            âœ” 1 Number
            âœ” 1 Special Symbol`
        );

        return;
    }


    // Load users
    const users =
        loadData("users") || [];


    // Check existing email
    const exists =
        users.find(function(user) {

            return user.email.toLowerCase() === email;

        });


    if (exists) {

        showAlert(
            "Email already registered."
        );

        return;
    }


    // =========================
    // OTP VERIFICATION
    // =========================

    if (OTP_ENABLED) {

        try {

            const response = await fetch(
                "http://localhost:5000/api/auth/request-otp",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email
                    })
                }
            );


            const result =
                await response.json();


            if (!response.ok || !result.success) {

                showAlert(
                    result.message ||
                    "Could not send OTP. Please try again."
                );

                return;
            }


            sessionStorage.setItem(
                "pendingRegistration",

                JSON.stringify({

                    name: name,

                    email: email,

                    password: password

                })
            );


            window.location.href =
                "verify-otp.html";


            return;

        } catch (error) {

            console.error(
                "OTP request error:",
                error
            );

            showAlert(
                "Unable to connect to FlyChat server. Please try again."
            );

            return;
        }
    }


    // =========================
    // CREATE USER
    // =========================

    const user = {
        id: generateID(),
        name: name,
        email: email,
        password: password,
        profileImage: "images/user.png",
        status: "Hey there! I am using FlyChat."
    };


    // =========================
    // SAVE USER ON SERVER
    // =========================

    try {

        const response = await fetch(
            "http://localhost:5000/api/users/register",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {

            showAlert(
                result.message ||
                "Could not create account."
            );

            return;
        }

        console.log(
            "User saved on server:",
            result.user
        );


        // =========================
        // SAVE USER LOCALLY
        // =========================

        users.push({
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            password: password,
            profileImage:
                result.user.profileImage ||
                "images/user.png",
            status:
                result.user.status ||
                "Hey there! I am using FlyChat."
        });

        saveData("users", users);


    } catch (error) {

        console.error(
            "Server registration error:",
            error
        );

        showAlert(
            "Unable to connect to FlyChat server."
        );

        return;
    }


    // Remove old pending registration
    sessionStorage.removeItem(
        "pendingRegistration"
    );


    showAlert(
        "Account Created Successfully"
    );


    // Open login page
    window.location.href =
        "login.html";
}


// =========================
// LOGIN USER
// =========================

async function loginUser() {
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    if (!emailInput || !passwordInput) {
        console.error("Login fields not found.");
        return;
    }
    const email = emailInput.value.trim().toLowerCase();
    const password =
        passwordInput.value;

    if (!email || !password) {

        showAlert(
            "Please enter email and password."
        );

        return;
    }

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

        const result =
            await response.json();

        console.log(
            "Server login response:",
            result
        );


        if (
            !response.ok ||
            !result.success
        ) {

            showAlert(
                result.message ||
                "Invalid Email or Password."
            );

            return;
        }


        const user =
            result.user;


        // =========================
        // CLEAR OLD SESSION
        // =========================

        sessionStorage.removeItem(
            "loggedIn"
        );

        sessionStorage.removeItem(
            "currentUser"
        );

        sessionStorage.removeItem(
            "currentEmail"
        );

        sessionStorage.removeItem(
            "currentUserId"
        );


        // =========================
        // CREATE NEW SESSION
        // =========================

        sessionStorage.setItem(
            "loggedIn",
            "true"
        );

        sessionStorage.setItem(
            "token",
            result.token
        );

        sessionStorage.setItem(
            "currentEmail",
            user.email
        );

        sessionStorage.setItem(
            "currentUserId",
            user.id
        );

        sessionStorage.setItem(
            "currentUser",
            JSON.stringify(user)
        );


        console.log(
            "LOGIN SUCCESS:",
            user
        );


        // =========================
        // OPEN DASHBOARD
        // =========================

        window.location.href =
            "dashboard.html";


    } catch (error) {

        console.error(
            "Login server error:",
            error
        );

        showAlert(
            "Unable to connect to FlyChat server."
        );

    }

}

// =========================
// LOGOUT
// =========================

function logout() {

    if (!showConfirm("Logout from FlyChat?")) {
        return;
    }

    sessionStorage.removeItem(
        "loggedIn"
    );

    sessionStorage.removeItem(
        "currentUser"
    );

    sessionStorage.removeItem(
        "currentEmail"
    );

    sessionStorage.removeItem(
        "currentUserId"
    );
    sessionStorage.removeItem(
        "token"
    );
    window.location.href =
        "login.html";
}


// =========================
// CHECK LOGIN
// =========================

function checkLogin() {

    const loggedIn = sessionStorage.getItem("loggedIn");
    const currentUserJSON = sessionStorage.getItem("currentUser");

    console.log("========== CHECK LOGIN ==========");
    console.log("loggedIn:", loggedIn);
    console.log("currentUserJSON:", currentUserJSON);

    if (loggedIn !== "true") {

        console.log("âŒ LOGIN STATUS NOT FOUND");

        window.location.href = "login.html";
        return false;
    }

    if (!currentUserJSON) {

        console.log("âŒ CURRENT USER NOT FOUND");

        window.location.href = "login.html";
        return false;
    }

    let currentUser;

    try {

        currentUser = JSON.parse(currentUserJSON);

    } catch (error) {

        console.error("âŒ CURRENT USER JSON ERROR:", error);

        sessionStorage.removeItem("currentUser");

        window.location.href = "login.html";
        return false;
    }

    if (!currentUser.id || !currentUser.email) {

        console.log("âŒ INVALID CURRENT USER:", currentUser);

        window.location.href = "login.html";
        return false;
    }

    console.log("âœ… LOGIN VALID");
    console.log("User:", currentUser.name);
    console.log("Email:", currentUser.email);
    console.log("ID:", currentUser.id);

    return true;
}


// =========================
// SHOW / HIDE PASSWORD
// =========================

function togglePassword(
    inputId,
    button
){

    let input =
        document.getElementById(
            inputId
        );


    if(!input) return;


    if(
        input.type === "password"
    ){

        input.type = "text";

        button.innerHTML =
            "ðŸ™ˆ";

    }
    else{

        input.type = "password";

        button.innerHTML =
            "ðŸ‘";

    }

}
