// Booking widget for the listing page: flatpickr range picker fed by
// GET /listings/:id/availability, a live price, and the booking POST.
(() => {
    const root = document.getElementById("booking-widget");
    if (!root || typeof flatpickr === "undefined") return;

    const listingId = root.dataset.listingId;
    const price = Number(root.dataset.price) || 0;
    const MAX_NIGHTS = 30;
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    const form = document.getElementById("booking-form");
    const rangeInput = document.getElementById("booking-range");
    const priceEl = document.getElementById("booking-price");
    const submitBtn = document.getElementById("booking-submit");
    const alertEl = document.getElementById("booking-alert");

    const bookedNights = new Set(); // "YYYY-MM-DD" nights known to be taken
    const loadedMonths = new Set(); // "YYYY-MM" months whose data is in bookedNights
    let selection = null; // { checkIn, checkOut, nights } once a valid range is picked
    let selectionToken = 0; // discards results of superseded async range checks
    let picker;

    // ---- date helpers -------------------------------------------------------
    // The picker hands back local-midnight Dates. The calendar day the user
    // clicked is read from the LOCAL components; toISOString() would shift it
    // to the previous day for anyone east of UTC (e.g. IST).
    const pad = (n) => String(n).padStart(2, "0");
    const toYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const monthKey = (year, monthIndex) => `${year}-${pad(monthIndex + 1)}`;
    const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    const dayNumber = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const nightsBetween = (a, b) => Math.round((dayNumber(b) - dayNumber(a)) / MS_PER_DAY);
    const formatYmd = (ymd) =>
        new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-IN", {
            timeZone: "UTC",
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    const rupees = (n) => `₹ ${n.toLocaleString("en-IN")}`;

    // Every calendar month touched by the nights in [checkIn, checkOut).
    function monthsSpanned(checkIn, checkOut) {
        const months = [];
        let cursor = new Date(checkIn.getFullYear(), checkIn.getMonth(), 1);
        const last = addDays(checkOut, -1);
        while (cursor <= last) {
            months.push(monthKey(cursor.getFullYear(), cursor.getMonth()));
            cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        }
        return months;
    }

    function firstBookedNight(checkIn, checkOut) {
        for (let d = checkIn; d < checkOut; d = addDays(d, 1)) {
            if (bookedNights.has(toYmd(d))) return toYmd(d);
        }
        return null;
    }

    // ---- messages -----------------------------------------------------------
    function showAlert(kind, text, listItems) {
        alertEl.className = `alert alert-${kind}`;
        alertEl.replaceChildren();
        const p = document.createElement("p");
        p.className = "mb-0";
        p.textContent = text;
        alertEl.appendChild(p);
        if (listItems && listItems.length) {
            const ul = document.createElement("ul");
            ul.className = "mb-0 mt-2";
            for (const item of listItems) {
                const li = document.createElement("li");
                li.textContent = item;
                ul.appendChild(li);
            }
            alertEl.appendChild(ul);
        }
    }

    function clearAlert() {
        alertEl.className = "alert d-none";
        alertEl.replaceChildren();
    }

    function renderPrice() {
        if (!selection) {
            priceEl.textContent = "Select dates to see the price.";
            return;
        }
        const { nights } = selection;
        priceEl.textContent =
            `${nights} night${nights === 1 ? "" : "s"} × ${rupees(price)} = ${rupees(nights * price)}`;
    }

    function resetSelection() {
        selectionToken++;
        selection = null;
        // clear(triggerChange, toInitial): don't fire onChange (it would wipe our
        // message) and don't jump the calendar back to the current month.
        picker.clear(false, false);
        submitBtn.disabled = true;
        renderPrice();
    }

    // ---- availability -------------------------------------------------------
    async function loadMonth(key, force = false) {
        if (!force && loadedMonths.has(key)) return;
        const res = await fetch(`/listings/${listingId}/availability?month=${key}`, {
            headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`availability request failed (${res.status})`);
        const data = await res.json();
        for (const night of [...bookedNights]) {
            if (night.startsWith(`${key}-`)) bookedNights.delete(night);
        }
        data.bookedDates.forEach((night) => bookedNights.add(night));
        loadedMonths.add(key);
    }

    // Uses the instance flatpickr passes in: onReady fires inside the flatpickr()
    // call, before `picker` has been assigned.
    async function refreshVisibleMonth(_dates, _str, instance) {
        try {
            await loadMonth(monthKey(instance.currentYear, instance.currentMonth));
            instance.redraw();
        } catch (err) {
            showAlert(
                "warning",
                "Couldn't load availability for this month. You can still try to book; we'll check when you reserve."
            );
        }
    }

    // A date is disabled when picking it could not lead to a valid stay.
    // Nights are half-open [checkIn, checkOut), so a booked night blocks a
    // check-in on that day but the same day is fine as a check-out.
    function isDisabled(date) {
        const start = picker && picker.selectedDates.length === 1 ? picker.selectedDates[0] : null;
        if (!start) return bookedNights.has(toYmd(date));
        if (dayNumber(date) === dayNumber(start)) return false;
        const [from, to] = date < start ? [date, start] : [start, date];
        if (nightsBetween(from, to) > MAX_NIGHTS) return true;
        return firstBookedNight(from, to) !== null;
    }

    // ---- range selection ----------------------------------------------------
    async function onRangeChange(dates) {
        clearAlert();
        selection = null;
        submitBtn.disabled = true;
        renderPrice();
        const token = ++selectionToken;
        picker.redraw();
        if (dates.length < 2) return;

        const [checkIn, checkOut] = dates;
        const nights = nightsBetween(checkIn, checkOut);
        if (nights < 1) {
            resetSelection();
            showAlert("warning", "Check-out must be after check-in.");
            return;
        }

        // The stay may span months the user never viewed; load them first.
        try {
            await Promise.all(monthsSpanned(checkIn, checkOut).map((key) => loadMonth(key)));
        } catch (err) {
            /* the server still checks every night when the booking is submitted */
        }
        if (token !== selectionToken) return;

        const taken = firstBookedNight(checkIn, checkOut);
        if (taken) {
            resetSelection();
            showAlert("warning", `${formatYmd(taken)} is already booked. Please choose different dates.`);
            picker.redraw();
            return;
        }

        selection = { checkIn: toYmd(checkIn), checkOut: toYmd(checkOut), nights };
        submitBtn.disabled = false;
        renderPrice();
    }

    // ---- submit -------------------------------------------------------------
    async function handleConflict(data, attempted) {
        const dates = (data.unavailableDates || []).map(formatYmd);
        const monthsToRefresh = new Set([monthKey(picker.currentYear, picker.currentMonth)]);
        if (attempted) {
            monthsSpanned(new Date(`${attempted.checkIn}T00:00:00`), new Date(`${attempted.checkOut}T00:00:00`))
                .forEach((key) => monthsToRefresh.add(key));
        }

        resetSelection();
        if (dates.length) {
            showAlert(
                "danger",
                "Sorry, these nights were just booked by someone else. Please pick new dates:",
                dates
            );
        } else {
            showAlert("danger", data.message || "Those dates were just booked by someone else. Please pick new dates.");
        }

        // Refresh the calendar so the newly taken nights are greyed out.
        try {
            await Promise.all([...monthsToRefresh].map((key) => loadMonth(key, true)));
        } catch (err) {
            /* calendar stays as it was; the message above already explains what happened */
        }
        picker.redraw();
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!selection) return;
        const attempted = selection;
        submitBtn.disabled = true;
        submitBtn.textContent = "Reserving…";
        let navigating = false;

        try {
            const res = await fetch(`/listings/${listingId}/bookings`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    "booking[checkIn]": attempted.checkIn,
                    "booking[checkOut]": attempted.checkOut,
                }),
            });

            // A redirect to the login page comes back as HTML, not JSON.
            if (!(res.headers.get("content-type") || "").includes("application/json")) {
                showAlert("warning", "Your session may have expired. Please log in again to book.");
                return;
            }
            const data = await res.json();

            if (res.status === 201) {
                navigating = true;
                window.location.assign(`/bookings/${data.booking._id}`);
            } else if (res.status === 409) {
                await handleConflict(data, attempted);
            } else {
                showAlert("danger", data.message || "Sorry, we couldn't complete that booking.");
            }
        } catch (err) {
            showAlert("danger", "Network problem. Please check your connection and try again.");
        } finally {
            if (!navigating) {
                submitBtn.textContent = "Reserve";
                submitBtn.disabled = !selection;
            }
        }
    });

    // ---- init ---------------------------------------------------------------
    picker = flatpickr(rangeInput, {
        mode: "range",
        inline: true,
        minDate: "today",
        dateFormat: "Y-m-d",
        showMonths: 1,
        disable: [isDisabled],
        onReady: refreshVisibleMonth, // current month on load
        onMonthChange: refreshVisibleMonth, // and every month the user pages to
        onYearChange: refreshVisibleMonth,
        onChange: onRangeChange,
    });
})();
