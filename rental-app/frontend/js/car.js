function getVehicleIdFromUrl() {
  return new URLSearchParams(window.location.search).get("id");
}

function daysBetween(start, end) {
  const ms = new Date(end) - new Date(start);
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function renderVehicleDetail(vehicle) {
  const photo = vehicle.photoUrl
    ? `<div class="vehicle-photo" style="aspect-ratio: 4/3; background-image:url('${vehicle.photoUrl}')"></div>`
    : `<div class="vehicle-photo" style="aspect-ratio: 4/3;">No photo yet</div>`;

  const availability = vehicle.available
    ? `<span class="badge badge-available">Available</span>`
    : `<span class="badge badge-unavailable">Not available right now</span>`;

  const actionSection = vehicle.available
    ? `
      <div class="form-card">
        <h3 class="mt-0">Interested in this vehicle?</h3>
        <div class="form-card" style="background: var(--cream-dim); box-shadow:none; padding:14px 18px; margin-bottom:18px;">
          <div class="spread"><span>Price</span><span class="price-plate mono">&#8377;${vehicle.pricePerDay}<small>per day</small></span></div>
        </div>
        <button id="showBookingBtn" type="button" class="btn btn-primary btn-block" style="margin-bottom:10px;">Book Now</button>
        <a id="enquireWhatsapp" href="#" target="_blank" rel="noopener" class="btn btn-teal btn-block">Enquire on WhatsApp</a>
        <p class="form-note" style="margin-top:14px;">Prefer to call? <span id="enquirePhone" class="mono"></span></p>
      </div>

      <div id="bookingPanel" class="form-card" style="display:none; margin-top:20px;">
        <h3 class="mt-0">Pick your pickup date</h3>
        <div id="bookingError"></div>
        <div id="calendarMount"></div>

        <div class="field" style="margin-top:16px;">
          <label for="bk_days">Number of days</label>
          <input type="number" id="bk_days" min="1" step="1" disabled placeholder="Pick a date above first" />
          <p id="daysHint" class="form-note" style="margin-top:6px;"></p>
        </div>

        <p id="selectionSummary" class="form-note" style="margin:16px 0;"></p>

        <div class="field">
          <label for="bk_name">Your name</label>
          <input type="text" id="bk_name" required autocomplete="name" />
        </div>
        <div class="field">
          <label for="bk_phone">Phone number</label>
          <input type="tel" id="bk_phone" required autocomplete="tel" placeholder="10-digit mobile number" />
        </div>

        <label style="display:block; font-size:0.85rem; font-weight:600; margin-bottom:6px;">Payment method</label>
        <div class="payment-method-choice">
          <label class="payment-method-option active" data-method="upi">
            <input type="radio" name="paymentMethod" value="upi" checked />
            Pay by UPI
          </label>
          <label class="payment-method-option" data-method="cash">
            <input type="radio" name="paymentMethod" value="cash" />
            Pay by Cash
          </label>
        </div>

        <button id="bookingSubmit" type="button" class="btn btn-primary btn-block" disabled>Select dates to continue</button>
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
      <div>${actionSection}</div>
    </div>
    <style>
      @media (max-width: 820px) {
        .vehicle-detail-grid { grid-template-columns: 1fr !important; }
      }
    </style>
  `;
}

function renderUpiPaymentStep({ booking, upiLink }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;

  return `
    <div class="form-card" style="max-width: 560px; margin: 0 auto;">
      <p class="form-success">Booking created &mdash; one step left.</p>
      <h3 class="mt-0">Complete payment to confirm</h3>

      <div class="stack" style="margin-bottom:20px;">
        <div class="spread"><span>Vehicle</span><strong>${escapeHtml(booking.vehicleName)}</strong></div>
        <div class="spread"><span>Dates</span><strong>${booking.startDate} &rarr; ${booking.endDate}</strong></div>
        <div class="spread"><span>Duration</span><strong>${booking.days} day(s)</strong></div>
        <div class="spread"><span>Booking reference</span><strong class="mono">${booking.id}</strong></div>
        <div class="spread"><span>Amount due</span><span class="price-plate mono">&#8377;${booking.totalAmount}</span></div>
      </div>

      <div class="center" style="margin-bottom: 20px;">
        <img src="${qrSrc}" alt="UPI payment QR code" width="220" height="220" style="border-radius: var(--radius-sm); border: 1px solid #ddd6c4;" />
        <p class="form-note" style="margin-top:8px;">Scan with any UPI app, or tap below on mobile.</p>
      </div>

      <a href="${upiLink}" class="btn btn-primary btn-block" style="margin-bottom:10px;">Pay &#8377;${booking.totalAmount} via UPI</a>
      <a href="booking-status.html?ref=${encodeURIComponent(booking.id)}" class="btn btn-outline btn-block">Check booking status</a>

      <p class="form-note" style="margin-top:16px;">
        Keep your booking reference (<strong class="mono">${booking.id}</strong>) handy &mdash;
        we'll confirm your booking once payment is verified.
      </p>
    </div>
  `;
}

function renderCashConfirmStep(booking) {
  return `
    <div class="form-card" style="max-width: 560px; margin: 0 auto;">
      <p class="form-success">Booking created.</p>
      <h3 class="mt-0">Verifying payment</h3>
      <p>Pay <strong>&#8377;${booking.totalAmount}</strong> in cash at pickup. Your booking is being held for these dates,
      and we'll confirm it once payment is received.</p>

      <div class="stack" style="margin: 20px 0;">
        <div class="spread"><span>Vehicle</span><strong>${escapeHtml(booking.vehicleName)}</strong></div>
        <div class="spread"><span>Dates</span><strong>${booking.startDate} &rarr; ${booking.endDate}</strong></div>
        <div class="spread"><span>Duration</span><strong>${booking.days} day(s)</strong></div>
        <div class="spread"><span>Booking reference</span><strong class="mono">${booking.id}</strong></div>
        <div class="spread"><span>Amount due at pickup</span><span class="price-plate mono">&#8377;${booking.totalAmount}</span></div>
      </div>

      <a href="booking-status.html?ref=${encodeURIComponent(booking.id)}" class="btn btn-primary btn-block">Check booking status</a>

      <p class="form-note" style="margin-top:16px;">
        Keep your booking reference (<strong class="mono">${booking.id}</strong>) handy to check its status anytime.
      </p>
    </div>
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
      `Hi ${SITE_CONFIG.BRAND_NAME}, I'd like to enquire about renting the ${vehicle.name} (\u20b9${vehicle.pricePerDay}/day). Could you let me know availability?`
    );
    whatsappBtn.href = `https://wa.me/${SITE_CONFIG.WHATSAPP_NUMBER}?text=${message}`;
  }

  const phoneEl = document.getElementById("enquirePhone");
  if (phoneEl) phoneEl.textContent = SITE_CONFIG.PHONE_DISPLAY;

  if (!vehicle.available) return; // no booking panel exists for unavailable vehicles

  setupBookingPanel(vehicle);
});

