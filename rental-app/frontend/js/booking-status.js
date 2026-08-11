const STATUS_LABELS = {
  pending: "Pending",
  paid: "Payment received",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

function statusMessage(booking) {
  const { status, paymentMethod } = booking;

  if (status === "cancelled") {
    return "This booking was cancelled.";
  }
  if (status === "confirmed") {
    return "Your booking is confirmed \u2014 we'll see you on pickup day.";
  }
  if (status === "paid") {
    return "Payment received. We're finalizing your booking \u2014 check back shortly for confirmation.";
  }
  // status === "pending"
  return paymentMethod === "cash"
    ? "Verifying payment. Pay in cash at pickup \u2014 we'll confirm your booking once payment is received."
    : "Awaiting UPI payment. Complete payment below to confirm your booking.";
}

async function renderBookingStatus(bookingId) {
  const resultEl = document.getElementById("statusResult");
  resultEl.innerHTML = `<p class="form-note">Looking up booking\u2026</p>`;

  let booking;
  try {
    booking = await api.get(`/bookings/status/${encodeURIComponent(bookingId)}`);
  } catch (err) {
    resultEl.innerHTML = emptyStateHtml(err.message || "Booking not found. Double check your reference and try again.");
    return;
  }

  const badgeClass = `badge-${booking.status}`;
  const message = statusMessage(booking);

  let paymentSection = "";
  if (booking.status === "pending" && booking.paymentMethod === "upi") {
    paymentSection = `<div id="upiPaySection" class="center" style="margin-top:20px;"><p class="form-note">Loading payment details\u2026</p></div>`;
  }

  resultEl.innerHTML = `
    <div class="form-card">
      <div class="spread" style="margin-bottom:16px;">
        <span class="badge ${badgeClass}">${STATUS_LABELS[booking.status] || booking.status}</span>
        <span class="mono form-note">Ref: ${escapeHtml(booking.id)}</span>
      </div>

      <p>${message}</p>

      <div class="stack" style="margin: 20px 0;">
        <div class="spread"><span>Vehicle</span><strong>${escapeHtml(booking.vehicleName)}</strong></div>
        <div class="spread"><span>Dates</span><strong>${booking.startDate} &rarr; ${booking.endDate}</strong></div>
        <div class="spread"><span>Duration</span><strong>${booking.days} day(s)</strong></div>
        <div class="spread"><span>Payment method</span><strong>${booking.paymentMethod === "cash" ? "Cash at pickup" : "UPI"}</strong></div>
        <div class="spread"><span>Amount</span><span class="price-plate mono">&#8377;${booking.totalAmount}</span></div>
      </div>

      ${paymentSection}
    </div>
  `;

  if (booking.status === "pending" && booking.paymentMethod === "upi") {
    loadUpiPaymentSection(booking);
  }
}

async function loadUpiPaymentSection(booking) {
  const section = document.getElementById("upiPaySection");
  try {
    const { upiLink } = await api.get(`/bookings/${encodeURIComponent(booking.id)}/upi-link`);
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
    section.innerHTML = `
      <img src="${qrSrc}" alt="UPI payment QR code" width="200" height="200" style="border-radius: var(--radius-sm); border: 1px solid #ddd6c4;" />
      <p class="form-note" style="margin: 8px 0 16px;">Scan with any UPI app, or tap below on mobile.</p>
      <a href="${upiLink}" class="btn btn-primary btn-block">Pay &#8377;${booking.totalAmount} via UPI</a>
    `;
  } catch {
    section.innerHTML = `<p class="form-note">Couldn't load the payment link right now. Please refresh the page.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  const refInput = document.getElementById("refInput");

  if (ref) {
    refInput.value = ref;
    renderBookingStatus(ref);
  }

  document.getElementById("lookupForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const value = refInput.value.trim();
    if (!value) return;
    window.location.href = `booking-status.html?ref=${encodeURIComponent(value)}`;
  });
});
