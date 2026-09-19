const mongoose = require("mongoose");
const listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const BookedDate = require("../models/bookedDate.js");
const expresserror = require("../utils/expresserror.js");

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RETRY_DELAYS_MS = [100, 200, 400];

// Thrown inside the transaction when the unique index rejects a night, so the
// transaction aborts; converted to a 409 once we are outside it.
class DateConflictError extends Error {}

// Parses a YYYY-MM-DD calendar date to UTC midnight. The year/month/day are
// taken literally from the string and never pass through the server's or the
// client's local time zone, so a booking from IST and one from UTC produce
// identical keys for the unique index. Full timestamps are rejected on purpose:
// "2026-09-22T00:00:00+05:30" is 2026-09-21 in UTC and would shift the night.
function parseCalendarDate(value, label) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ""));
    if (!match) {
        throw new expresserror(400, `${label} must be a date in YYYY-MM-DD format`);
    }
    const [y, m, d] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
    const date = new Date(Date.UTC(y, m, d));
    // Date.UTC silently rolls 2026-02-31 over into March; reject it instead.
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m || date.getUTCDate() !== d) {
        throw new expresserror(400, `${label} is not a valid date`);
    }
    return date;
}

// Nights in [checkIn, checkOut): the checkOut day itself is not booked.
function expandNights(checkIn, checkOut) {
    const nights = [];
    for (let t = checkIn.getTime(); t < checkOut.getTime(); t += MS_PER_DAY) {
        nights.push(new Date(t));
    }
    return nights;
}

const toDateKey = (date) => date.toISOString().slice(0, 10);

// Stored nights are UTC midnight, so they must be formatted in UTC too or they
// would display as the previous day west of Greenwich.
const formatNight = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
        timeZone: "UTC",
        day: "numeric",
        month: "short",
        year: "numeric",
    });

const startOfTodayUTC = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const isDuplicateKey = (err) =>
    err?.code === 11000 || err?.writeErrors?.some((e) => e.code === 11000);

const isTransient = (err) =>
    Boolean(err?.hasErrorLabel?.("TransientTransactionError")) ||
    err?.codeName === "WriteConflict" ||
    err?.code === 112;

// Up to 3 retries (4 attempts) with 100ms / 200ms / 400ms backoff.
async function withRetry(fn) {
    for (let attempt = 0; ; attempt++) {
        try {
            return await fn();
        } catch (err) {
            if (!isTransient(err) || attempt >= RETRY_DELAYS_MS.length) throw err;
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
        }
    }
}

// Fresh session per attempt; anything thrown inside `work` aborts the transaction.
function runInTransaction(work) {
    return withRetry(async () => {
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(() => work(session));
        } finally {
            await session.endSession();
        }
    });
}

module.exports.createBooking = async (req, res) => {
    const { id } = req.params;
    const checkIn = parseCalendarDate(req.body.booking.checkIn, "Check-in");
    const checkOut = parseCalendarDate(req.body.booking.checkOut, "Check-out");
    const nights = expandNights(checkIn, checkOut);
    if (nights.length === 0) {
        throw new expresserror(400, "Check-out must be after check-in");
    }

    let created;
    try {
        await runInTransaction(async (session) => {
            const found = await listing.findById(id).session(session);
            if (!found) throw new expresserror(404, "Listing not found");
            if (found.owner && found.owner.equals(req.user._id)) {
                throw new expresserror(400, "You cannot book your own listing");
            }

            const [booking] = await Booking.create(
                [{
                    listing: found._id,
                    user: req.user._id,
                    checkIn,
                    checkOut,
                    nights: nights.length,
                    totalPrice: found.price * nights.length,
                }],
                { session }
            );
            created = booking;

            try {
                await BookedDate.insertMany(
                    nights.map((date) => ({ listing: found._id, date, booking: booking._id })),
                    { ordered: true, session }
                );
            } catch (err) {
                if (isDuplicateKey(err)) throw new DateConflictError();
                throw err;
            }
        });
    } catch (err) {
        if (!(err instanceof DateConflictError)) throw err;
        // The transaction is aborted, so look up which nights are taken now.
        const taken = await BookedDate.find({ listing: id, date: { $in: nights } })
            .sort({ date: 1 })
            .lean();
        const list = taken.length
            ? taken.map((t) => toDateKey(t.date)).join(", ")
            : `${toDateKey(checkIn)} to ${toDateKey(checkOut)}`;
        const conflict = new expresserror(409, `These dates are no longer available: ${list}`);
        // Machine-readable copy of the same nights, for the booking widget.
        conflict.unavailableDates = taken.map((t) => toDateKey(t.date));
        throw conflict;
    }

    // JSON clients get 201 + the booking; browsers get the usual flash + redirect.
    if (req.accepts(["html", "json"]) === "json") {
        return res.status(201).json({ booking: created });
    }
    req.flash("success", "Booking confirmed");
    return res.redirect(`/listings/${id}`);
};

