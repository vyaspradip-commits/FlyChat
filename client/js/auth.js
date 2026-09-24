// =========================
// PASSWORD VALIDATION
// =========================

function validatePassword(password){

    let pattern =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;

    return pattern.test(password);
}


// =========================
// REGISTER USER
// =========================

function registerUser(){

    let name =
        document.getElementById("registerName").value.trim();

    let email =
        document.getElementById("registerEmail").value.trim();

    let password =
        document.getElementById("registerPassword").value;


    // Check empty fields
    if(
        name === "" ||
        email === "" ||
        password === ""
    ){

        showAlert("Please fill all fields.");

        return;
    }


    // Validate password
    if(!validatePassword(password)){

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
    let users =
        loadData("users") || [];


    // Check existing email
    let exists =
        users.find(function(user){

            return user.email === email;

        });


    if(exists){

        showAlert(
            "Email already registered."
        );

        return;
    }


    // Create user
    let user = {

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


    showAlert(
        "Account Created Successfully"
    );


    window.location.href =
        "login.html";
}


// =========================
// LOGIN USER
// =========================

function loginUser(){

    let email =
        document.getElementById("loginEmail").value.trim();

    let password =
        document.getElementById("loginPassword").value;


    // Load users
    let users =
        loadData("users") || [];


    // Find user
    let user =
        users.find(function(u){

            return (
                u.email === email &&
                u.password === password
            );

        });


    if(!user){

        showAlert(
            "Invalid Email or Password."
        );

        return;
    }


    // Login status
    localStorage.setItem(
        "loggedIn",
        "true"
    );


    // IMPORTANT:
    // Store complete user object
    setCurrentUser(user);


    // Optional compatibility values
    localStorage.setItem(
        "currentEmail",
        user.email
    );

    localStorage.setItem(
        "currentUserId",
        user.id
    );


    console.log(
        "Logged in user:",
        user
    );


    window.location.href =
        "dashboard.html";
}


// =========================
// LOGOUT
// =========================

function logout(){

    if(
        !showConfirm(
            "Logout from FlyChat?"
        )
    ){

        return;
    }


    localStorage.removeItem(
        "loggedIn"
    );

    removeData(
        "currentUser"
    );

    localStorage.removeItem(
        "currentEmail"
    );

    localStorage.removeItem(
        "currentUserId"
    );


    window.location.href =
        "login.html";
}


// =========================
// CHECK LOGIN
// =========================

function checkLogin(){

    if(!isLoggedIn()){

        window.location.href =
            "login.html";

    }

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