console.log("Register JS Loaded");

const registerForm =
    document.getElementById("registerForm");

const message =
    document.getElementById("message");


registerForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const name =
        document.getElementById("name").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;


    if (
        name === "" ||
        email === "" ||
        password === "" ||
        confirmPassword === ""
    ) {

        message.textContent =
            "Please fill in all fields.";

        return;
    }


    if (password.length < 6) {

        message.textContent =
            "Password must contain at least 6 characters.";

        return;
    }


    if (password !== confirmPassword) {

        message.textContent =
            "Passwords do not match.";

        return;
    }


    try {

        const response = await fetch("/api/auth/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name,
                email,
                password
            })

        });

        const data = await response.json();

        message.textContent = data.message;

        if (data.success) {

            registerForm.reset();

        }

    } catch (error) {

        message.textContent = "Server error!";
    }

});