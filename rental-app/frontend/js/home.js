document.addEventListener("DOMContentLoaded", async () => {
  const whatsappCta = document.getElementById("whatsappCta");
  if (whatsappCta) {
    const message = encodeURIComponent(`Hi ${SITE_CONFIG.BRAND_NAME}, I'd like to ask about renting a car.`);
    whatsappCta.href = `https://wa.me/${SITE_CONFIG.WHATSAPP_NUMBER}?text=${message}`;
  }

  const previewGrid = document.getElementById("previewGrid");
  const statVehicleCount = document.getElementById("statVehicleCount");

  try {
    const vehicles = await api.get("/vehicles?available=true");

    if (statVehicleCount) statVehicleCount.textContent = vehicles.length;

    if (!previewGrid) return;

    if (vehicles.length === 0) {
      previewGrid.innerHTML = emptyStateHtml("No vehicles are listed as available right now. Please check back soon.");
      return;
    }

    previewGrid.innerHTML = vehicles.slice(0, 3).map(vehicleCardHtml).join("");
  } catch (err) {
    if (previewGrid) {
      previewGrid.innerHTML = emptyStateHtml("Couldn't load the fleet right now. Please refresh the page.");
    }
  }
});
