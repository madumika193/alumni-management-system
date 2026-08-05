// ===============================
// MOCK ALUMNI DATA BY DEPARTMENT
// ===============================

const alumniByDept = {
    CSE: [
        { name: "Aravind", info: "SDE II · Zoho · Batch 2019" },
        { name: "Rahul", info: "Data Scientist · Microsoft · Batch 2020" },
        { name: "Meena", info: "Founder · Startup · Batch 2015" }
    ],
    IT: [
        { name: "Priya", info: "Product Manager · Google · Batch 2018" },
        { name: "Kishore", info: "DevOps Lead · Amazon · Batch 2019" }
    ],
    ECE: [
        { name: "Sneha", info: "UX Designer · Adobe · Batch 2017" },
        { name: "Vignesh", info: "VLSI Engineer · Intel · Batch 2016" }
    ],
    EEE: [
        { name: "Arjun", info: "Power Systems Engineer · Siemens · Batch 2018" }
    ],
    Mechanical: [
        { name: "Suresh", info: "Design Engineer · Tata Motors · Batch 2017" }
    ],
    Civil: [
        { name: "Lakshmi", info: "Site Engineer · L&T · Batch 2019" }
    ]
};

const deptCards = document.querySelectorAll(".dept-card");
const deptAlumniList = document.getElementById("deptAlumniList");
const deptAlumniTitle = document.getElementById("deptAlumniTitle");

function renderDeptAlumni(dept) {
    deptAlumniTitle.innerText = dept;
    deptAlumniList.innerHTML = "";

    const alumni = alumniByDept[dept] || [];

    if (alumni.length === 0) {
        deptAlumniList.innerHTML = "<p>No alumni records found for this department yet.</p>";
        return;
    }

    alumni.forEach(function (person) {
        const card = document.createElement("div");
        card.className = "person";
        card.innerHTML =
            "<h3>" + person.name + "</h3>" +
            "<p>" + person.info + "</p>" +
            "<button>Contact</button>";
        deptAlumniList.appendChild(card);
    });
}

deptCards.forEach(function (card) {
    card.addEventListener("click", function () {
        deptCards.forEach(function (c) { c.classList.remove("active"); });
        card.classList.add("active");
        renderDeptAlumni(card.dataset.dept);

        document.getElementById("deptAlumni").scrollIntoView({ behavior: "smooth" });
    });
});

renderDeptAlumni("CSE");