function setupBookingPanel(vehicle) {
  const showBtn = document.getElementById("showBookingBtn");
  const panel = document.getElementById("bookingPanel");
  const calendarMount = document.getElementById("calendarMount");
  const daysInput = document.getElementById("bk_days");
  const daysHint = document.getElementById("daysHint");
  const summaryEl = document.getElementById("selectionSummary");
  const submitBtn = document.getElementById("bookingSubmit");
  const errorBox = document.getElementById("bookingError");

  let pickupDate = null; // ISO string
  let blockedDates = new Set();
  let calendar = null;
  let selectedMethod = "upi";

  showBtn.addEventListener("click", async () => {
    const isOpening = panel.style.display === "none";
    panel.style.display = isOpening ? "block" : "none";
    if (isOpening) {
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      if (!calendar) await initCalendar();
    }
  });

  async function initCalendar() {
    calendarMount.innerHTML = `<p class="form-note">Loading availability\u2026</p>`;
    let blockedRanges = [];
    try {
      blockedRanges = await api.get(`/vehicles/${encodeURIComponent(vehicle.id)}/booked-dates`);
    } catch {
      // If this fails, fall back to an empty calendar rather than blocking
      // booking entirely -- the backend still enforces overlaps server-side.
    }
    calendarMount.innerHTML = "";
    calendar = createBookingCalendar({
      container: calendarMount,
      blockedRanges,
      mode: "single",
      onChange: handlePickupChange,
    });
    blockedDates = calendar.getBlockedDates();
  }

  function handlePickupChange(sel) {
    pickupDate = sel.startDate;
    daysInput.value = "";
    updateSummary();

    if (!pickupDate) {
      daysInput.disabled = true;
      daysInput.placeholder = "Pick a date above first";
      daysHint.textContent = "";
      return;
    }

    const maxDays = maxConsecutiveDays(pickupDate, blockedDates);
    daysInput.disabled = false;
    daysInput.max = maxDays;
    daysInput.placeholder = "e.g. 3";

    if (maxDays === 0) {
      daysHint.textContent = "That date is booked the very next day too -- please choose a different pickup date.";
      daysInput.disabled = true;
    } else {
      daysHint.textContent = `Up to ${maxDays} day(s) available from this date before the next booking.`;
    }
  }

  daysInput.addEventListener("input", updateSummary);

  function updateSummary() {
    const days = Number(daysInput.value);

    if (!pickupDate) {
      summaryEl.textContent = "Select a pickup date on the calendar above.";
      submitBtn.disabled = true;
      submitBtn.textContent = "Select dates to continue";
      return;
    }

    if (!days || days < 1) {
      summaryEl.textContent = "Enter how many days you'd like to rent for.";
      submitBtn.disabled = true;
      submitBtn.textContent = "Select dates to continue";
      return;
    }

    const maxDays = maxConsecutiveDays(pickupDate, blockedDates);
    if (days > maxDays) {
      summaryEl.innerHTML = `<span style="color:var(--rust);">Only ${maxDays} day(s) available from this date.</span>`;
      submitBtn.disabled = true;
      submitBtn.textContent = "Select dates to continue";
      return;
    }

    const endDate = addDays(pickupDate, days);
    const total = days * vehicle.pricePerDay;
    summaryEl.innerHTML = `${pickupDate} &rarr; ${endDate} &middot; ${days} day(s) &middot; <strong>&#8377;${total}</strong>`;
    submitBtn.disabled = false;
    submitBtn.textContent = `Confirm booking \u2014 \u20b9${total}`;
  }

  document.querySelectorAll(".payment-method-option").forEach((label) => {
    label.addEventListener("click", () => {
      document.querySelectorAll(".payment-method-option").forEach((l) => l.classList.remove("active"));
      label.classList.add("active");
      selectedMethod = label.dataset.method;
      label.querySelector("input").checked = true;
    });
  });

  submitBtn.addEventListener("click", async () => {
    errorBox.innerHTML = "";

    const customerName = document.getElementById("bk_name").value.trim();
    const phone = document.getElementById("bk_phone").value.trim();
    const days = Number(daysInput.value);

    if (!customerName || !phone) {
      errorBox.innerHTML = `<p class="form-error">Please enter your name and phone number.</p>`;
      return;
    }
    if (!pickupDate || !days || days < 1) {
      errorBox.innerHTML = `<p class="form-error">Please select a pickup date and number of days.</p>`;
      return;
    }

    const endDate = addDays(pickupDate, days);

    submitBtn.disabled = true;
    submitBtn.textContent = "Booking\u2026";

    try {
      const result = await api.post("/bookings", {
        vehicleId: vehicle.id,
        customerName,
        phone,
        startDate: pickupDate,
        endDate,
        paymentMethod: selectedMethod,
      });

      const container = document.getElementById("vehicleDetail");
      container.innerHTML =
        selectedMethod === "cash" ? renderCashConfirmStep(result.booking) : renderUpiPaymentStep(result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      errorBox.innerHTML = `<p class="form-error">${escapeHtml(err.message)}</p>`;
      submitBtn.disabled = false;
      submitBtn.textContent = "Try again";

      // If the dates were just taken by someone else, refresh the calendar
      // so the customer sees up-to-date availability immediately.
      if (err.message && err.message.toLowerCase().includes("booked by someone else")) {
        await initCalendar();
        pickupDate = null;
        daysInput.value = "";
        updateSummary();
      }
    }
  });
}

function addDays(startIso, days) {
  const d = new Date(startIso + "T00:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