module.exports.cancelBooking = async (req, res) => {
    const { id, bookingId } = req.params;

    await runInTransaction(async (session) => {
        const booking = await Booking.findById(bookingId).session(session);
        if (!booking || !booking.listing.equals(id)) {
            throw new expresserror(404, "Booking not found");
        }
        if (!booking.user.equals(req.user._id)) {
            throw new expresserror(403, "You can only cancel your own bookings");
        }
        if (booking.status === "cancelled") {
            throw new expresserror(400, "Booking is already cancelled");
        }
        booking.status = "cancelled";
        await booking.save({ session });
        // Frees the nights: the unique index no longer holds them.
        await BookedDate.deleteMany({ booking: booking._id }, { session });
    });

    req.flash("success", "Booking cancelled");
    return res.redirect("/bookings");
};

// month is "YYYY-MM"; returns the booked nights in it as "YYYY-MM-DD" strings.
const getAvailability = async (listingId, month) => {
    const match = /^(\d{4})-(\d{2})$/.exec(String(month ?? ""));
    const monthIndex = match ? Number(match[2]) - 1 : -1;
    if (monthIndex < 0 || monthIndex > 11) {
        throw new expresserror(400, "month must be in YYYY-MM format");
    }
    const start = new Date(Date.UTC(Number(match[1]), monthIndex, 1));
    const end = new Date(Date.UTC(Number(match[1]), monthIndex + 1, 1));
    const rows = await BookedDate.find({ listing: listingId, date: { $gte: start, $lt: end } })
        .sort({ date: 1 })
        .lean();
    return rows.map((row) => toDateKey(row.date));
};
module.exports.getAvailability = getAvailability;

module.exports.showAvailability = async (req, res) => {
    const bookedDates = await getAvailability(req.params.id, req.query.month);
    return res.json({ month: req.query.month, bookedDates });
};

module.exports.listMyBookings = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing", "title location country")
        .sort({ checkIn: 1 });

    // A stay counts as upcoming until its check-out day; cancelled ones never do.
    const today = startOfTodayUTC();
    const isUpcoming = (b) => b.status === "confirmed" && b.checkOut > today;
    const upcoming = bookings.filter(isUpcoming);
    const pastOrCancelled = bookings.filter((b) => !isUpcoming(b)).reverse();

    return res.render("bookings/index.ejs", { upcoming, pastOrCancelled, fmt: formatNight });
};

module.exports.showBooking = async (req, res) => {
    const { bookingId } = req.params;
    const booking = mongoose.isValidObjectId(bookingId)
        ? await Booking.findById(bookingId).populate("listing", "title location country price")
        : null;
    if (!booking) throw new expresserror(404, "Booking not found");
    if (!booking.user.equals(req.user._id)) {
        throw new expresserror(403, "You can only view your own bookings");
    }
    return res.render("bookings/show.ejs", { booking, fmt: formatNight });
};
