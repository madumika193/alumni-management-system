const ROLE_CONFIG = {
    student:  { label: "Student",  title: "Student Access",  needsDept: true,  needsBatch: true  },
    faculty:  { label: "Faculty",  title: "Faculty Access",  needsDept: true,  needsBatch: false },
    alumni:   { label: "Alumni",   title: "Alumni Access",   needsDept: true,  needsBatch: true  },
    admin:    { label: "Admin",    title: "Admin Access",    needsDept: false, needsBatch: false }
};

let selectedRole = null;

document.addEventListener("DOMContentLoaded", () => {
    const stepRoles = document.getElementById("stepRoles");
    const stepForm = document.getElementById("stepForm");
    const roleCards = document.querySelectorAll(".role-card");
    const backBtn = document.getElementById("backBtn");
    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const errorBox = document.getElementById("loginErrorBox");
    const redDeleteBtn = document.getElementById("redDeleteBtn");
    const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
    const forgotForm = document.getElementById("forgotForm");
    const cancelForgotBtn = document.getElementById("cancelForgotBtn");
    const deptField = document.getElementById("deptField");
    const batchField = document.getElementById("batchField");
    const signupDept = document.getElementById("signupDept");
    const signupBatch = document.getElementById("signupBatch");

    roleCards.forEach(card => {
        card.addEventListener("click", () => {
            roleCards.forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            selectedRole = card.getAttribute("data-role");
            enterFormStep();
        });
    });

    function enterFormStep() {
        const cfg = ROLE_CONFIG[selectedRole];
        document.getElementById("formEyebrow").textContent = "Registry / " + cfg.label;
        document.getElementById("formTitle").textContent = cfg.title;

        deptField.style.display = cfg.needsDept ? "flex" : "none";
        signupDept.required = cfg.needsDept;
        batchField.style.display = cfg.needsBatch ? "flex" : "none";
        signupBatch.required = cfg.needsBatch;

        stepRoles.classList.remove("active");
        stepForm.classList.add("active");
        errorBox.style.display = "none";
        forgotForm.style.display = "none";
        showLogin();
    }

    backBtn.addEventListener("click", () => {
        stepForm.classList.remove("active");
        stepRoles.classList.add("active");
    });

    tabLogin.addEventListener("click", showLogin);
    tabRegister.addEventListener("click", showRegister);

    function showLogin() {
        loginForm.style.display = "flex";
        signupForm.style.display = "none";
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
        errorBox.style.display = "none";
        forgotForm.style.display = "none";
    }

    function showRegister() {
        loginForm.style.display = "none";
        signupForm.style.display = "flex";
        tabRegister.classList.add("active");
        tabLogin.classList.remove("active");
        errorBox.style.display = "none";
        forgotForm.style.display = "none";
    }

    // ---- Register ----
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const cfg = ROLE_CONFIG[selectedRole];

        const name = signupForm.querySelector("input[name='full_name']").value.trim();
        const email = signupForm.querySelector("input[name='email']").value.trim();
        const password = signupForm.querySelector("input[name='password']").value;
        const dept = cfg.needsDept ? signupDept.value : "Administration";
        const batch = cfg.needsBatch ? signupBatch.value : "N/A";

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role: selectedRole, dept, batch })
            });
            const result = await response.json();
            alert(result.message);
            if (response.ok) {
                signupForm.reset();
                showLogin();
            }
        } catch (err) {
            console.error("Signup error:", err);
            alert("Something went wrong connecting to the server.");
        }
    });

    // ---- Login ----
    loginForm.addEventListener("submit", async (e) => {
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
                localStorage.setItem("userEmail", result.email);
                errorBox.style.display = "none";

                if (result.role === "faculty") window.location.href = "/faculty";
                else if (result.role === "alumni") window.location.href = "/alumni";
                else if (result.role === "admin") window.location.href = "/admin";
                else window.location.href = "/student";
            } else {
                errorBox.style.display = "block";
            }
        } catch (err) {
            console.error("Login error:", err);
            errorBox.style.display = "block";
        }
    });

    // ---- Forgot password ----
    forgotPasswordBtn.addEventListener("click", () => {
        const emailInput = loginForm.querySelector("input[name='email']").value.trim();
        if (!emailInput) {
            alert("Enter your registered email above first.");
            return;
        }
        forgotForm.style.display = "flex";
    });

    cancelForgotBtn.addEventListener("click", () => {
        forgotForm.reset();
        forgotForm.style.display = "none";
    });

    forgotForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector("input[name='email']").value.trim();
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (newPassword !== confirmPassword) {
            alert("Passwords don't match.");
            return;
        }

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role: selectedRole, new_password: newPassword })
            });
            const result = await response.json();
            alert(result.message);
            if (response.ok) {
                forgotForm.reset();
                forgotForm.style.display = "none";
                errorBox.style.display = "none";
            }
        } catch (err) {
            console.error("Reset password error:", err);
            alert("Something went wrong connecting to the server.");
        }
    });

    // ---- Delete & re-register ----
    redDeleteBtn.addEventListener("click", async () => {
        const emailInput = loginForm.querySelector("input[name='email']").value.trim();
        if (!emailInput) {
            alert("Enter your registered email above first.");
            return;
        }
        const confirmDelete = confirm(`Delete the ${selectedRole} entry for "${emailInput}" and re-register?`);
        if (!confirmDelete) return;

        try {
            const response = await fetch('/api/force-delete-account', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput, role: selectedRole })
            });
            const result = await response.json();
            alert(result.message);
            if (result.success) {
                errorBox.style.display = "none";
                loginForm.reset();
                showRegister();
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("A server connection error occurred.");
        }
    });
});
