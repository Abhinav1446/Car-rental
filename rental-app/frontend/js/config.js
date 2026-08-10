// ---------------------------------------------------------------------------
// Everything specific to your friend's business lives in this one file.
// Change these values and the whole site updates -- no need to hunt through
// every page.
// ---------------------------------------------------------------------------
const SITE_CONFIG = {
  BRAND_NAME: "Alex Cars",
  TAGLINE: "Self-drive cars, booked in minutes.",
  CITY: "Hyderabad",
  PHONE_DISPLAY: "+91 9959194269",
  WHATSAPP_NUMBER: "919959194269", // digits only, country code, no +

  // Requests to /api/... are proxied to the Render backend by vercel.json
  // in production, so the browser sees everything as the same domain --
  // this avoids the "third-party cookie" blocking some browsers apply to
  // logins when frontend and backend are on visibly different domains.
  // Locally there's no Vercel proxy running, so we fall back to hitting
  // the backend directly on localhost.
  API_BASE:
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? "http://localhost:4000/api"
      : "/api",

  // Leave LOGO_URL empty to show a text-based mark instead. Once you have
  // the real logo file hosted somewhere, paste its direct image URL here
  // and it'll switch over everywhere automatically -- no other changes needed.
  LOGO_URL: "images/logo.jpeg",

  INSTAGRAM_URL: "https://www.instagram.com/alex_self_cars?igsh=NTdzOHphMjZ5amU2",
  EMAIL: "alexcarss.in@gmail.com",
  ADDRESS: "Laxmi nivas, Gayatri Nagar, Allapur, Borabanda, Hyderabad, Telangana 500114",

  //Car-images hosted on cloudinary website
  CLOUDINARY_CLOUD_NAME: "yr91rvk1",
  CLOUDINARY_UPLOAD_PRESET: "car-images",
};
