// Builds a standard "UPI Deep Link" (the same kind QR codes encode).
// Tapping it on a phone opens the customer's UPI app (GPay/PhonePe/Paytm/etc.)
// with the amount and note pre-filled -- no payment gateway account, API key,
// or transaction fee needed. This is how most small Indian businesses accept
// UPI payments directly.
//
// Note: this only pre-fills the payment for the customer to send. Confirming
// that money actually arrived still has to happen on the owner's side (bank
// SMS/UPI app notification), which is why bookings are created as "pending"
// and the admin marks them "paid" manually in the dashboard below.

function buildUpiLink({ payeeVpa, payeeName, amount, note, txnRef }) {
  const params = new URLSearchParams({
    pa: payeeVpa, // payee UPI ID
    pn: payeeName, // payee name
    am: String(amount), // amount
    cu: "INR",
    tn: note || "Car rental booking", // transaction note
  });
  if (txnRef) params.set("tr", txnRef); // optional transaction reference

  return `upi://pay?${params.toString()}`;
}

module.exports = { buildUpiLink };
