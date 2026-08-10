function getVehicleIdFromUrl() {
  return new URLSearchParams(window.location.search).get("id");
}

function renderVehicleDetail(vehicle) {
  const photo = vehicle.photoUrl
    ? `<div class="vehicle-photo" style="aspect-ratio: 4/3; background-image:url('${vehicle.photoUrl}')"></div>`
    : `<div class="vehicle-photo" style="aspect-ratio: 4/3;">No photo yet</div>`;

  const availability = vehicle.available
    ? `<span class="badge badge-available">Available</span>`
    : `<span class="badge badge-unavailable">Not available right now</span>`;

  const enquirySection = vehicle.available
    ? `
      <div class="form-card">
        <h3 class="mt-0">Interested in this vehicle?</h3>
        <p>Message us on WhatsApp with your preferred dates and we'll get back to you quickly to confirm availability and arrange pickup.</p>
        <div class="form-card" style="background: var(--cream-dim); box-shadow:none; padding:14px 18px; margin-bottom:18px;">
          <div class="spread"><span>Price</span><span class="price-plate mono">&#8377;${vehicle.pricePerDay}<small>per day</small></span></div>
        </div>
        <a id="enquireWhatsapp" href="#" target="_blank" rel="noopener" class="btn btn-teal btn-block">Enquire on WhatsApp</a>
        <p class="form-note" style="margin-top:14px;">Prefer to call? <span id="enquirePhone" class="mono"></span></p>
      </div>
    `
    : `
      <div class="form-card">
        <h3 class="mt-0">Not available right now</h3>
        <p>This vehicle isn't available at the moment. Check the <a href="fleet.html">fleet page</a> for others that are free.</p>
      </div>
    `;

  return `
    <div class="vehicle-detail-grid" style="display:grid; grid-template-columns: 1.1fr 1fr; gap:36px; align-items:start;">
      <div>
        ${photo}
        <div class="stack" style="margin-top:20px;">
          <div class="vehicle-name-row">
            <div>
              <h2 style="margin-bottom:8px;">${escapeHtml(vehicle.name)}</h2>
              ${availability}
            </div>
            <div class="price-plate mono" style="font-size:1.1rem;">
              &#8377;${vehicle.pricePerDay}
              <small>per day</small>
            </div>
          </div>
          <div class="vehicle-meta">
            <span>${escapeHtml(vehicle.type)}</span>
            <span>${vehicle.seats} seats</span>
            <span>${escapeHtml(vehicle.transmission)}</span>
            <span>${escapeHtml(vehicle.fuel)}</span>
          </div>
          <p>${escapeHtml(vehicle.description || "No additional description provided.")}</p>
        </div>
      </div>
      <div>${enquirySection}</div>
    </div>
    <style>
      @media (max-width: 820px) {
        .vehicle-detail-grid { grid-template-columns: 1fr !important; }
      }
    </style>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("vehicleDetail");
  const vehicleId = getVehicleIdFromUrl();

  if (!vehicleId) {
    container.innerHTML = emptyStateHtml("No vehicle was specified. Please go back to the fleet page and pick one.");
    return;
  }

  let vehicle;
  try {
    vehicle = await api.get(`/vehicles/${encodeURIComponent(vehicleId)}`);
  } catch (err) {
    container.innerHTML = emptyStateHtml("This vehicle could not be found. It may have been removed.");
    return;
  }

  container.innerHTML = renderVehicleDetail(vehicle);
  document.title = `${vehicle.name} - ${SITE_CONFIG.BRAND_NAME}`;

  const whatsappBtn = document.getElementById("enquireWhatsapp");
  if (whatsappBtn) {
    const message = encodeURIComponent(
      `Hi ${SITE_CONFIG.BRAND_NAME}, I'd like to enquire about renting the ${vehicle.name} (₹${vehicle.pricePerDay}/day). Could you let me know availability?`
    );
    whatsappBtn.href = `https://wa.me/${SITE_CONFIG.WHATSAPP_NUMBER}?text=${message}`;
  }

  const phoneEl = document.getElementById("enquirePhone");
  if (phoneEl) phoneEl.textContent = SITE_CONFIG.PHONE_DISPLAY;
});
