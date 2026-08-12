const nodemailer = require("nodemailer");

let transporter = null;

// Lazily creates the mail transporter. Returns null if notifications
// aren't configured yet, so the app can run fine without them -- booking
// creation should never fail just because email isn't set up.
function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.NOTIFY_EMAIL_USER;
  const pass = process.env.NOTIFY_EMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
  return transporter;
}

// Fire-and-forget: callers should NOT await this before responding to the
// customer, so a slow or failed email never delays or breaks their booking.
async function sendBookingNotification(booking) {
  const mailer = getTransporter();
  if (!mailer) {
    console.log("Email notifications not configured (set NOTIFY_EMAIL_USER / NOTIFY_EMAIL_APP_PASSWORD) -- skipping.");
    return;
  }

  const to = process.env.NOTIFY_EMAIL_TO || process.env.NOTIFY_EMAIL_USER;
  const fromName = process.env.NOTIFY_FROM_NAME || "Booking Notifications";
  const paymentLabel = booking.paymentMethod === "cash" ? "Cash at pickup" : "UPI";

  const subject = `New booking: ${booking.vehicleName} (${booking.startDate} to ${booking.endDate})`;

  const text = [
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
    await mailer.sendMail({
      from: `"${fromName}" <${process.env.NOTIFY_EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`Booking notification email sent for ${booking.id}.`);
  } catch (err) {
    // Never let an email failure affect the booking flow -- just log it.
    console.error("Failed to send booking notification email:", err.message);
  }
}

module.exports = { sendBookingNotification };
