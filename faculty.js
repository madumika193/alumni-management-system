document.addEventListener("DOMContentLoaded", async () => {
    const name = localStorage.getItem("username") || "Faculty";
    const dept = localStorage.getItem("userDept") || "";
    const role = localStorage.getItem("role");

    if (role !== "faculty") {
        window.location.href = "/";
        return;
    }

    document.getElementById("userName").textContent = name;
    document.getElementById("facultyDept").textContent = dept;
    document.getElementById("deptRosterTitle").textContent = dept;

    await loadRoster(dept);
});

async function loadRoster(dept) {
    const studentList = document.getElementById("deptStudentList");
    const alumniList = document.getElementById("deptAlumniList");

    try {
        const res = await fetch(`/api/directory?dept=${encodeURIComponent(dept)}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        studentList.innerHTML = data.students.length
            ? data.students.map(s => `
                <div class="person">
                    <h3>${escapeHtml(s.name)}</h3>
                    <p>${escapeHtml(s.email)}</p>
                    <span class="tag">Batch ${escapeHtml(s.batch)}</span>
                </div>`).join("")
            : `<p class="empty-note">No students registered in ${escapeHtml(dept)} yet.</p>`;

        alumniList.innerHTML = data.alumni.length
            ? data.alumni.map(a => `
                <div class="person">
                    <h3>${escapeHtml(a.name)}</h3>
                    <p>${escapeHtml(a.designation || "Alumnus/Alumna")}${a.company ? " · " + escapeHtml(a.company) : ""}</p>
                    <span class="tag">Batch ${escapeHtml(a.batch)}</span>
                </div>`).join("")
            : `<p class="empty-note">No alumni registered from ${escapeHtml(dept)} yet.</p>`;

    } catch (err) {
        console.error("Roster load error:", err);
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
