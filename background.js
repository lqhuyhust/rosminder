console.log("🚀 Background service worker loaded");

function showNotification(title) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "Rosminder",
    message: title,
  });
}

// keep service worker alive
chrome.alarms.create("daily_checker", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log("⏰ Alarm fired:", alarm.name);

  const { tasks = [] } = await chrome.storage.local.get("tasks");

  // DAILY checker
  if (alarm.name === "daily_checker") {
    const now = new Date();
    const hhmm = now.toTimeString().slice(0, 5);
    const today = now.toISOString().slice(0, 10);
    const day = now.getDay();

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
    });

    if (updated) {
      await chrome.storage.local.set({ tasks });
    }

    return;
  }

  // ONE_TIME
  const task = tasks.find(t => t.id === alarm.name);
  if (!task || !task.active) return;

  if (task.type === "ONE_TIME") {
    showNotification(task.title);
    task.active = false;

    await chrome.storage.local.set({ tasks });
    chrome.alarms.clear(alarm.name);
  }
});
