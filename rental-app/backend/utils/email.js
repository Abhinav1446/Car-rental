// Sends booking notifications via Brevo's HTTP API (not SMTP).
//
// Why not SMTP: Render's free tier blocks outbound traffic on SMTP ports
// (25, 465, 587) to prevent spam abuse, which breaks services like Gmail
// SMTP entirely -- no amount of correct credentials fixes that, since it's
// blocked at the network level. An HTTPS API call (like this one) uses the
// same kind of connection as any other web request, which isn't blocked.

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Fire-and-forget: callers should NOT await this before responding to the
// customer, so a slow or failed email never delays or breaks their booking.
async function sendBookingNotification(booking) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.NOTIFY_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.log("Email notifications not configured (set BREVO_API_KEY / NOTIFY_FROM_EMAIL) -- skipping.");
    return;
  }

  const toEmail = process.env.NOTIFY_EMAIL_TO || fromEmail;
  const fromName = process.env.NOTIFY_FROM_NAME || "Booking Notifications";
  const paymentLabel = booking.paymentMethod === "cash" ? "Cash at pickup" : "UPI";

  const subject = `New booking: ${booking.vehicleName} (${booking.startDate} to ${booking.endDate})`;

  const textContent = [
    "New booking received.",
    "",
    `Vehicle: ${booking.vehicleName}`,
    `Customer: ${booking.customerName}`,
    `Phone: ${booking.phone}`,
    `Dates: ${booking.startDate} to ${booking.endDate} (${booking.days} day(s))`,
    `Amount: Rs.${booking.totalAmount}`,
    `Payment method: ${paymentLabel}`,
    `Booking reference: ${booking.id}`,
    `Status: ${booking.status}`,
    "",
    "Log in to the admin dashboard to verify and confirm this booking.",
  ].join("\n");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: toEmail }],
        subject,
        textContent,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Brevo API returned ${res.status}: ${errBody}`);
    }

    console.log(`Booking notification email sent for ${booking.id}.`);
  } catch (err) {
    // Never let an email failure affect the booking flow -- just log it.
    console.error("Failed to send booking notification email:", err.message);
  }
}

module.exports = { sendBookingNotification };
