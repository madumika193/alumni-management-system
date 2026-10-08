let userEmail = "";
let userDept = "";
let userName = "";
let currentDirScope = "my";
let activeChatAlumni = null;
let activeChatAlumniName = "";

document.addEventListener("DOMContentLoaded", async () => {
    userName = localStorage.getItem("username") || "Student";
    userDept = localStorage.getItem("userDept") || "";
    userEmail = localStorage.getItem("userEmail") || "";
    const role = localStorage.getItem("role");

    if (role !== "student") {
        window.location.href = "/";
        return;
    }

    document.getElementById("userDeptLabel").textContent = userDept;
    document.getElementById("profName").value = userName;
    document.getElementById("profEmail").value = userEmail;
    document.getElementById("profDept").value = userDept;
    document.getElementById("profBatch").value = localStorage.getItem("userBatch") || "";

    document.getElementById("studentProfileForm").addEventListener("submit", updateStudentProfile);

    await loadAlumniDirectory();
    await loadJobs();
    await loadEvents();
    await loadFacultyIncharge();
    await loadAcceptedMentors();
    await fetchNotifications();

    setInterval(fetchNotifications, 5000);
    setInterval(loadChatMessages, 3000);

    const chatInputEl = document.getElementById("chatInput");
    if (chatInputEl) {
        chatInputEl.addEventListener("keydown", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    }
});

function initials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || name[0].toUpperCase();
}

function formatTime(ts) {
    if (!ts) return "";
    const d = new Date(ts.includes("T") ? ts : ts.replace(" ", "T") + "Z");
    if (isNaN(d)) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}

function toggleNotifs() {
    document.getElementById("notifDropdown").classList.toggle("active");
}

function setDirFilter(scope) {
    currentDirScope = scope;
    document.getElementById("dirFilterMy").classList.toggle("active", scope === 'my');
    document.getElementById("dirFilterAll").classList.toggle("active", scope === 'all');
    loadAlumniDirectory();
}

async function loadAlumniDirectory() {
    const container = document.getElementById("alumniList");
    const query = currentDirScope === 'my' ? `?dept=${encodeURIComponent(userDept)}` : '';
    
    try {
        const res = await fetch(`/api/alumni${query}`);
        const data = await res.json();
        if (!data.success) return;

        container.innerHTML = data.alumni.length
            ? data.alumni.map(a => `
                <div class="person" style="background:#fff; padding:16px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:12px;">
                    <h3>${escapeHtml(a.name)}</h3>
                    <p style="color:#64748b; font-size:13px;">${escapeHtml(a.designation || "Alumnus")}${a.company ? " at " + escapeHtml(a.company) : ""}</p>
                    <span class="tag" style="background:#eff6ff; color:#2563eb; padding:2px 8px; border-radius:4px; font-size:11px;">
                        ${escapeHtml(a.dept)} · Batch ${escapeHtml(a.batch)}
                    </span>
                    <p style="font-size:12px; margin-top:8px;">${escapeHtml(a.about || "No description provided.")}</p>
                    <button onclick="requestMentorship('${escapeHtml(a.email)}')" style="margin-top:10px; font-size:12px; padding:6px 12px;">
                        Request Mentorship
                    </button>
                </div>
            `).join('')
            : `<p class="empty-note">No alumni found for this view.</p>`;
    } catch (err) {
        console.error("Directory Error:", err);
    }
}

async function requestMentorship(alumniEmail) {
    const note = prompt("Enter a message or context for your mentorship request:");
    if (note === null) return;

    try {
        const res = await fetch('/api/student/mentorship/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_email: userEmail,
                student_name: userName,
                alumni_email: alumniEmail,
                request_note: note
            })
        });
        const data = await res.json();
        alert(data.message);
    } catch (err) {
        alert("Failed to send mentorship request.");
    }
}

async function loadJobs() {
    const list = document.getElementById("jobList");
    try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        if (!data.success) return;

        list.innerHTML = data.jobs.length
            ? data.jobs.map(j => `
                <div class="job-card" style="background:#fff; padding:16px; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:12px;">
                    <h3>${escapeHtml(j.title)}</h3>
                    <p class="job-meta" style="color:#64748b; font-size:13px;">${escapeHtml(j.company)} · ${escapeHtml(j.location)}</p>
                    <p class="job-desc" style="font-size:13px; margin:8px 0;">${escapeHtml(j.description)}</p>
                    <small style="color:#94a3b8;">Posted by: ${escapeHtml(j.posted_by_name)}</small><br>
                    ${j.link ? `<a class="job-link" href="${escapeHtml(j.link)}" target="_blank" style="color:#2563eb; font-size:12px; font-weight:600;">Apply Link →</a>` : ""}
                </div>
            `).join('')
            : `<p class="empty-note">No active job listings.</p>`;
    } catch (err) {
        console.error("Job Fetch Error:", err);
    }
}

