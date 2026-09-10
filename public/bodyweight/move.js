const status = document.getElementById("status");
document.getElementById("export").addEventListener("click", () => {
  try {
    const raw = localStorage.getItem("away-strength:state:v1");
    if (!raw) {
      status.textContent = "No Away Strength backup is stored in this browser. If you logged in an installed app, export from that installation.";
      return;
    }
    const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `away-strength-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "Backup downloaded. Import it in the new app’s Sync tab before logging there.";
  } catch {
    status.textContent = "The backup could not be downloaded. Keep this installation until you have recovered its workouts.";
  }
});
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
