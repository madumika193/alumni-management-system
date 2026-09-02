let allUsers = { students: [], faculty: [], alumni: [] };
let activeDept = "All";

document.addEventListener("DOMContentLoaded", async () => {
    const name = localStorage.getItem("username") || "Admin";
    const role = localStorage.getItem("role");

    if (role !== "admin") {
        window.location.href = "/";
        return;
    }

    document.getElementById("userName").textContent = name;

    // Lock the date input to today or later
    const eventDateInput = document.getElementById("eventDate");
    eventDateInput.min = new Date().toISOString().split("T")[0];

    document.querySelectorAll(".dept-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".dept-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeDept = chip.getAttribute("data-dept");
            renderUsers();
        });
    });

    document.getElementById("eventForm").addEventListener("submit", publishEvent);

    await loadUsers();
});

async function loadUsers() {
    try {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        allUsers = data;

        document.getElementById("studentCount").textContent = data.students.length;
        document.getElementById("facultyCount").textContent = data.faculty.length;
        document.getElementById("alumniCount").textContent = data.alumni.length;

        renderUsers();
    } catch (err) {
        console.error("Admin users load error:", err);
    }
}

function renderUsers() {
    const filterDept = list => activeDept === "All" ? list : list.filter(u => u.dept === activeDept);

    const students = filterDept(allUsers.students);
    const faculty = filterDept(allUsers.faculty);
    const alumni = filterDept(allUsers.alumni);

    document.getElementById("studentList").innerHTML = students.length
        ? students.map(s => `
            <div class="person">
                <h3>${escapeHtml(s.name)}</h3>
                <p>${escapeHtml(s.email)}</p>
                <span class="tag">${escapeHtml(s.dept)} · Batch ${escapeHtml(s.batch)}</span>
            </div>`).join("")
        : `<p class="empty-note">No students found.</p>`;

    document.getElementById("facultyList").innerHTML = faculty.length
        ? faculty.map(f => `
            <div class="person">
                <h3>${escapeHtml(f.name)}</h3>
                <p>${escapeHtml(f.email)}</p>
                <span class="tag">${escapeHtml(f.dept)}</span>
            </div>`).join("")
        : `<p class="empty-note">No faculty found.</p>`;

    document.getElementById("alumniList").innerHTML = alumni.length
        ? alumni.map(a => `
            <div class="person">
                <h3>${escapeHtml(a.name)}</h3>
                <p>${escapeHtml(a.designation || "Alumnus/Alumna")}${a.company ? " · " + escapeHtml(a.company) : ""}</p>
                <span class="tag">${escapeHtml(a.dept)} · Batch ${escapeHtml(a.batch)}</span>
            </div>`).join("")
        : `<p class="empty-note">No alumni found.</p>`;
}

async function publishEvent(e) {
    e.preventDefault();
    const title = document.getElementById("eventTitle").value.trim();
    const event_date = document.getElementById("eventDate").value;
    const location = document.getElementById("eventLocation").value.trim();
    const dept = document.getElementById("eventDept").value;
    const note = document.getElementById("eventNote");

    try {
        const res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title, event_date, location, dept,
                posted_by_role: "admin",
                posted_by_name: localStorage.getItem("username")
            })
        });
        const data = await res.json();
        note.textContent = data.message;
        note.style.color = data.success ? "var(--accent)" : "#a0432a";
        if (data.success) {
            document.getElementById("eventForm").reset();
            document.getElementById("eventDate").min = new Date().toISOString().split("T")[0];
        }
    } catch (err) {
        console.error("Event publish error:", err);
        note.textContent = "Server error while publishing event.";
    }
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
}

function logout() {
    localStorage.clear();
    window.location.href = "/";
}
