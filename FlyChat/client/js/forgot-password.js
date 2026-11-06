const forgotForm =
    document.getElementById("forgotForm");

const message =
    document.getElementById("message");


forgotForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();


    if (email === "") {

        message.textContent =
            "Please enter your email address.";

        return;
    }


    message.textContent =
        "Password reset request submitted successfully!";

});