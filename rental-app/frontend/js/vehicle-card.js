// Renders one vehicle as a card. Shared by index.html (preview) and
// fleet.html (full listing) so the two never drift out of sync.
function vehicleCardHtml(vehicle) {
  const photo = vehicle.photoUrl
    ? `<div class="vehicle-photo" style="background-image:url('${vehicle.photoUrl}')"></div>`
    : `<div class="vehicle-photo">No photo yet</div>`;

  const availability = vehicle.available
    ? `<span class="badge badge-available">Available</span>`
    : `<span class="badge badge-unavailable">Not available</span>`;

  const waMessage = encodeURIComponent(
    `Hi ${SITE_CONFIG.BRAND_NAME}, I'd like to enquire about renting the ${vehicle.name} (\u20b9${vehicle.pricePerDay}/day). Could you let me know availability?`
  );
  const waHref = `https://wa.me/${SITE_CONFIG.WHATSAPP_NUMBER}?text=${waMessage}`;

  return `
    <article class="vehicle-card">
      ${photo}
      <div class="vehicle-body">
        <div class="vehicle-name-row">
          <div>
            <h3>${escapeHtml(vehicle.name)}</h3>
            ${availability}
          </div>
          <div class="price-plate mono">
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
        <p>${escapeHtml(vehicle.description || "")}</p>
        <div class="vehicle-card-actions">
          <a href="car.html?id=${encodeURIComponent(vehicle.id)}" class="btn btn-outline">View details</a>
          <a href="${waHref}" target="_blank" rel="noopener" class="btn btn-teal">WhatsApp</a>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function emptyStateHtml(message) {
  return `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <h3>Nothing to show here yet</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}