async function loadAcceptedMentors() {
    const list = document.getElementById("alumniChatList");
    try {
        const res = await fetch(`/api/student/mentors?email=${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        if (!data.success) return;

        list.innerHTML = data.mentors.length
            ? data.mentors.map(m => `
                <div class="user-item ${activeChatAlumni === m.alumni_email ? 'active' : ''}" 
                     onclick="selectMentor('${m.alumni_email}', '${escapeHtml(m.alumni_name)}')">
                    <div class="avatar">${initials(m.alumni_name)}</div>
                    <strong>${escapeHtml(m.alumni_name)}</strong>
                </div>
            `).join('')
            : `<p class="chat-empty-sidebar">No active mentors yet.</p>`;
    } catch (err) {
        console.error("Mentor list error:", err);
    }
}

function selectMentor(email, name) {
    activeChatAlumni = email;
    activeChatAlumniName = name;

    const header = document.getElementById("chatHeader");
    header.style.display = "flex";
    document.getElementById("chatHeaderName").textContent = name;
    document.getElementById("chatHeaderAvatar").textContent = initials(name);

    loadAcceptedMentors();
    loadChatMessages();
}

async function loadChatMessages() {
    if (!activeChatAlumni) return;
    const box = document.getElementById("chatBox");
    try {
        const res = await fetch(`/api/messages?user1=${encodeURIComponent(userEmail)}&user2=${encodeURIComponent(activeChatAlumni)}`);
        const data = await res.json();
        if (!data.success) return;

        if (!data.messages.length) {
            box.innerHTML = `<div class="chat-empty">No messages yet — say hello to ${escapeHtml(activeChatAlumniName)}!</div>`;
            return;
        }

        box.innerHTML = data.messages.map(m => {
            const mine = m.sender_email === userEmail;
            return `
            <div class="msg-row ${mine ? 'mine' : ''}">
                <div class="avatar sm">${initials(mine ? userName : activeChatAlumniName)}</div>
                <div class="msg-bubble-wrap">
                    <div class="msg-item ${mine ? 'msg-sent' : 'msg-received'}">${escapeHtml(m.message)}</div>
                    <div class="msg-time">${formatTime(m.timestamp)}</div>
                </div>
            </div>`;
        }).join('');
        box.scrollTop = box.scrollHeight;
    } catch (err) {
        console.error("Chat error:", err);
    }
}

async function sendMessage() {
    const input = document.getElementById("chatInput");
    const msg = input.value.trim();
    if (!msg || !activeChatAlumni) return;

    try {
        await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender: userEmail, receiver: activeChatAlumni, message: msg })
        });
        input.value = "";
        await loadChatMessages();
    } catch (err) {
        console.error("Send error:", err);
    }
}

async function loadEvents() {
    const eventList = document.getElementById("eventList");
    try {
        const res = await fetch(`/api/events?dept=${encodeURIComponent(userDept)}`);
        const data = await res.json();
        if (!data.success) return;

        eventList.innerHTML = data.events.length
            ? data.events.map(e => `
                <div class="event" style="background:#fff; padding:12px; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:8px;">
                    <span class="event-date-badge" style="font-weight:600; color:#2563eb;">${formatDate(e.event_date)}</span>
                    <h3>${escapeHtml(e.title)}</h3>
                    <p>📍 ${escapeHtml(e.location)}</p>
                </div>`).join("")
            : `<p class="empty-note">No upcoming events.</p>`;
    } catch (err) {
        console.error("Events error:", err);
    }
}

async function loadFacultyIncharge() {
    const card = document.getElementById("facultyInchargeCard");
    try {
        const res = await fetch(`/api/directory?dept=${encodeURIComponent(userDept)}`);
        const data = await res.json();
        if (!data.success) return;

        card.innerHTML = data.faculty.length
            ? data.faculty.map(f => `
                <div style="border-left: 3px solid #2563eb; padding-left: 12px; margin-top:8px;">
                    <h4 style="margin:0;">${escapeHtml(f.name)}</h4>
                    <p style="margin:4px 0; font-size:13px; color:#64748b;">${escapeHtml(f.email)}</p>
                    <span style="font-size:11px; background:#eff6ff; color:#2563eb; padding:2px 6px; border-radius:4px;">${escapeHtml(f.dept)} Incharge</span>
                </div>
            `).join('')
            : `<p style="font-size:13px; color:#94a3b8;">No faculty assigned to your department yet.</p>`;
    } catch (err) {
        console.error("Faculty load error:", err);
    }
}

async function updateStudentProfile(e) {
    e.preventDefault();
    const batch = document.getElementById("profBatch").value.trim();
    const note = document.getElementById("profNote");

    try {
        const res = await fetch('/api/student/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, batch })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem("userBatch", batch);
            note.style.color = "green";
            note.textContent = "Profile updated successfully.";
        } else {
            note.style.color = "red";
            note.textContent = data.message || "Update failed.";
        }
    } catch (err) {
        note.style.color = "red";
        note.textContent = "Server communication error.";
    }
}

async function fetchNotifications() {
    try {
        const res = await fetch(`/api/student/notifications?email=${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        if (!data.success) return;

        document.getElementById("notifCount").textContent = data.notifications.length;
        document.getElementById("notifList").innerHTML = data.notifications.length
            ? data.notifications.map(n => `<p style="font-size:12px; color:#334155; margin:4px 0;">${escapeHtml(n.message)}</p>`).join('')
            : `<p style="font-size:12px; color:#94a3b8;">No new notifications.</p>`;
    } catch (err) {
        console.error("Notif Error:", err);
    }
}

function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
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