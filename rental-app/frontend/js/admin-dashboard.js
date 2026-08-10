let editingVehicleId = null;

document.addEventListener("DOMContentLoaded", async () => {
  // --- Brand mark: use the real logo once LOGO_URL is set, else initials ---
  const markEl = document.getElementById("adminBrandMark");
  if (markEl) {
    if (SITE_CONFIG.LOGO_URL) {
      markEl.outerHTML = `<img src="${SITE_CONFIG.LOGO_URL}" alt="${SITE_CONFIG.BRAND_NAME} logo" class="brand-mark brand-mark-img" id="adminBrandMark" />`;
    } else {
      const initials = SITE_CONFIG.BRAND_NAME.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
      markEl.textContent = initials;
    }
  }

  // --- Auth guard: bounce to login if there's no valid admin session ---
  let me;
  try {
    me = await api.get("/auth/me");
  } catch {
    window.location.href = "admin-login.html";
    return;
  }
  document.getElementById("adminEmail").textContent = me.email;

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await api.post("/auth/logout", {});
    window.location.href = "admin-login.html";
  });

  // --- Tabs ---
  const tabs = document.querySelectorAll(".admin-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".admin-panel").forEach((p) => (p.style.display = "none"));
      document.getElementById(`tab-${tab.dataset.tab}`).style.display = "block";
    });
  });

  await Promise.all([loadVehicles(), loadBookings()]);
  setupVehicleForm();
  setupPhotoUpload();
});

/* =============================== VEHICLES =============================== */

async function loadVehicles() {
  const tbody = document.getElementById("vehiclesTableBody");
  try {
    const vehicles = await api.get("/vehicles");
    if (vehicles.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No vehicles yet. Add your first one above.</td></tr>`;
      return;
    }
    tbody.innerHTML = vehicles.map(vehicleRowHtml).join("");
    attachVehicleRowHandlers(vehicles);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5">Couldn't load vehicles: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function vehicleRowHtml(v) {
  return `
    <tr data-id="${v.id}">
      <td>${escapeHtml(v.name)}</td>
      <td>${escapeHtml(v.type)}</td>
      <td class="num">&#8377;${v.pricePerDay}</td>
      <td>${v.available ? '<span class="badge badge-available">Available</span>' : '<span class="badge badge-unavailable">Hidden</span>'}</td>
      <td class="table-actions">
        <button class="btn btn-outline btn-toggle" data-id="${v.id}">${v.available ? "Mark unavailable" : "Mark available"}</button>
        <button class="btn btn-outline btn-edit" data-id="${v.id}">Edit</button>
        <button class="btn btn-danger btn-delete" data-id="${v.id}">Delete</button>
      </td>
    </tr>
  `;
}

function attachVehicleRowHandlers(vehicles) {
  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => startEditVehicle(vehicles.find((v) => v.id === btn.dataset.id)));
  });

  document.querySelectorAll(".btn-toggle").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const vehicle = vehicles.find((v) => v.id === btn.dataset.id);
      btn.disabled = true;
      try {
        await api.put(`/vehicles/${vehicle.id}`, { available: !vehicle.available });
        await loadVehicles();
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
      }
    });
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const vehicle = vehicles.find((v) => v.id === btn.dataset.id);
      if (!confirm(`Remove "${vehicle.name}" from the fleet? This can't be undone.`)) return;
      btn.disabled = true;
      try {
        await api.delete(`/vehicles/${vehicle.id}`);
        await loadVehicles();
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
      }
    });
  });
}

function startEditVehicle(vehicle) {
  if (!vehicle) return;
  editingVehicleId = vehicle.id;

  document.getElementById("vehicleFormTitle").textContent = `Editing: ${vehicle.name}`;
  document.getElementById("v_name").value = vehicle.name;
  document.getElementById("v_type").value = vehicle.type;
  document.getElementById("v_seats").value = vehicle.seats;
  document.getElementById("v_price").value = vehicle.pricePerDay;
  document.getElementById("v_transmission").value = vehicle.transmission;
  document.getElementById("v_fuel").value = vehicle.fuel;
  document.getElementById("v_photo").value = vehicle.photoUrl || "";
  document.getElementById("v_description").value = vehicle.description || "";
  document.getElementById("v_available").checked = vehicle.available;

  showPhotoPreview(vehicle.photoUrl || "");
  document.getElementById("photoUploadStatus").textContent = "";

  document.getElementById("vehicleFormSubmit").textContent = "Update vehicle";
  document.getElementById("vehicleFormCancel").style.display = "inline-flex";
  document.getElementById("vehicleForm").scrollIntoView({ behavior: "smooth" });
}

function resetVehicleForm() {
  editingVehicleId = null;
  document.getElementById("vehicleForm").reset();
  document.getElementById("v_available").checked = true;
  document.getElementById("v_photo").value = "";
  document.getElementById("vehicleFormTitle").textContent = "Add a vehicle";
  document.getElementById("vehicleFormSubmit").textContent = "Add vehicle";
  document.getElementById("vehicleFormCancel").style.display = "none";
  document.getElementById("vehicleFormError").innerHTML = "";
  document.getElementById("photoUploadStatus").textContent = "";
  showPhotoPreview("");
}

