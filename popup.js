// ================== VIEW TOGGLE ==================
const listView = document.getElementById("list-view");
const formView = document.getElementById("form-view");

function showList() {
    listView.style.display = "block";
    formView.style.display = "none";
    loadTasks();
}

function showForm() {
    listView.style.display = "none";
    formView.style.display = "block";
}

// ================== LOAD TASKS ==================
async function loadTasks() {
    const list = document.getElementById("task-list");
    list.innerHTML = "";

    const { tasks = [] } = await chrome.storage.local.get("tasks");

    if (tasks.length === 0) {
        list.innerHTML = `
        <li class="empty">
            No reminders yet<br/>
            <small>Create your first one!</small>
        </li>
        `;
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement("li");

        li.innerHTML = `
        <strong>${task.title}</strong><br/>
        <small>
            ${task.type === "DAILY"
            ? `Daily at ${task.time}`
            : `Once at ${new Date(task.nextTriggerAt).toLocaleString()}`
            }
        </small>
        <div class="actions">
            <button class="delete" data-id="${task.id}">Delete</button>
        </div>
        `;

        list.appendChild(li);
    });
}

// ================== CREATE TASK ==================
document.getElementById("task-create").onclick = async () => {
    const title = document.getElementById("title").value.trim();
    const type = document.getElementById("type").value;
    const time = document.getElementById("time").value;

    if (!title || !time) {
        alert("Missing title or time");
        return;
    }

    const daysOfWeek = [...document.querySelectorAll("#days input:checked")]
        .map(cb => Number(cb.value));

    if (type === "DAILY" && daysOfWeek.length === 0) {
        alert("Please select at least one day");
        return;
    }

    const next = getNextTrigger(type, time, daysOfWeek);

    if (!next) {
        alert("Cannot calculate next reminder time");
        return;
    }

    console.log("Next trigger:", next.toString());

    const task = {
        id: crypto.randomUUID(),
        title,
        type,
        time,
        daysOfWeek,
        active: true,
        nextTriggerAt: next.getTime()
    };

    const { tasks = [] } = await chrome.storage.local.get("tasks");
    tasks.push(task);
    await chrome.storage.local.set({ tasks });

    chrome.alarms.create(task.id, { when: task.nextTriggerAt });

    clearForm();
    showList();
};

// ================== DELETE TASK ==================
document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("delete")) return;

    const id = e.target.dataset.id;

    let { tasks = [] } = await chrome.storage.local.get("tasks");
    tasks = tasks.filter(t => t.id !== id);

    await chrome.storage.local.set({ tasks });
    chrome.alarms.clear(id);

    loadTasks();
});

// ================== FORM ==================
document.getElementById("open-create").onclick = () => {
    clearForm();
    showForm();
};

document.getElementById("back-btn").onclick = showList;

function clearForm() {
    document.getElementById("title").value = "";
    document.getElementById("time").value = "";
    document.querySelectorAll("#days input").forEach(cb => cb.checked = false);
    updateNextTriggerNote();
}

// ================== TYPE / DAYS ==================
const typeSelect = document.getElementById("type");
const daysContainer = document.getElementById("days");

function toggleDays() {
    daysContainer.style.display =
        typeSelect.value === "DAILY" ? "grid" : "none";
}

typeSelect.addEventListener("change", () => {
    toggleDays();
    updateNextTriggerNote();
    });

// ================== TIME LOGIC ==================
function getNextTrigger(type, time, daysOfWeek = []) {
    const now = new Date();
    const [hh, mm] = time.split(":").map(Number);

    if (type === "ONE_TIME") {
        const target = new Date();
        target.setHours(hh, mm, 0, 0);
        if (target <= now) target.setDate(target.getDate() + 1);
        return target;
    }

    for (let i = 0; i < 7; i++) {
        const candidate = new Date();
        candidate.setDate(now.getDate() + i);
        candidate.setHours(hh, mm, 0, 0);

        if (
        daysOfWeek.includes(candidate.getDay()) &&
        candidate > now
        ) {
        return candidate;
        }
    }

    return null;
}

// ================== NEXT TRIGGER NOTE ==================
function updateNextTriggerNote() {
    const time = document.getElementById("time").value;
    if (!time) return;

    const type = typeSelect.value;
    const days = [...document.querySelectorAll("#days input:checked")]
        .map(cb => Number(cb.value));

    if (type === "DAILY" && days.length === 0) {
        document.getElementById("next-trigger").textContent =
        "Select at least one day";
        return;
    }

    const next = getNextTrigger(type, time, days);
    if (!next) return;

    document.getElementById("next-trigger").textContent =
        "Next reminder: " +
        next.toLocaleString(undefined, {
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit"
        });
}

// ================== INIT ==================
document.getElementById("time")
    .addEventListener("change", updateNextTriggerNote);

document.querySelectorAll("#days input")
    .forEach(cb => cb.addEventListener("change", updateNextTriggerNote));

document.addEventListener("DOMContentLoaded", () => {
    toggleDays();
    showList();
});
