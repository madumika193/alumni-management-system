// ===============================
// GREET LOGGED IN USER
// ===============================

const username = localStorage.getItem("username");

if (document.getElementById("userName")) {
    document.getElementById("userName").innerHTML = username ? username : "Guest";
}

// ===============================
// LOGOUT
// ===============================

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

// ===============================
// SMOOTH SCROLL
// ===============================

document.querySelectorAll("nav a").forEach(function (link) {
    link.addEventListener("click", function (e) {
        const href = link.getAttribute("href");
        if (href && href.startsWith("#")) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: "smooth" });
            }
        }
    });
});