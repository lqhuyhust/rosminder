function showNotification(title) {
    chrome.notifications.create(null, {
        type: "basic",
        iconUrl: "icon.png",
        title: "Rosminder",
        message: title,
    });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
    const { tasks = [] } = await chrome.storage.local.get("tasks");
    const task = tasks.find((t) => t.id === alarm.name);

    if (!task || !task.active) return;
    
    if (task.type === "ONE_TIME") {
        showNotification(task.title);

        task.active = false;
        chrome.alarms.clear(alarm.name);

        await chrome.storage.local.set({ tasks });
    }
})

chrome.alarms.create("daily_checker", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== "daily_checker") return;

    const now = new Date();
    const hhmm = now.toTimeString().slice(0, 5);
    const today = now.toISOString().slice(0, 10);
    const day = now.getDay();

    const { tasks = [] } = await chrome.storage.local.get("tasks");

    let updated = false;

    tasks.forEach(task => {
        if (
            task.type === "DAILY" &&
            task.active &&
            task.time === hhmm &&
            task.daysOfWeek.includes(day) &&
            task.lastTriggered !== today
        ) {
            showNotification(task.title);

            task.lastTriggered = today;
            updated = true;
        }
    })
})