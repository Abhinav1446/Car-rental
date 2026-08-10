function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

function brandMarkHtml(sizeClass = "") {
  if (SITE_CONFIG.LOGO_URL) {
    return `<img src="${SITE_CONFIG.LOGO_URL}" alt="${SITE_CONFIG.BRAND_NAME} logo" class="brand-mark brand-mark-img ${sizeClass}" />`;
  }
  return `<span class="brand-mark ${sizeClass}">${getInitials(SITE_CONFIG.BRAND_NAME)}</span>`;
}

function renderLayout() {
  const nav = document.getElementById("site-nav");
  const footer = document.getElementById("site-footer");
  const path = location.pathname.split("/").pop() || "index.html";

  const links = [
    ["index.html", "Home"],
    ["fleet.html", "Fleet"],
    ["about.html", "About"],
    ["contact.html", "Contact"],
  ];

  if (nav) {
    nav.innerHTML = `
      <div class="nav-inner">
        <a class="brand" href="index.html">
          ${brandMarkHtml()}
          <span class="brand-name">${SITE_CONFIG.BRAND_NAME}</span>
        </a>
        <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <ul class="nav-links" id="navLinks">
          ${links
            .map(
              ([href, label]) =>
                `<li><a href="${href}" class="${path === href ? "active" : ""}">${label}</a></li>`
            )
            .join("")}
          <li><a href="admin-login.html" class="nav-admin">Owner login</a></li>
        </ul>
      </div>
    `;

    const toggle = document.getElementById("navToggle");
    const navLinksEl = document.getElementById("navLinks");
    toggle?.addEventListener("click", () => {
      const isOpen = navLinksEl.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  if (footer) {
    const year = new Date().getFullYear();
    footer.innerHTML = `
      <div class="footer-inner">
        <div class="footer-brand">
          ${brandMarkHtml()}
          <span>${SITE_CONFIG.BRAND_NAME}</span>
        </div>
        <div class="footer-route" aria-hidden="true"></div>
        <div class="footer-links">
          <a href="policies.html#terms">Terms</a>
          <a href="policies.html#privacy">Privacy</a>
          <a href="policies.html#refund">Refunds</a>
          <a href="contact.html">Contact</a>
        </div>
        <p class="footer-fine">&copy; ${year} ${SITE_CONFIG.BRAND_NAME}, ${SITE_CONFIG.CITY}. All rights reserved.</p>
      </div>
    `;
  }

  renderFloatingSocial();
}

// Fixed-position WhatsApp + Instagram buttons, bottom-right of the screen,
// present on every public page. Each opens a direct chat -- no page visit
// needed first.
function renderFloatingSocial() {
  if (document.getElementById("floatingSocial")) return; // avoid duplicates

  const waMessage = encodeURIComponent(`Hi ${SITE_CONFIG.BRAND_NAME}, I have a question about renting a car.`);
  const waHref = `https://wa.me/${SITE_CONFIG.WHATSAPP_NUMBER}?text=${waMessage}`;

  const wrap = document.createElement("div");
  wrap.id = "floatingSocial";
  wrap.className = "floating-social";
  wrap.innerHTML = `
    <a href="${waHref}" target="_blank" rel="noopener" class="floating-btn floating-whatsapp" aria-label="Chat on WhatsApp" title="Chat on WhatsApp">
      <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor" aria-hidden="true">
        <path d="M16 3C9.1 3 3.5 8.6 3.5 15.5c0 2.4.7 4.7 1.9 6.6L3 29l7.1-2.3c1.8 1 3.8 1.5 5.9 1.5 6.9 0 12.5-5.6 12.5-12.5S22.9 3 16 3zm0 22.6c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.2 1.4 1.4-4.1-.2-.4c-1.1-1.7-1.6-3.7-1.6-5.7 0-5.7 4.6-10.4 10.4-10.4 5.7 0 10.4 4.6 10.4 10.4S21.7 25.6 16 25.6zm5.7-7.8c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/>
      </svg>
    </a>
    <a href="${SITE_CONFIG.INSTAGRAM_URL}" target="_blank" rel="noopener" class="floating-btn floating-instagram" aria-label="Follow on Instagram" title="Follow on Instagram">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.4a4 4 0 1 1-7.9 1.2 4 4 0 0 1 7.9-1.2z"/>
        <line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/>
      </svg>
    </a>
  `;
  document.body.appendChild(wrap);
}

document.addEventListener("DOMContentLoaded", renderLayout);
