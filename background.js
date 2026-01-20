console.log("🚀 Background service worker loaded");

function showNotification(title) {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Rosminder",
        message: title,
    });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log("⏰ Alarm fired:", alarm.name);

    const { tasks = [] } = await chrome.storage.local.get("tasks");
    const task = tasks.find(t => t.id === alarm.name);

    if (!task || !task.active) return;

    showNotification(task.title);

    if (task.type === "ONE_TIME") {
        task.active = false;
        await chrome.storage.local.set({ tasks });
        chrome.alarms.clear(task.id);
        return;
    }

    // DAILY → define next trigger
    if (task.type === "DAILY") {
        const next = getNextTrigger(
        task.type,
        task.time,
        task.daysOfWeek
        );

        if (!next) return;

        task.nextTriggerAt = next.getTime();

        await chrome.storage.local.set({ tasks });
        chrome.alarms.create(task.id, { when: task.nextTriggerAt });
    }
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