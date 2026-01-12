document.getElementById("task-create").onclick = async () => {
    const title = document.getElementById("title").value;
    const type = document.getElementById("type").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    if (!title || (type === "ONE_TIME") && !date) {
        alert("Missing fields");
        return;
    };

    const daysOfWeek = [...document.querySelectorAll("#days input:checked")]
        .map(cb => Number(cb.value));

    const task = {
        id: crypto.randomUUID(),
        title,
        type,
        date,
        time,
        daysOfWeek,
        active: true
    };
    console.log("Creating task", task);

    const { tasks = [] } = await chrome.storage.local.get("tasks");
    tasks.push(task);
    await chrome.storage.local.set({ tasks });
    console.log("Task saved");
    
    if (type === "ONE_TIME") {
        const when = new Date(`${date}T${time}`).getTime();
        console.log("Creating ONE_TIME alarm at:", new Date(when));

        if (when > Date.now()) {
            chrome.alarms.create(task.id, { when });
        } else {
            alert("Time must be in the future");
        }
    }

    window.close();
}