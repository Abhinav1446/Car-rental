// A small, dependency-free month calendar for picking a pickup/return date
// range. Dates already booked (passed in as blockedDates) can't be
// selected, and a range can't be started/extended across a blocked date.
//
// Usage:
//   const calendar = createBookingCalendar({
//     container: document.getElementById("calendarMount"),
//     blockedRanges: [{ startDate: "2026-09-01", endDate: "2026-09-03" }, ...],
//     onChange: (selection) => { ... } // selection: { startDate, endDate } or null fields
//   });

function createBookingCalendar({ container, blockedRanges, onChange }) {
  const blockedDates = expandRangesToDateSet(blockedRanges || []);

  let viewYear, viewMonth; // 0-indexed month, matches Date's convention
  const today = startOfDay(new Date());
  viewYear = today.getFullYear();
  viewMonth = today.getMonth();

  let selectedStart = null; // Date object
  let selectedEnd = null; // Date object

  function render() {
    const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });

    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startOffset = firstOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

    const dowLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    container.innerHTML = `
      <div class="cal-header">
        <button type="button" class="cal-nav" id="calPrev" aria-label="Previous month">&larr;</button>
        <span class="cal-month-label">${monthLabel}</span>
        <button type="button" class="cal-nav" id="calNext" aria-label="Next month">&rarr;</button>
      </div>
      <div class="cal-grid cal-dow">
        ${dowLabels.map((d) => `<span>${d}</span>`).join("")}
      </div>
      <div class="cal-grid">
        ${cells.map((date) => cellHtml(date)).join("")}
      </div>
      <div class="cal-legend">
        <span><i class="cal-dot cal-dot-blocked"></i> Booked</span>
        <span><i class="cal-dot cal-dot-selected"></i> Your dates</span>
      </div>
    `;

    container.querySelector("#calPrev").addEventListener("click", () => {
      viewMonth--;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear--;
      }
      render();
    });
    container.querySelector("#calNext").addEventListener("click", () => {
      viewMonth++;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear++;
      }
      render();
    });

    container.querySelectorAll(".cal-day[data-date]").forEach((el) => {
      el.addEventListener("click", () => handleDayClick(el.dataset.date));
    });
  }

  function cellHtml(date) {
    if (!date) return `<span class="cal-day cal-day-empty"></span>`;

    const iso = toIso(date);
    const isPast = date < today;
    const isBlocked = blockedDates.has(iso);
    const isToday = iso === toIso(today);

    let stateClass = "";
    if (isPast || isBlocked) stateClass = "cal-day-disabled";
    if (isBlocked) stateClass += " cal-day-blocked";

    if (selectedStart && iso === toIso(selectedStart)) stateClass += " cal-day-selected cal-day-range-start";
    if (selectedEnd && iso === toIso(selectedEnd)) stateClass += " cal-day-selected cal-day-range-end";
    if (selectedStart && selectedEnd && date > selectedStart && date < selectedEnd) {
      stateClass += " cal-day-in-range";
    }
    if (isToday) stateClass += " cal-day-today";

    const disabledAttr = isPast || isBlocked ? "" : `data-date="${iso}"`;

    return `<button type="button" class="cal-day ${stateClass}" ${disabledAttr} ${
      isPast || isBlocked ? "disabled" : ""
    }>${date.getDate()}</button>`;
  }

  function handleDayClick(iso) {
    const clicked = new Date(iso + "T00:00:00");

    if (!selectedStart || (selectedStart && selectedEnd)) {
      // Starting a fresh selection
      selectedStart = clicked;
      selectedEnd = null;
    } else if (clicked <= selectedStart) {
      // Clicked before/on the current start -- restart from here
      selectedStart = clicked;
      selectedEnd = null;
    } else if (rangeCrossesBlockedDate(selectedStart, clicked, blockedDates)) {
      // Can't extend through a booked date -- restart selection at the new date
      selectedStart = clicked;
      selectedEnd = null;
    } else {
      selectedEnd = clicked;
    }

    render();
    onChange({
      startDate: selectedStart ? toIso(selectedStart) : null,
      endDate: selectedEnd ? toIso(selectedEnd) : null,
    });
  }

  function reset() {
    selectedStart = null;
    selectedEnd = null;
    render();
    onChange({ startDate: null, endDate: null });
  }

  render();

  return { reset };
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Expands each {startDate, endDate} range (end exclusive, matching the
// backend's convention) into a Set of individual "YYYY-MM-DD" strings.
function expandRangesToDateSet(ranges) {
  const set = new Set();
  for (const range of ranges) {
    let cur = new Date(range.startDate + "T00:00:00");
    const end = new Date(range.endDate + "T00:00:00");
    while (cur < end) {
      set.add(toIso(cur));
      cur.setDate(cur.getDate() + 1);
    }
  }
  return set;
}

function rangeCrossesBlockedDate(start, end, blockedDates) {
  let cur = new Date(start);
  cur.setDate(cur.getDate() + 1);
  while (cur < end) {
    if (blockedDates.has(toIso(cur))) return true;
    cur.setDate(cur.getDate() + 1);
  }
  return false;
}
