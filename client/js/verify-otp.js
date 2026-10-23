
async function verifyOtp() {
    const otp = document.getElementById("otpCode").value.trim();
    const message = document.getElementById("otpMessage");
    const pendingData = sessionStorage.getItem("pendingRegistration");

    if (!pendingData) {
        message.textContent =
            "Registration details not found. Please register again.";
        return;
    }

    if (!/^\d{6}$/.test(otp)) {
        message.textContent = "Please enter a valid 6-digit OTP.";
        return;
    }

    let registration;

    try {
        registration = JSON.parse(pendingData);
    } catch (error) {
        message.textContent =
            "Registration details are invalid. Please register again.";
        return;
    }

    try {
        const response = await fetch("/api/auth/verify-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: registration.email,
                otp: otp
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            message.textContent =
                result.message || "OTP verification failed.";
            return;
        }

        const users = loadData("users") || [];

        const exists = users.find(function (user) {
            return user.email.toLowerCase() ===
                registration.email.toLowerCase();
        });

        if (exists) {
            message.textContent =
                "This email is already registered. Please log in.";
            sessionStorage.removeItem("pendingRegistration");
            return;
        }

        const user = {
            id: generateID(),
            name: registration.name,
            email: registration.email,
            password: registration.password,
            profileImage: "images/user.png",
            status: "Hey there! I am using FlyChat."
        };

        users.push(user);
        saveData("users", users);

        sessionStorage.removeItem("pendingRegistration");

        message.textContent =
            "Email verified! Opening login page...";

        window.location.replace("/login.html");

    } catch (error) {
        console.error("OTP verification error:", error);
        message.textContent =
            "Unable to connect to the server. Please try again.";
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