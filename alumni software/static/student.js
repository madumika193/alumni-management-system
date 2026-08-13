let activeContact = "Karthik";
const conversations = {
    Karthik: ["Hey! Are you attending the AI workshop?", "Yes, saving a seat for you too."],
    Divya: ["Did you get the alumni meet schedule?", "Yes, it's on the events tab."],
    Mohan: ["Need notes for tomorrow's class?", "Sure, sending them tonight."]
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Display Logged-in Student Name
    const userName = localStorage.getItem("userName") || "Student";
    const userNameElement = document.getElementById("userName");
    if (userNameElement) userNameElement.innerText = userName;

    // 2. Fetch and render registered Alumni Directory
    loadAlumniDirectory();

    // 3. Setup Directory Search Filter
    const searchInput = document.querySelector("#directory input");
    if (searchInput) {
        searchInput.addEventListener("keyup", () => {
            const query = searchInput.value.toLowerCase();
            document.querySelectorAll("#directory .person").forEach(card => {
                card.style.display = card.innerText.toLowerCase().includes(query) ? "block" : "none";
            });
        });
    }

    // 4. Setup Events & Posts Handlers
    setupEventButtons();
    setupPostActions();

    // 5. Setup Chat Functionality
    setupChat();
});

async function loadAlumniDirectory() {
    const directory = document.querySelector("#directory .directory");
    if (!directory) return;

    try {
        const response = await fetch('/api/alumni');
        const data = await response.json();

        if (data.success && data.alumni.length > 0) {
            directory.innerHTML = data.alumni.map(alumnus => `
                <div class="person">
                    <h3>${alumnus.name}</h3>
                    <p>${alumnus.designation || 'Alumni'} ${alumnus.company ? '· ' + alumnus.company : ''} · ${alumnus.dept} ${alumnus.batch}</p>
                    <button onclick="connect(this, '${alumnus.email}')">Connect</button>
                </div>
            `).join('');
        } else {
            directory.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">No registered alumni found in the database yet.</p>`;
        }
    } catch (err) {
        console.error("Error fetching alumni directory:", err);
    }
}

function connect(btn, email) {
    btn.innerText = "Requested";
    btn.disabled = true;
    alert(`Connection request sent to ${email}`);
}

function setupEventButtons() {
    document.querySelectorAll(".event button").forEach(btn => {
        btn.addEventListener("click", () => {
            btn.innerText = "Registered";
            btn.style.background = "#28a745";
        });
    });
}

function setupPostActions() {
    document.querySelectorAll(".like-btn").forEach(btn => {
        let liked = false;
        btn.addEventListener("click", () => {
            liked = !liked;
            btn.innerText = liked ? "👍 Liked" : "👍 Like";
            btn.style.color = liked ? "#002147" : "";
        });
    });

    document.querySelectorAll(".comment-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const comment = prompt("Write a comment:");
            if (comment) alert("Comment posted: " + comment);
        });
    });
}

function setupChat() {
    const contacts = document.querySelectorAll(".chat-contact");
    const chatMessages = document.getElementById("chatMessages");
    const chatWithName = document.getElementById("chatWithName");
    const chatWithDept = document.getElementById("chatWithDept");
    const chatInput = document.getElementById("chatInput");
    const chatSendBtn = document.getElementById("chatSendBtn");

    if (!chatMessages) return;

    function renderMessages(name) {
        chatMessages.innerHTML = "";
        const messages = conversations[name] || [];
        messages.forEach((msg, i) => {
            const bubble = document.createElement("div");
            bubble.className = i % 2 === 0 ? "msg received" : "msg sent";
            bubble.innerText = msg;
            chatMessages.appendChild(bubble);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    contacts.forEach(contact => {
        contact.addEventListener("click", () => {
            contacts.forEach(c => c.classList.remove("active"));
            contact.classList.add("active");

            activeContact = contact.dataset.name;
            if (chatWithName) chatWithName.innerText = activeContact;
            if (chatWithDept) chatWithDept.innerText = contact.dataset.dept;

            renderMessages(activeContact);
        });
    });

    function sendChatMessage() {
        if (!chatInput) return;
        const text = chatInput.value.trim();
        if (!text) return;

        if (!conversations[activeContact]) conversations[activeContact] = [];
        conversations[activeContact].push(text);
        renderMessages(activeContact);
        chatInput.value = "";
    }

    if (chatSendBtn) chatSendBtn.addEventListener("click", sendChatMessage);
    if (chatInput) {
        chatInput.addEventListener("keyup", (e) => {
            if (e.key === "Enter") sendChatMessage();
        });
    }

    renderMessages(activeContact);
}

function logout() {
    localStorage.clear();
    window.location.href = "/";
}