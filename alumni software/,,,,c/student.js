// ===============================
// DIRECTORY SEARCH
// ===============================

const search = document.querySelector("#directory input");

if (search) {
    search.addEventListener("keyup", function () {
        const value = search.value.toLowerCase();
        document.querySelectorAll(".person").forEach(function (card) {
            card.style.display = card.innerText.toLowerCase().includes(value) ? "block" : "none";
        });
    });
}

document.querySelectorAll(".person button").forEach(function (btn) {
    btn.addEventListener("click", function () {
        btn.innerHTML = "Requested";
        btn.disabled = true;
    });
});

// ===============================
// EVENT REGISTER
// ===============================

document.querySelectorAll(".event button").forEach(function (btn) {
    btn.addEventListener("click", function () {
        btn.innerHTML = "Registered";
        btn.style.background = "green";
    });
});

// ===============================
// POST LIKES
// ===============================

document.querySelectorAll(".like-btn").forEach(function (btn) {
    let liked = false;
    btn.addEventListener("click", function () {
        liked = !liked;
        btn.innerHTML = liked ? "👍 Liked" : "👍 Like";
        btn.style.color = liked ? "#002147" : "";
    });
});

document.querySelectorAll(".comment-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
        const comment = prompt("Write a comment:");
        if (comment) {
            alert("Comment posted: " + comment);
        }
    });
});

// ===============================
// CAMPUS CHAT (mock, in-memory)
// ===============================

const conversations = {
    Karthik: ["Hey! Are you attending the AI workshop?", "Yes, saving a seat for you too."],
    Divya: ["Did you get the alumni meet schedule?", "Yes, it's on the events tab."],
    Mohan: ["Need notes for tomorrow's class?", "Sure, sending them tonight."]
};

const contacts = document.querySelectorAll(".chat-contact");
const chatMessages = document.getElementById("chatMessages");
const chatWithName = document.getElementById("chatWithName");
const chatWithDept = document.getElementById("chatWithDept");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");

let activeContact = "Karthik";

function renderMessages(name) {
    chatMessages.innerHTML = "";
    const messages = conversations[name] || [];
    messages.forEach(function (msg, i) {
        const bubble = document.createElement("div");
        bubble.className = i % 2 === 0 ? "msg received" : "msg sent";
        bubble.innerText = msg;
        chatMessages.appendChild(bubble);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

contacts.forEach(function (contact) {
    contact.addEventListener("click", function () {
        contacts.forEach(function (c) { c.classList.remove("active"); });
        contact.classList.add("active");

        activeContact = contact.dataset.name;
        chatWithName.innerText = activeContact;
        chatWithDept.innerText = contact.dataset.dept;

        renderMessages(activeContact);
    });
});

function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    if (!conversations[activeContact]) {
        conversations[activeContact] = [];
    }
    conversations[activeContact].push(text);
    renderMessages(activeContact);
    chatInput.value = "";
}

if (chatSendBtn) {
    chatSendBtn.addEventListener("click", sendChatMessage);
}

if (chatInput) {
    chatInput.addEventListener("keyup", function (e) {
        if (e.key === "Enter") sendChatMessage();
    });
}

renderMessages(activeContact);