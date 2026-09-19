const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app.js");
const Booking = require("../models/booking.js");
const BookedDate = require("../models/bookedDate.js");
const { registerAndLogin } = require("./helpers/auth.js");
const { createListing } = require("./helpers/factories.js");
const { getAvailability } = require("../controller/booking.js");

// Always in the future so the "check-in is not in the past" rule never trips.
const YEAR = new Date().getUTCFullYear() + 1;
const jan = (day) => `${YEAR}-01-${String(day).padStart(2, "0")}`;

// Asking for JSON makes the booking route answer 201 + the booking instead of
// a flash + redirect.
const book = (agent, listingId, checkIn, checkOut) =>
    agent
        .post(`/listings/${listingId}/bookings`)
        .set("Accept", "application/json")
        .type("form")
        .send({ booking: { checkIn, checkOut } });

beforeAll(async () => {
    // Build the unique index (and the collections) before any transaction
    // touches them.
    await Booking.init();
    await BookedDate.init();
});

test("50 simultaneous bookings for the same dates: exactly one wins, 49 get 409", async () => {
    const BOOKERS = 50;
    const NIGHTS = 4; // 10 Jan -> 14 Jan

    // Owner is a distinct id, not one of the bookers.
    const listing = await createListing({ owner: new mongoose.Types.ObjectId() });
    const bookers = await Promise.all(Array.from({ length: BOOKERS }, () => registerAndLogin(app)));

    // All 50 requests are created up front and only awaited together, so they
    // are genuinely in flight at the same time.
    const results = await Promise.allSettled(
        bookers.map(({ agent }) => book(agent, listing._id, jan(10), jan(14)))
    );

    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const statuses = results.map((r) => r.value.status);

    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(BOOKERS - 1);

    // One set of nights, not 50 sets.
    expect(await BookedDate.countDocuments({ listing: listing._id })).toBe(NIGHTS);
    expect(await Booking.countDocuments({ listing: listing._id, status: "confirmed" })).toBe(1);
}, 120000);

test("partial overlap is rejected: 1-5 Jan then 3-7 Jan -> 409", async () => {
    const listing = await createListing();
    const { agent: a } = await registerAndLogin(app);
    const { agent: b } = await registerAndLogin(app);

    expect((await book(a, listing._id, jan(1), jan(5))).status).toBe(201);
    const res = await book(b, listing._id, jan(3), jan(7));

    expect(res.status).toBe(409);
    expect(res.text).toContain(`${jan(3)}, ${jan(4)}`);
    // The failed attempt left nothing behind: still just the first booking's 4 nights.
    expect(await BookedDate.countDocuments({ listing: listing._id })).toBe(4);
    expect(await Booking.countDocuments({ listing: listing._id })).toBe(1);
});

test("adjacent stays do not conflict: 1-5 Jan then 5-10 Jan -> 201 (checkout day is not a night)", async () => {
    const listing = await createListing();
    const { agent: a } = await registerAndLogin(app);
    const { agent: b } = await registerAndLogin(app);

    expect((await book(a, listing._id, jan(1), jan(5))).status).toBe(201);
    expect((await book(b, listing._id, jan(5), jan(10))).status).toBe(201);

    // 4 nights (1-4 Jan) + 5 nights (5-9 Jan)
    expect(await BookedDate.countDocuments({ listing: listing._id })).toBe(9);
});

test("cancelling a booking frees its nights so identical dates can be rebooked", async () => {
    const listing = await createListing();
    const { agent: a } = await registerAndLogin(app);
    const { agent: b } = await registerAndLogin(app);

    const first = await book(a, listing._id, jan(1), jan(5));
    expect(first.status).toBe(201);

    const cancel = await a.delete(`/listings/${listing._id}/bookings/${first.body.booking._id}`);
    expect(cancel.status).toBe(302);
    expect(await BookedDate.countDocuments({ listing: listing._id })).toBe(0);
    expect((await Booking.findById(first.body.booking._id)).status).toBe("cancelled");

    expect((await book(b, listing._id, jan(1), jan(5))).status).toBe(201);
    expect(await Booking.countDocuments({ listing: listing._id, status: "confirmed" })).toBe(1);
});

test("checkIn after checkOut is rejected with 400", async () => {
    const listing = await createListing();
    const { agent } = await registerAndLogin(app);

    const res = await book(agent, listing._id, jan(10), jan(5));

    expect(res.status).toBe(400);
    expect(await Booking.countDocuments({})).toBe(0);
    expect(await BookedDate.countDocuments({})).toBe(0);
});