function showPhotoPreview(url) {
  const preview = document.getElementById("photoPreview");
  if (url) {
    preview.src = url;
    preview.style.display = "block";
  } else {
    preview.src = "";
    preview.style.display = "none";
  }
}

// Uploads the selected file straight to Cloudinary from the browser (no
// backend involved), then stores the resulting URL in the hidden v_photo
// field -- the rest of the form/save flow is unchanged.
let photoUploadInProgress = false;

function setupPhotoUpload() {
  const fileInput = document.getElementById("v_photo_file");
  const statusEl = document.getElementById("photoUploadStatus");

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    // Instant local preview while the upload is in progress
    showPhotoPreview(URL.createObjectURL(file));
    statusEl.textContent = "Uploading\u2026";
    photoUploadInProgress = true;

    const cloudName = SITE_CONFIG.CLOUDINARY_CLOUD_NAME;
    const preset = SITE_CONFIG.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || cloudName === "your-cloud-name") {
      statusEl.textContent = "Photo upload isn't set up yet -- add your Cloudinary details in config.js.";
      photoUploadInProgress = false;
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Upload failed.");

      document.getElementById("v_photo").value = data.secure_url;
      showPhotoPreview(data.secure_url);
      statusEl.textContent = "Photo uploaded.";
    } catch (err) {
      statusEl.textContent = `Upload failed: ${err.message}`;
      showPhotoPreview(document.getElementById("v_photo").value || "");
    } finally {
      photoUploadInProgress = false;
    }
  });
}

function setupVehicleForm() {
  const form = document.getElementById("vehicleForm");
  const errorBox = document.getElementById("vehicleFormError");

  document.getElementById("vehicleFormCancel").addEventListener("click", resetVehicleForm);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.innerHTML = "";

    if (photoUploadInProgress) {
      errorBox.innerHTML = `<p class="form-error">Please wait for the photo to finish uploading before saving.</p>`;
      return;
    }

    const payload = {
      name: document.getElementById("v_name").value.trim(),
      type: document.getElementById("v_type").value.trim() || "Car",
      seats: Number(document.getElementById("v_seats").value) || 5,
      pricePerDay: Number(document.getElementById("v_price").value),
      transmission: document.getElementById("v_transmission").value,
      fuel: document.getElementById("v_fuel").value,
      photoUrl: document.getElementById("v_photo").value.trim(),
      description: document.getElementById("v_description").value.trim(),
      available: document.getElementById("v_available").checked,
    };

    const submitBtn = document.getElementById("vehicleFormSubmit");
    submitBtn.disabled = true;

    try {
      if (editingVehicleId) {
        await api.put(`/vehicles/${editingVehicleId}`, payload);
      } else {
        await api.post("/vehicles", payload);
      }
      resetVehicleForm();
      await loadVehicles();
    } catch (err) {
      errorBox.innerHTML = `<p class="form-error">${escapeHtml(err.message)}</p>`;
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* =============================== BOOKINGS =============================== */

const NEXT_STATUS_ACTIONS = {
  pending: [
    { label: "Mark paid", status: "paid", cls: "btn-teal" },
    { label: "Cancel", status: "cancelled", cls: "btn-danger" },
  ],
  paid: [
    { label: "Confirm booking", status: "confirmed", cls: "btn-primary" },
    { label: "Cancel", status: "cancelled", cls: "btn-danger" },
  ],
  confirmed: [{ label: "Cancel", status: "cancelled", cls: "btn-danger" }],
  cancelled: [],
};

async function loadBookings() {
  const tbody = document.getElementById("bookingsTableBody");
  try {
    const bookings = await api.get("/bookings");
    if (bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">No bookings yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = bookings.map(bookingRowHtml).join("");
    attachBookingRowHandlers();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7">Couldn't load bookings: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function bookingRowHtml(b) {
  const actions = (NEXT_STATUS_ACTIONS[b.status] || [])
    .map((a) => `<button class="btn ${a.cls} btn-status" data-id="${b.id}" data-status="${a.status}">${a.label}</button>`)
    .join("");

  return `
    <tr data-id="${b.id}">
      <td class="mono">${b.id}</td>
      <td>${escapeHtml(b.customerName)}<br /><span class="form-note">${escapeHtml(b.phone)}</span></td>
      <td>${escapeHtml(b.vehicleName)}</td>
      <td>${b.startDate} &rarr; ${b.endDate}<br /><span class="form-note">${b.days} day(s)</span></td>
      <td class="num">&#8377;${b.totalAmount}</td>
      <td><span class="badge badge-${b.status}">${b.status}</span></td>
      <td class="table-actions">${actions || "&mdash;"}</td>
    </tr>
  `;
}

function attachBookingRowHandlers() {
  document.querySelectorAll(".btn-status").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await api.put(`/bookings/${btn.dataset.id}`, { status: btn.dataset.status });
        await loadBookings();
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
      }
    });
  });
}
