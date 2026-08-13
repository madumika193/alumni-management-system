let selectedRole = "student";

// Wait for DOM to fully load
document.addEventListener("DOMContentLoaded", () => {
    const rolePills = document.querySelectorAll(".role-pill");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const errorBox = document.getElementById("loginErrorBox");
    const redDeleteBtn = document.getElementById("redDeleteBtn");

    // Handle Role Selector Clicks
    rolePills.forEach(pill => {
        pill.addEventListener("click", function () {
            rolePills.forEach(p => p.classList.remove("active"));
            this.classList.add("active");
            selectedRole = this.getAttribute("data-role") || this.innerText.toLowerCase().trim();
            toggleSignupFieldsForRole();
        });
    });

    // Handle Backend Signup Submission
    if (signupForm) {
        signupForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const name = signupForm.querySelector("input[name='full_name']").value;
            const email = signupForm.querySelector("input[name='email']").value;
            const password = signupForm.querySelector("input[name='password']").value;
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

    // Handle Backend Login Submission
    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const email = loginForm.querySelector("input[name='email']").value.trim();
            const password = loginForm.querySelector("input[name='password']").value;

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

                    if (errorBox) errorBox.style.display = "none";

                    // Redirect dynamically according to role
                    if (result.role === "faculty") {
                        window.location.href = "/faculty";
                    } else if (result.role === "alumni") {
                        window.location.href = "/alumni";
                    } else {
                        window.location.href = "/student";
                    }
                } else {
                    // Show in-page red delete button box on login failure
                    if (errorBox) errorBox.style.display = "block";
                }
            } catch (err) {
                console.error("Error:", err);
                if (errorBox) errorBox.style.display = "block";
            }
        });
    }

    // Handle Red Delete Button Click
    if (redDeleteBtn) {
        redDeleteBtn.addEventListener("click", async () => {
            const emailInput = loginForm.querySelector("input[name='email']").value.trim();

            if (!emailInput) {
                alert("Please enter your registered email address above first.");
                return;
            }

            const confirmDelete = confirm(`Are you sure you want to delete the account for "${emailInput}" and re-register?`);

            if (confirmDelete) {
                try {
                    const response = await fetch('/api/force-delete-account', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: emailInput, role: selectedRole })
                    });

                    const result = await response.json();

                    if (result.success) {
                        alert(result.message);
                        if (errorBox) errorBox.style.display = "none";
                        loginForm.reset();
                        showSignup();
                    } else {
                        alert(result.message || "Failed to delete account.");
                    }
                } catch (err) {
                    console.error("Delete Error:", err);
                    alert("A server connection error occurred.");
                }
            }
        });
    }
});

// UI Toggle Functions
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