test("booking your own listing is rejected with 400", async () => {
    const { agent, user } = await registerAndLogin(app);
    const User = require("../models/user.js");
    const me = await User.findOne({ username: user.username });
    const listing = await createListing({ owner: me._id });

    const res = await book(agent, listing._id, jan(1), jan(5));

    expect(res.status).toBe(400);
    expect(await Booking.countDocuments({})).toBe(0);
    expect(await BookedDate.countDocuments({})).toBe(0);
});

test("getAvailability returns exactly the booked nights of the requested month", async () => {
    const listing = await createListing();
    const other = await createListing({ title: "Some other listing" });
    const { agent } = await registerAndLogin(app);

    // Nights: 10, 11, 12 Jan | 20, 21 Jan | 31 Jan and 1 Feb (crosses the month boundary)
    expect((await book(agent, listing._id, jan(10), jan(13))).status).toBe(201);
    expect((await book(agent, listing._id, jan(20), jan(22))).status).toBe(201);
    expect((await book(agent, listing._id, jan(31), `${YEAR}-02-02`)).status).toBe(201);
    // Another listing's night in the same month must not leak in.
    expect((await book(agent, other._id, jan(15), jan(16))).status).toBe(201);

    expect(await getAvailability(listing._id, `${YEAR}-01`)).toEqual([
        jan(10), jan(11), jan(12), jan(20), jan(21), jan(31),
    ]);
    expect(await getAvailability(listing._id, `${YEAR}-02`)).toEqual([`${YEAR}-02-01`]);
    expect(await getAvailability(listing._id, `${YEAR}-03`)).toEqual([]);

    // Same data through the HTTP endpoint.
    const res = await request(app).get(`/listings/${listing._id}/availability?month=${YEAR}-02`);
    expect(res.status).toBe(200);
    expect(res.body.bookedDates).toEqual([`${YEAR}-02-01`]);
});

test("timezone consistency: the same calendar night from IST and UTC clients maps to one date key", async () => {
    const listing = await createListing();
    const { agent: ist } = await registerAndLogin(app);
    const { agent: utc } = await registerAndLogin(app);

    // "15 June" as it exists in two places. These are different instants
    // (14 Jun 18:30Z vs 15 Jun 00:00Z), but each client reads its own calendar
    // day off its own clock and sends that, so both send 2027-06-15.
    const istMidnight = new Date(`${YEAR}-06-15T00:00:00+05:30`);
    const utcMidnight = new Date(`${YEAR}-06-15T00:00:00Z`);
    const calendarDay = (date, timeZone) =>
        new Intl.DateTimeFormat("en-CA", { timeZone }).format(date); // YYYY-MM-DD
    const nextDay = (ymd) => new Date(Date.parse(`${ymd}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);

    const istDay = calendarDay(istMidnight, "Asia/Kolkata");
    const utcDay = calendarDay(utcMidnight, "UTC");
    expect(istDay).toBe(`${YEAR}-06-15`);
    expect(utcDay).toBe(istDay);

    expect((await book(ist, listing._id, istDay, nextDay(istDay))).status).toBe(201);
    const second = await book(utc, listing._id, utcDay, nextDay(utcDay));

    expect(second.status).toBe(409);
    // One row, stored at exactly UTC midnight of the 15th.
    const rows = await BookedDate.find({ listing: listing._id });
    expect(rows).toHaveLength(1);
    expect(rows[0].date.toISOString()).toBe(`${YEAR}-06-15T00:00:00.000Z`);
});

test("a full timestamp is rejected (400) instead of being shifted onto a different night", async () => {
    const listing = await createListing();
    const { agent } = await registerAndLogin(app);

    // 15 June 00:00 IST serialised the way a browser's toISOString() would:
    // its UTC date is the 14th, so accepting it would silently book the wrong night.
    const istMidnight = new Date(`${YEAR}-06-15T00:00:00+05:30`).toISOString();
    const res = await book(agent, listing._id, istMidnight, `${YEAR}-06-16`);

    expect(res.status).toBe(400);
    expect(await BookedDate.countDocuments({ listing: listing._id })).toBe(0);
    expect(await Booking.countDocuments({ listing: listing._id })).toBe(0);
});
