let userEmail = "";
let userName = "";
let activeChatStudent = null;
let activeChatStudentName = "";

document.addEventListener("DOMContentLoaded", async () => {
    const name = localStorage.getItem("username") || "Alumnus";
    userName = name;
    const dept = localStorage.getItem("userDept") || "";
    const role = localStorage.getItem("role");
    userEmail = localStorage.getItem("userEmail") || "";

    if (role !== "alumni") {
        window.location.href = "/";
        return;
    }

    document.getElementById("profileName").value = name;
    document.getElementById("profileEmail").value = userEmail;

    document.getElementById("profileForm").addEventListener("submit", updateProfile);
    document.getElementById("jobForm").addEventListener("submit", postJob);

    await loadMyJobs();
    await loadEvents(dept);
    await fetchNotifications();
    await loadMentees();

    // Auto-refresh active data streams
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

// Single Page View Switcher
function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}

function toggleNotifs() {
    document.getElementById("notifDropdown").classList.toggle("active");
}

async function fetchNotifications() {
    try {
        const res = await fetch(`/api/alumni/notifications?email=${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        if (!data.success) return;

        const badge = document.getElementById("notifCount");
        const reqList = document.getElementById("requestList");
        const notifList = document.getElementById("notifList");

        badge.textContent = data.requests.length;

        reqList.innerHTML = data.requests.length 
            ? data.requests.map(r => `
                <div style="font-size:12px; margin-bottom:8px; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">
                    <strong>${escapeHtml(r.student_name)}</strong> requested mentorship.<br>
                    <small style="color:#64748b;">"${escapeHtml(r.request_note)}"</small><br>
                    <div style="display:flex; gap:6px; margin-top:4px;">
                        <button onclick="respondRequest(${r.id}, 'accepted')" style="font-size:10px; padding:2px 8px;">Accept</button>
                        <button onclick="respondRequest(${r.id}, 'rejected')" style="font-size:10px; padding:2px 8px; background:#ef4444;">Reject</button>
                    </div>
                </div>
            `).join('')
            : `<p style="font-size:12px; color:#94a3b8;">No pending requests.</p>`;

        notifList.innerHTML = data.notifications.length 
            ? data.notifications.map(n => `<p style="font-size:11px; margin:4px 0; color:#334155;">${escapeHtml(n.message)}</p>`).join('')
            : `<p style="font-size:12px; color:#94a3b8;">No unread notifications.</p>`;

    } catch (err) {
        console.error("Notif Fetch Error:", err);
    }
}

async function respondRequest(reqId, status) {
    try {
        const res = await fetch('/api/alumni/mentorship/respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request_id: reqId, status })
        });
        const data = await res.json();
        alert(data.message);
        await fetchNotifications();
        await loadMentees();
    } catch(err) {
        console.error("Response error:", err);
    }
}

async function loadMentees() {
    const menteeList = document.getElementById("menteeList");
    try {
        const res = await fetch(`/api/alumni/mentees?email=${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        if(!data.success) return;

        menteeList.innerHTML = data.mentees.length
            ? data.mentees.map(m => `
                <div class="user-item ${activeChatStudent === m.student_email ? 'active' : ''}" 
                     onclick="selectStudent('${m.student_email}', '${escapeHtml(m.student_name)}')">
                    <div class="avatar">${initials(m.student_name)}</div>
                    <strong>${escapeHtml(m.student_name)}</strong>
                </div>
            `).join('')
            : `<p class="chat-empty-sidebar">No active mentees.</p>`;
    } catch (err) {
        console.error("Mentee list fetch error:", err);
    }
}

function selectStudent(email, name) {
    activeChatStudent = email;
    activeChatStudentName = name;

    const header = document.getElementById("chatHeader");
    header.style.display = "flex";
    document.getElementById("chatHeaderName").textContent = name;
    document.getElementById("chatHeaderAvatar").textContent = initials(name);

    loadMentees();
    loadChatMessages();
}

async function loadChatMessages() {
    if (!activeChatStudent) return;
    const box = document.getElementById("chatBox");
    try {
        const res = await fetch(`/api/messages?user1=${encodeURIComponent(userEmail)}&user2=${encodeURIComponent(activeChatStudent)}`);
        const data = await res.json();
        if (!data.success) return;

        if (!data.messages.length) {
            box.innerHTML = `<div class="chat-empty">No messages yet — say hello to ${escapeHtml(activeChatStudentName)}!</div>`;
            return;
        }

        box.innerHTML = data.messages.map(m => {
            const mine = m.sender_email === userEmail;
            return `
            <div class="msg-row ${mine ? 'mine' : ''}">
                <div class="avatar sm">${initials(mine ? userName : activeChatStudentName)}</div>
                <div class="msg-bubble-wrap">
                    <div class="msg-item ${mine ? 'msg-sent' : 'msg-received'}">${escapeHtml(m.message)}</div>
                    <div class="msg-time">${formatTime(m.timestamp)}</div>
                </div>
            </div>`;
        }).join('');
        box.scrollTop = box.scrollHeight;
    } catch (err) {
        console.error("Chat fetch error:", err);
    }
}

async function sendMessage() {
    const input = document.getElementById("chatInput");
    const msg = input.value.trim();
    if (!msg || !activeChatStudent) return;

    try {
        await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: userEmail,
                receiver: activeChatStudent,
                message: msg
            })
        });
        input.value = "";
        await loadChatMessages();
    } catch (err) {
        console.error("Send message error:", err);
    }
}

