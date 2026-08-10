# Car Rental App

A small full-stack app for a self-managed car rental business: customers
browse the fleet, book a vehicle, and pay by UPI. The owner manages
everything (vehicles, prices, bookings) through a single admin dashboard.

This is original code built for this project — not a copy of any existing
site — so it's yours to brand, modify, and deploy freely.

## What's included

```
rental-app/
├── backend/              Node.js + Express API
│   ├── data/             JSON file storage (db.json is created on first run)
│   ├── middleware/       Admin auth check
│   ├── routes/           auth, vehicles, bookings endpoints
│   ├── utils/            UPI payment link builder
│   ├── server.js
│   ├── package.json
│   └── .env.example      Copy to .env and fill in real values
│
└── frontend/             Plain HTML/CSS/JS (no build step required)
    ├── css/style.css
    ├── js/               config.js, api.js, and one file per page
    ├── index.html         Homepage
    ├── fleet.html         Browse all vehicles
    ├── car.html           Vehicle detail + booking + UPI payment
    ├── about.html
    ├── contact.html
    ├── policies.html      Terms / privacy / refund
    ├── admin-login.html
    └── admin-dashboard.html   Add/remove vehicles, manage bookings
```

## How it works, briefly

1. A customer browses `fleet.html`, opens a vehicle on `car.html`, and submits
   a booking request (name, phone, dates).
2. The backend creates a `pending` booking and returns a UPI payment link
   (the same kind a UPI QR code encodes) built from the owner's UPI ID.
3. The customer pays via any UPI app, then can tap through to WhatsApp to
   tell the owner they've paid.
4. **The owner checks their own bank/UPI app** and, once the payment shows
   up, marks the booking **Paid** and then **Confirmed** in the admin
   dashboard. This step is manual — there's no way to auto-detect a UPI
   payment without a registered payment gateway, so budget for the owner
   checking bookings regularly.
5. The owner manages the whole fleet (add/edit/remove vehicles, set prices,
   mark vehicles unavailable) from the same dashboard.

## 1. Backend setup

Requires [Node.js](https://nodejs.org) 18 or later.

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in real values:

| Variable | What it's for |
|---|---|
| `JWT_SECRET` | Any long random string — used to sign the admin's login session |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | The one owner login for the dashboard |
| `UPI_ID` | The owner's real UPI ID (e.g. `name@okhdfcbank`) — this is where customer payments go |
| `UPI_PAYEE_NAME` | Name shown to the customer in their UPI app when paying |
| `PORT` | Port the API runs on (default `4000`) |
| `CORS_ORIGIN` | The URL the frontend is served from (e.g. `http://localhost:5500`) |

Then create the admin account and a couple of sample vehicles:

```bash
npm run seed
```

Start the server:

```bash
npm start
```

You should see `Rental API listening on http://localhost:4000`.

## 2. Frontend setup

The frontend is plain static files — no build step. Serve the `frontend/`
folder with any static server, for example:

```bash
cd frontend
npx serve .
# or: python3 -m http.server 5500
```

Then open `frontend/js/config.js` and set:

```js
const SITE_CONFIG = {
  BRAND_NAME: "The actual business name",
  TAGLINE: "...",
  CITY: "...",
  PHONE_DISPLAY: "+91 ...",
  WHATSAPP_NUMBER: "91...",       // digits only, country code, no +, no spaces
  API_BASE: "http://localhost:4000/api",  // must match where the backend runs
};
```

Visit the frontend URL your static server printed (e.g.
`http://localhost:5500`). The admin dashboard is at `/admin-login.html`.

## 3. Adding real vehicles

Log in at `/admin-login.html` with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you
set in `.env`, then use the **Vehicles** tab to remove the two sample
vehicles and add the real fleet — name, type, seats, transmission, fuel,
price per day, an optional photo URL, and a short description.

For photos: paste a direct image URL (ending in `.jpg`/`.png`/etc.), for
example from a photo you've uploaded to any image host you control. There's
no file upload built in yet — it's a URL field.

## 4. Before going live — a few things worth doing

- **Change `JWT_SECRET` and `ADMIN_PASSWORD`** in `.env` to real, unique
  values — the ones in `.env.example` are placeholders only.
- **Never commit your real `.env` file** to git — only `.env.example`
  should be tracked.
- **Double-check `UPI_ID`** carefully before launch — this is literally
  where customer money goes.
- Consider adding HTTPS in front of the backend if you deploy it publicly
  (most hosts like Render/Railway provide this automatically).
- The policies page (`policies.html`) has placeholder terms/privacy/refund
  text — have someone review and adapt it to match how the business
  actually operates before publishing.

## 5. Deploying

Any split works: a small VM, or a backend host (Render, Railway, Fly.io)
plus static hosting for the frontend (Netlify, Vercel, GitHub Pages,
Cloudflare Pages). Whichever you pick:

- Set the real `.env` values on the backend host (not in the repo).
- Update `CORS_ORIGIN` in the backend `.env` to the frontend's real URL.
- Update `API_BASE` in `frontend/js/config.js` to the backend's real URL.

## Notes on the data storage

Vehicles and bookings are stored in `backend/data/db.json`, a plain JSON
file — no separate database server to install or manage, which fits a
fleet of ~10 vehicles well. If the business grows a lot and this starts to
feel limiting, the same shape (vehicles, bookings as arrays of objects)
maps cleanly onto a real database like Postgres later without changing the
API routes much.
