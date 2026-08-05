// ===============================
// PROFILE: LOAD + SAVE (persists in localStorage)
// ===============================

const profileFields = ["profileName", "profileEmail", "profileCompany", "profileDesignation", "profileAbout"];

function loadProfile() {
    const saved = JSON.parse(localStorage.getItem("alumniProfile") || "{}");
    profileFields.forEach(function (id) {
        const el = document.getElementById(id);
        if (el && saved[id]) el.value = saved[id];
    });
}

const saveProfileBtn = document.getElementById("saveProfileBtn");
const saveNote = document.getElementById("saveNote");

if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", function () {
        const data = {};
        profileFields.forEach(function (id) {
            const el = document.getElementById(id);
            data[id] = el ? el.value : "";
        });
        localStorage.setItem("alumniProfile", JSON.stringify(data));

        saveNote.innerText = "Profile saved just now. You can update it anytime.";
        setTimeout(function () { saveNote.innerText = ""; }, 3000);
    });
}

loadProfile();

// ===============================
// JOB BOARD
// ===============================

let jobs = JSON.parse(localStorage.getItem("alumniJobs") || "[]");

const jobList = document.getElementById("jobList");
const postJobBtn = document.getElementById("postJobBtn");

function renderJobs() {
    jobList.innerHTML = "";

    if (jobs.length === 0) {
        jobList.innerHTML = "<p>No jobs posted yet. Share an opportunity above.</p>";
        return;
    }

    jobs.forEach(function (job, index) {
        const card = document.createElement("div");
        card.className = "job-card";
        card.innerHTML =
            "<h3>" + job.title + "</h3>" +
            "<p class='job-meta'>" + job.company + " · " + job.location + "</p>" +
            "<p class='job-desc'>" + job.description + "</p>" +
            (job.link ? "<a class='job-link' href='" + job.link + "' target='_blank'>Apply here</a>" : "") +
            "<button class='job-remove' data-index='" + index + "'>Remove</button>";
        jobList.appendChild(card);
    });

    document.querySelectorAll(".job-remove").forEach(function (btn) {
        btn.addEventListener("click", function () {
            jobs.splice(Number(btn.dataset.index), 1);
            localStorage.setItem("alumniJobs", JSON.stringify(jobs));
            renderJobs();
        });
    });
}

if (postJobBtn) {
    postJobBtn.addEventListener("click", function () {
        const title = document.getElementById("jobTitle").value.trim();
        const company = document.getElementById("jobCompany").value.trim();
        const location = document.getElementById("jobLocation").value.trim();
        const link = document.getElementById("jobLink").value.trim();
        const description = document.getElementById("jobDescription").value.trim();

        if (!title || !company || !description) {
            alert("Please fill in at least the title, company and description.");
            return;
        }

        jobs.unshift({ title: title, company: company, location: location, link: link, description: description });
        localStorage.setItem("alumniJobs", JSON.stringify(jobs));

        ["jobTitle", "jobCompany", "jobLocation", "jobLink", "jobDescription"].forEach(function (id) {
            document.getElementById(id).value = "";
        });

        renderJobs();
    });
}

renderJobs();

// ===============================
// EVENTS
// ===============================

document.querySelectorAll(".event button").forEach(function (btn) {
    btn.addEventListener("click", function () {
        btn.innerHTML = "Registered";
        btn.style.background = "green";
    });
});

// ===============================
// DONATION
// ===============================

const donateBtn = document.getElementById("donateBtn");

if (donateBtn) {
    donateBtn.addEventListener("click", function () {
        const amountEl = document.getElementById("donationAmount");
        if (!amountEl.value) {
            alert("Please enter an amount");
            return;
        }
        alert("Thank you for donating ₹" + amountEl.value);
        amountEl.value = "";
    });
}