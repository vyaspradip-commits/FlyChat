// =========================
// PASSWORD VALIDATION
// =========================
const OTP_ENABLED = false;
function validatePassword(password){

    let pattern =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

    return pattern.test(password);
}


// =========================
// REGISTER USER
// =========================

async function registerUser(){

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
            ✔ 8 Characters
            ✔ 1 Uppercase
            ✔ 1 Lowercase
            ✔ 1 Number
            ✔ 1 Special Symbol`
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
                "/api/auth/request-otp",
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

        profileImage:
            "images/user.png",

        status:
            "Hey there! I am using FlyChat."

    };


    // Add user
    users.push(user);


    // Save users
    saveData(
        "users",
        users
    );


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

function loginUser() {

    const emailInput =
        document.getElementById("loginEmail");

    const passwordInput =
        document.getElementById("loginPassword");

    if (!emailInput || !passwordInput) {
        console.error("Login fields not found.");
        return;
    }

    const email =
        emailInput.value.trim().toLowerCase();

    const password =
        passwordInput.value;

    if (!email || !password) {
        showAlert("Please enter email and password.");
        return;
    }

    // Get users from localStorage
    const users =
        loadData("users") || [];

    console.log("Login email:", email);
    console.log("Users found:", users.length);

    // Find account
    const user =
        users.find(function (u) {

            return (
                u.email &&
                u.email.trim().toLowerCase() === email &&
                u.password === password
            );

        });

    if (!user) {

        console.log("LOGIN FAILED");

        showAlert("Invalid Email or Password.");

        return;
    }

    console.log("LOGIN USER FOUND:", user);

    // Clear old session first
    sessionStorage.removeItem("loggedIn");
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("currentEmail");
    sessionStorage.removeItem("currentUserId");

    // Create new session
    sessionStorage.setItem(
        "loggedIn",
        "true"
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
        "LOGIN SUCCESS"
    );

    console.log(
        "loggedIn:",
        sessionStorage.getItem("loggedIn")
    );

    console.log(
        "currentUser:",
        sessionStorage.getItem("currentUser")
    );

    // Open dashboard
    window.location.href ="dashboard.html";
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

        console.log("❌ LOGIN STATUS NOT FOUND");

        window.location.href = "login.html";
        return false;
    }

    if (!currentUserJSON) {

        console.log("❌ CURRENT USER NOT FOUND");

        window.location.href = "login.html";
        return false;
    }

    let currentUser;

    try {

        currentUser = JSON.parse(currentUserJSON);

    } catch (error) {

        console.error("❌ CURRENT USER JSON ERROR:", error);

        sessionStorage.removeItem("currentUser");

        window.location.href = "login.html";
        return false;
    }

    if (!currentUser.id || !currentUser.email) {

        console.log("❌ INVALID CURRENT USER:", currentUser);

        window.location.href = "login.html";
        return false;
    }

    console.log("✅ LOGIN VALID");
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
            "🙈";

    }
    else{

        input.type = "password";

        button.innerHTML =
            "👁";

    }

}