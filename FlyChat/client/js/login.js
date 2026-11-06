console.log("Login JS Loaded");
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    if (email === "" || password === "") {

        message.textContent =
            "Please fill in all fields.";

        return;
    }

    try{

        const response = await fetch("/api/auth/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })

        });

        console.log(response);

        const data = await response.json();

        message.textContent = data.message;

        if (data.success) {

            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("token", data.token);

            setTimeout(() => {
                window.location.href = "/";
            }, 1000);

        }

    } catch (error) {

        console.error(error);
        message.textContent = error.message;

    }

});