async function updateProfile(e) {
    e.preventDefault();
    const name = document.getElementById("profileName").value.trim();
    const company = document.getElementById("profileCompany").value.trim();
    const designation = document.getElementById("profileDesignation").value.trim();
    const about = document.getElementById("profileAbout").value.trim();
    const saveNote = document.getElementById("saveNote");

    try {
        const res = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, name, company, designation, about })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem("username", name);
            saveNote.textContent = "Profile successfully updated.";
            setTimeout(() => saveNote.textContent = "", 3000);
        } else {
            saveNote.textContent = data.message || "Failed to update profile.";
        }
    } catch (err) {
        saveNote.textContent = "Server error while saving.";
    }
}

async function postJob(e) {
    e.preventDefault();
    const title = document.getElementById("jobTitle").value.trim();
    const company = document.getElementById("jobCompany").value.trim();
    const location = document.getElementById("jobLocation").value.trim();
    const link = document.getElementById("jobLink").value.trim();
    const description = document.getElementById("jobDescription").value.trim();

    try {
        const res = await fetch('/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title, company, location, link, description,
                email: userEmail, name: localStorage.getItem("username")
            })
        });
        const data = await res.json();
        alert(data.message);
        if (data.success) {
            document.getElementById("jobForm").reset();
            await loadMyJobs();
        }
    } catch (err) {
        alert("Server error while posting job.");
    }
}

async function loadMyJobs() {
    const list = document.getElementById("myJobList");
    try {
        const res = await fetch(`/api/jobs?email=${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        list.innerHTML = data.jobs.length
            ? data.jobs.map(j => `
                <div class="job-card">
                    <h3>${escapeHtml(j.title)}</h3>
                    <p class="job-meta">${escapeHtml(j.company)} · ${escapeHtml(j.location)}</p>
                    <p class="job-desc">${escapeHtml(j.description)}</p>
                    ${j.link ? `<a class="job-link" href="${escapeHtml(j.link)}" target="_blank" rel="noopener">Apply link →</a>` : ""}
                </div>`).join("")
            : `<p class="empty-note">You haven't posted any jobs yet.</p>`;
    } catch (err) {
        console.error("Jobs load error:", err);
    }
}

async function loadEvents(dept) {
    const eventList = document.getElementById("eventList");
    try {
        const res = await fetch(`/api/events?dept=${encodeURIComponent(dept)}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        eventList.innerHTML = data.events.length
            ? data.events.map(e => `
                <div class="event">
                    <span class="event-date-badge">${formatDate(e.event_date)}</span>
                    <h3>${escapeHtml(e.title)}</h3>
                    <p>📍 ${escapeHtml(e.location)}</p>
                </div>`).join("")
            : `<p class="empty-note">No upcoming events yet.</p>`;
    } catch (err) {
        console.error("Events load error:", err);
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