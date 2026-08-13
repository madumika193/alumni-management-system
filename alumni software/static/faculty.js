document.addEventListener("DOMContentLoaded", () => {
    // 1. Retrieve Logged-in Faculty Credentials from LocalStorage
    const userName = localStorage.getItem("userName") || "Faculty";
    const userDept = localStorage.getItem("userDept") || "CSE";

    const userNameElement = document.getElementById("userName");
    if (userNameElement) userNameElement.innerText = userName;

    // 2. Setup Department Selection Handlers
    const deptCards = document.querySelectorAll(".dept-card");
    deptCards.forEach(card => {
        const dept = card.getAttribute("data-dept");

        // Set active class on faculty's own department card
        if (dept === userDept) {
            deptCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            
            const titleElem = document.getElementById("deptAlumniTitle");
            if (titleElem) titleElem.innerText = userDept;
        }

        card.addEventListener("click", () => {
            deptCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");

            const titleElem = document.getElementById("deptAlumniTitle");
            if (titleElem) titleElem.innerText = dept;

            loadFacultyAlumniList(dept);

            const section = document.getElementById("deptAlumni");
            if (section) section.scrollIntoView({ behavior: "smooth" });
        });
    });

    // 3. Initial load for the logged-in faculty's department
    loadFacultyAlumniList(userDept);

    // 4. Setup Department Event Creation Handler
    setupEventForm(userDept, userName);
});

// Fetch and display alumni filtered by department
async function loadFacultyAlumniList(dept) {
    const container = document.getElementById("deptAlumniList");
    if (!container) return;

    try {
        const response = await fetch(`/api/alumni?dept=${encodeURIComponent(dept)}`);
        const data = await response.json();

        if (data.success && data.alumni.length > 0) {
            container.innerHTML = data.alumni.map(alumnus => `
                <div class="person">
                    <h3>${alumnus.name}</h3>
                    <p>${alumnus.designation || 'Alumni'} ${alumnus.company ? '· ' + alumnus.company : ''} · Batch ${alumnus.batch}</p>
                    <p><small>${alumnus.email}</small></p>
                    <button onclick="contactAlumni('${alumnus.email}')">Contact</button>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">No alumni registered under the ${dept} department yet.</p>`;
        }
    } catch (err) {
        console.error("Error loading department alumni:", err);
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Failed to load alumni data.</p>`;
    }
}

// Handle posting a new event to the backend database
function setupEventForm(facultyDept, facultyName) {
    const postEventBtn = document.getElementById("postEventBtn");
    if (!postEventBtn) return;

    postEventBtn.addEventListener("click", async () => {
        const titleInput = document.getElementById("eventTitle");
        const dateInput = document.getElementById("eventDate");
        const locationInput = document.getElementById("eventLocation");
        const noteElem = document.getElementById("eventNote");

        const title = titleInput ? titleInput.value.trim() : "";
        const event_date = dateInput ? dateInput.value : "";
        const location = locationInput ? locationInput.value.trim() : "";

        if (!title || !event_date || !location) {
            alert("Please fill in all event details (Title, Date, Location).");
            return;
        }

        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title,
                    dept: facultyDept,
                    event_date: event_date,
                    location: location,
                    created_by: facultyName
                })
            });

            const result = await response.json();

            if (result.success) {
                if (noteElem) {
                    noteElem.innerText = "Event published successfully!";
                    noteElem.style.color = "green";
                }
                // Clear input fields
                titleInput.value = "";
                dateInput.value = "";
                locationInput.value = "";

                setTimeout(() => { if (noteElem) noteElem.innerText = ""; }, 3000);
            } else {
                alert(result.message || "Failed to publish event.");
            }
        } catch (err) {
            console.error("Error publishing event:", err);
            alert("An error occurred while posting the event.");
        }
    });
}

function contactAlumni(email) {
    alert(`Initiating email contact with ${email}`);
}

function logout() {
    localStorage.clear();
    window.location.href = "/";
}