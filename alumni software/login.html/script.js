// ===============================
// ROLE SELECTION
// ===============================

let selectedRole = "student";

const rolePills = document.querySelectorAll(".role-pill");

rolePills.forEach(function (pill) {
    pill.addEventListener("click", function () {
        rolePills.forEach(function (p) { p.classList.remove("active"); });
        pill.classList.add("active");
        selectedRole = pill.dataset.role;
        toggleSignupFieldsForRole();
    });
});

function toggleSignupFieldsForRole() {
    const batchField = document.getElementById("signupBatch");
    if (!batchField) return;

    if (selectedRole === "faculty") {
        batchField.style.display = "none";
        batchField.required = false;
    } else {
        batchField.style.display = "block";
        batchField.required = true;
    }
}

// ===============================
// LOGIN
// ===============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = loginForm.querySelector("input[type='email']").value;
        const name = email.split("@")[0];

        localStorage.setItem("username", name);
        localStorage.setItem("role", selectedRole);

        if (selectedRole === "faculty") {
            window.location.href = "faculty.html";
        } else if (selectedRole === "alumni") {
            window.location.href = "alumni.html";
        } else {
            window.location.href = "student.html";
        }
    });
}

// ===============================
// SIGNUP
// ===============================

const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
        e.preventDefault();
        alert("Registration Successful! Please login as " + selectedRole + ".");
        showLogin();
    });
}

// ===============================
// SHOW LOGIN / SIGNUP
// ===============================

function showLogin() {
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("signupForm").style.display = "none";
    document.querySelectorAll(".tab")[0].classList.add("active");
    document.querySelectorAll(".tab")[1].classList.remove("active");
}

function showSignup() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("signupForm").style.display = "block";
    document.querySelectorAll(".tab")[1].classList.add("active");
    document.querySelectorAll(".tab")[0].classList.remove("active");
    toggleSignupFieldsForRole();
}

window.onload = function () {
    console.log("SSN Alumni Network Login Loaded");
};