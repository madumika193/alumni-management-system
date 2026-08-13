document.addEventListener("DOMContentLoaded", () => {
    // 1. Set Logged-in Alumni Name & Email in Profile
    const userName = localStorage.getItem("userName") || "Alumni";
    const userEmail = localStorage.getItem("userEmail") || "";
    
    const userNameElement = document.getElementById("userName");
    if (userNameElement) userNameElement.innerText = userName;

    // Auto-fill profile fields if empty
    const nameInput = document.getElementById("profileName");
    const emailInput = document.getElementById("profileEmail");
    if (nameInput && !nameInput.value) nameInput.value = userName;
    if (emailInput && !emailInput.value) emailInput.value = userEmail;

    // 2. Load Saved Profile & Jobs
    loadProfile();
    renderJobs();

    // 3. Setup Save Profile Listener
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener("click", saveProfile);
    }

    // 4. Setup Job Post Listener
    const postJobBtn = document.getElementById("postJobBtn");
    if (postJobBtn) {
        postJobBtn.addEventListener("click", postJob);
    }

    // 5. Setup Events & Donation Listeners
    setupEventsAndDonation();
});

const profileFields = ["profileName", "profileEmail", "profileCompany", "profileDesignation", "profileAbout"];

function loadProfile() {
    const saved = JSON.parse(localStorage.getItem("alumniProfile") || "{}");
    profileFields.forEach(id => {
        const el = document.getElementById(id);
        if (el && saved[id]) el.value = saved[id];
    });
}

function saveProfile() {
    const data = {};
    profileFields.forEach(id => {
        const el = document.getElementById(id);
        data[id] = el ? el.value.trim() : "";
    });

    localStorage.setItem("alumniProfile", JSON.stringify(data));

    const saveNote = document.getElementById("saveNote");
    if (saveNote) {
        saveNote.innerText = "Profile saved successfully!";
        setTimeout(() => { saveNote.innerText = ""; }, 3000);
    }
}

function getStoredJobs() {
    return JSON.parse(localStorage.getItem("alumniJobs") || "[]");
}

function renderJobs() {
    const jobList = document.getElementById("jobList");
    if (!jobList) return;

    const jobs = getStoredJobs();
    jobList.innerHTML = "";

    if (jobs.length === 0) {
        jobList.innerHTML = "<p>No jobs posted yet. Share an opportunity above.</p>";
        return;
    }

    jobs.forEach((job, index) => {
        const card = document.createElement("div");
        card.className = "job-card";
        card.innerHTML = `
            <h3>${job.title}</h3>
            <p class="job-meta">${job.company} · ${job.location}</p>
            <p class="job-desc">${job.description}</p>
            ${job.link ? `<a class="job-link" href="${job.link}" target="_blank">Apply Link</a>` : ''}
            <button class="job-remove" onclick="removeJob(${index})">Remove</button>
        `;
        jobList.appendChild(card);
    });
}

function postJob() {
    const title = document.getElementById("jobTitle").value.trim();
    const company = document.getElementById("jobCompany").value.trim();
    const location = document.getElementById("jobLocation").value.trim();
    const link = document.getElementById("jobLink").value.trim();
    const description = document.getElementById("jobDescription").value.trim();

    if (!title || !company || !description) {
        alert("Please fill in at least the Title, Company, and Description.");
        return;
    }

    const jobs = getStoredJobs();
    jobs.unshift({ title, company, location, link, description });
    localStorage.setItem("alumniJobs", JSON.stringify(jobs));

    ["jobTitle", "jobCompany", "jobLocation", "jobLink", "jobDescription"].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = "";
    });

    renderJobs();
}

function removeJob(index) {
    const jobs = getStoredJobs();
    jobs.splice(index, 1);
    localStorage.setItem("alumniJobs", JSON.stringify(jobs));
    renderJobs();
}

function setupEventsAndDonation() {
    document.querySelectorAll("#events .event button").forEach(btn => {
        btn.addEventListener("click", () => {
            btn.innerText = "Registered";
            btn.style.background = "#28a745";
        });
    });

    const donateBtn = document.getElementById("donateBtn");
    if (donateBtn) {
        donateBtn.addEventListener("click", () => {
            const amountEl = document.getElementById("donationAmount");
            if (!amountEl || !amountEl.value) {
                alert("Please enter a donation amount.");
                return;
            }
            alert(`Thank you for donating ₹${amountEl.value}!`);
            amountEl.value = "";
        });
    }
}

function logout() {
    localStorage.clear();
    window.location.href = "/";
}