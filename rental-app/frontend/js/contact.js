const CONTACT_ICONS = {
  whatsapp: `<svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor"><path d="M16 3C9.1 3 3.5 8.6 3.5 15.5c0 2.4.7 4.7 1.9 6.6L3 29l7.1-2.3c1.8 1 3.8 1.5 5.9 1.5 6.9 0 12.5-5.6 12.5-12.5S22.9 3 16 3zm0 22.6c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.2 1.4 1.4-4.1-.2-.4c-1.1-1.7-1.6-3.7-1.6-5.7 0-5.7 4.6-10.4 10.4-10.4 5.7 0 10.4 4.6 10.4 10.4S21.7 25.6 16 25.6z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.4a4 4 0 1 1-7.9 1.2 4 4 0 0 1 7.9-1.2z"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L7.9 9.9a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.9 2.3z"/></svg>`,
  email: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7 10-7"/></svg>`,
  address: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
};

function contactRow({ icon, label, value, href }) {
  return `
    <a class="contact-link-row" href="${href}" target="_blank" rel="noopener">
      <span class="contact-link-icon">${CONTACT_ICONS[icon]}</span>
      <span class="contact-link-text">
        <span class="contact-link-label">${label}</span>
        <span class="contact-link-value">${escapeHtml(value)}</span>
      </span>
    </a>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const genericMessage = encodeURIComponent(`Hi ${SITE_CONFIG.BRAND_NAME}, I have a question about renting a car.`);
  const waHref = `https://wa.me/${SITE_CONFIG.WHATSAPP_NUMBER}?text=${genericMessage}`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE_CONFIG.ADDRESS)}`;

  document.getElementById("contactLinks").innerHTML = [
    contactRow({ icon: "whatsapp", label: "WhatsApp", value: SITE_CONFIG.PHONE_DISPLAY, href: waHref }),
    contactRow({ icon: "phone", label: "Call", value: SITE_CONFIG.PHONE_DISPLAY, href: `tel:${SITE_CONFIG.WHATSAPP_NUMBER}` }),
    contactRow({ icon: "email", label: "Email", value: SITE_CONFIG.EMAIL, href: `mailto:${SITE_CONFIG.EMAIL}` }),
    contactRow({ icon: "instagram", label: "Instagram", value: "Follow us", href: SITE_CONFIG.INSTAGRAM_URL }),
    contactRow({ icon: "address", label: "Address", value: SITE_CONFIG.ADDRESS, href: mapsHref }),
  ].join("");

  document.getElementById("contactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("c_name").value.trim();
    const message = document.getElementById("c_message").value.trim();

    const text = encodeURIComponent(`Hi ${SITE_CONFIG.BRAND_NAME}, this is ${name}. ${message}`);
    window.open(`https://wa.me/${SITE_CONFIG.WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener");
  });
});
