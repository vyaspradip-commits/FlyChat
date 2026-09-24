const currentPage = window.location.pathname.split("/").pop();
const protectedPages = [
    "dashboard.html",
    "profile.html",
    "settings.html",
    "create-group.html",
    "chat.html",
    "group.html",
    "privacy.html"
];
if(protectedPages.includes(currentPage)){
    let loggedIn = localStorage.getItem("loggedIn");
    let currentUser = localStorage.getItem("currentUser");
    if(loggedIn !== "true" || currentUser === null){
        window.location.replace("login.html");
    }
}
document.addEventListener("DOMContentLoaded", function(){
    console.log("FlyChat Started");
    loadCurrentUserImage();
});
function darkMode() {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("darkMode", "enabled");
    } else {
        localStorage.setItem("darkMode", "disabled");
    }
}

window.addEventListener("DOMContentLoaded", function () {
    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark-mode");
    }
});

function setMobileHeight(){
    let height = window.innerHeight;

    if (window.visualViewport) {
        height = window.visualViewport.height;
    }
    document.documentElement.style.setProperty("--mobile-height", height + "px");
}

setMobileHeight();

if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", setMobileHeight);
}