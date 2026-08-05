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

// ===============================
// STATE & ROLE MANAGEMENT
// ===============================

let selectedRole = "student"; // Default role

// Handle Role Pill Clicks
const rolePills = document.querySelectorAll(".role-pill");
rolePills.forEach(pill => {
    pill.addEventListener("click", function () {
        rolePills.forEach(p => p.classList.remove("active"));
        this.classList.add("active");
        selectedRole = this.getAttribute("data-role");
        
        // Update dynamic fields if signup is open
        if (document.getElementById("signupForm").style.display === "block") {
            toggleSignupFieldsForRole();
        }
    });
});

// ===============================
// SHOW LOGIN / SIGNUP TABS
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

// Adjust signup fields depending on the selected role (e.g., Faculty don't need Batch years)
function toggleSignupFieldsForRole() {
    const batchSelect = document.getElementById("signupBatch");
    if (batchSelect) {
        if (selectedRole === "faculty") {
            batchSelect.style.display = "none";
            batchSelect.removeAttribute("required");
        } else {
            batchSelect.style.display = "block";
            batchSelect.setAttribute("required", "true");
        }
    }
}

// ===============================
// SIGNUP AUTHENTICATION (Mock DB)
// ===============================

const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const name = signupForm.querySelector("input[type='text']").value;
        const email = signupForm.querySelector("input[type='email']").value.trim().toLowerCase();
        const password = signupForm.querySelectorAll("input[type='password']")[0].value;
        const dept = document.getElementById("signupDept").value;
        const batch = selectedRole !== "faculty" ? document.getElementById("signupBatch").value : "N/A";

        // Retrieve existing users or initialize empty array
        let users = JSON.parse(localStorage.getItem("ssn_users")) || [];

        // Check if email already exists
        const userExists = users.some(user => user.email === email && user.role === selectedRole);
        if (userExists) {
            alert("An account with this email already exists for this role!");
            return;
        }

        // Save new user object
        const newUser = { name, email, password, role: selectedRole, dept, batch };
        users.push(newUser);
        localStorage.setItem("ssn_users", JSON.stringify(users));

        alert("Registration Successful! Please login.");
        signupForm.reset();
        showLogin();
    });
}

// ===============================
// LOGIN AUTHENTICATION
// ===============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = loginForm.querySelector("input[type='email']").value.trim().toLowerCase();
        const password = loginForm.querySelector("input[type='password']").value;

        let users = JSON.parse(localStorage.getItem("ssn_users")) || [];

        // Find user matching email, password, and active role
        const validUser = users.find(user => user.email === email && user.password === password && user.role === selectedRole);

        if (validUser) {
            // Save session details
            localStorage.setItem("username", validUser.name);
            localStorage.setItem("role", validUser.role);
            localStorage.setItem("userEmail", validUser.email);
            localStorage.setItem("userDept", validUser.dept);

            // Route to appropriate dashboard
            if (selectedRole === "faculty") {
                window.location.href = "faculty.html";
            } else if (selectedRole === "alumni") {
                window.location.href = "alumni.html";
            } else {
                window.location.href = "student.html";
            }
        } else {
            alert("Invalid email, password, or role selection. Please check your details or register first.");
        }
    });
}

window.onload = function () {
    console.log("SSN Alumni Network Authentication Loaded");
};

let selectedRole = "student";

// Role Selection Logic
const rolePills = document.querySelectorAll(".role-pill");
rolePills.forEach(pill => {
    pill.addEventListener("click", function () {
        rolePills.forEach(p => p.classList.remove("active"));
        this.classList.add("active");
        selectedRole = this.getAttribute("data-role");
        
        if (document.getElementById("signupForm").style.display === "block") {
            toggleSignupFieldsForRole();
        }
    });
});

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

function toggleSignupFieldsForRole() {
    const batchSelect = document.getElementById("signupBatch");
    if (batchSelect) {
        if (selectedRole === "faculty") {
            batchSelect.style.display = "none";
            batchSelect.removeAttribute("required");
        } else {
            batchSelect.style.display = "block";
            batchSelect.setAttribute("required", "true");
        }
    }
}

// ===============================
// BACKEND SIGNUP CONNECTION
// ===============================
const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = signupForm.querySelector("input[type='text']").value;
        const email = signupForm.querySelector("input[type='email']").value;
        const password = signupForm.querySelectorAll("input[type='password']")[0].value;
        const dept = document.getElementById("signupDept").value;
        const batch = selectedRole !== "faculty" ? document.getElementById("signupBatch").value : "N/A";

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role: selectedRole, dept, batch })
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                signupForm.reset();
                showLogin();
            } else {
                alert(result.message);
            }
        } catch (err) {
            console.error("Error:", err);
            alert("Something went wrong connecting to the server.");
        }
    });
}

// ===============================
// BACKEND LOGIN CONNECTION
// ===============================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = loginForm.querySelector("input[type='email']").value;
        const password = loginForm.querySelector("input[type='password']").value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: selectedRole })
            });

            const result = await response.json();
            if (response.ok) {
                localStorage.setItem("username", result.name);
                localStorage.setItem("role", result.role);
                localStorage.setItem("userDept", result.dept);

                // Redirect based on role
                if (result.role === "faculty") {
                    window.location.href = "/faculty"; // Route or page map
                } else if (result.role === "alumni") {
                    window.location.href = "/alumni";
                } else {
                    window.location.href = "/student";
                }
            } else {
                alert(result.message);
            }
        } catch (err) {
            console.error("Error:", err);
            alert("Server connection failed.");
        }
    });
}