document.addEventListener("DOMContentLoaded", async () => {
  const fleetGrid = document.getElementById("fleetGrid");
  const resultsCount = document.getElementById("resultsCount");
  const toggle = document.getElementById("availableOnlyToggle");

  let allVehicles = [];

  function render() {
    const vehicles = toggle.checked ? allVehicles.filter((v) => v.available) : allVehicles;

    resultsCount.textContent =
      vehicles.length === 0
        ? "No vehicles match this filter."
        : `Showing ${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"}.`;

    fleetGrid.innerHTML =
      vehicles.length === 0
        ? emptyStateHtml("Try unchecking \u201cShow available vehicles only\u201d to see the full fleet.")
        : vehicles.map(vehicleCardHtml).join("");
  }

  toggle.addEventListener("change", render);

  try {
    allVehicles = await api.get("/vehicles");
    render();
  } catch (err) {
    fleetGrid.innerHTML = emptyStateHtml("Couldn't load the fleet right now. Please refresh the page.");
    resultsCount.textContent = "";
  }
});
