const request = require("supertest");
const app = require("../app.js");
const User = require("../models/user.js");
const Booking = require("../models/booking.js");
const { registerAndLogin } = require("./helpers/auth.js");
const { createListing } = require("./helpers/factories.js");

const YEAR = new Date().getUTCFullYear() + 1;
const jan = (day) => `${YEAR}-01-${String(day).padStart(2, "0")}`;
const utc = (ymd) => new Date(`${ymd}T00:00:00.000Z`);

const book = (agent, listingId, checkIn, checkOut) =>
    agent
        .post(`/listings/${listingId}/bookings`)
        .set("Accept", "application/json")
        .type("form")
        .send({ booking: { checkIn, checkOut } });

// Past stays cannot be created through the API (check-in must not be in the
// past), so history is inserted directly.
async function insertBooking({ listing, username, checkIn, checkOut, status = "confirmed" }) {
    const user = await User.findOne({ username });
    const nights = Math.round((utc(checkOut) - utc(checkIn)) / 86400000);
    return Booking.create({
        listing: listing._id,
        user: user._id,
        checkIn: utc(checkIn),
        checkOut: utc(checkOut),
        nights,
        totalPrice: nights * listing.price,
        status,
    });
}

test("GET /bookings while logged out redirects to /login", async () => {
    const res = await request(app).get("/bookings");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
});

test("GET /bookings separates upcoming from past/cancelled, and only upcoming can be cancelled", async () => {
    const { agent, user } = await registerAndLogin(app);
    const { agent: other, user: otherUser } = await registerAndLogin(app);

    const upcomingListing = await createListing({ title: "Upcoming Lodge", price: 1000 });
    const pastListing = await createListing({ title: "Past Palace", price: 1000 });
    const cancelledListing = await createListing({ title: "Cancelled Cabin", price: 1000 });
    const othersListing = await createListing({ title: "Someone Elses Villa", price: 1000 });

    const upcoming = await insertBooking({ listing: upcomingListing, username: user.username, checkIn: jan(10), checkOut: jan(12) });
    const past = await insertBooking({ listing: pastListing, username: user.username, checkIn: "2020-03-01", checkOut: "2020-03-04" });
    const cancelled = await insertBooking({ listing: cancelledListing, username: user.username, checkIn: jan(20), checkOut: jan(22), status: "cancelled" });
    await insertBooking({ listing: othersListing, username: otherUser.username, checkIn: jan(10), checkOut: jan(12) });

    const res = await agent.get("/bookings");
    const html = res.text;

    expect(res.status).toBe(200);

    const pastHeading = html.indexOf('id="past-bookings"');
    expect(pastHeading).toBeGreaterThan(-1);
    const [upcomingHtml, pastHtml] = [html.slice(0, pastHeading), html.slice(pastHeading)];

    expect(upcomingHtml).toContain("Upcoming Lodge");
    expect(pastHtml).toContain("Past Palace");
    expect(pastHtml).toContain("Cancelled Cabin");
    expect(pastHtml).toContain("Cancelled</span>");
    expect(pastHtml).not.toContain("Upcoming Lodge");
    expect(html).not.toContain("Someone Elses Villa");

    // A cancel form exists for the upcoming booking and for nothing else.
    expect(html).toContain(`/listings/${upcomingListing._id}/bookings/${upcoming._id}?_method=DELETE`);
    expect(html).not.toContain(`/bookings/${past._id}?_method=DELETE`);
    expect(html).not.toContain(`/bookings/${cancelled._id}?_method=DELETE`);
    expect(html.match(/_method=DELETE/g)).toHaveLength(1);

    // Dates are shown as the stored calendar days, not shifted by time zone.
    expect(html).toContain("10 Jan");
    expect(html).toContain("12 Jan");
});

test("cancelling from My bookings redirects back to /bookings and the stay moves to cancelled", async () => {
    const { agent } = await registerAndLogin(app);
    const listing = await createListing({ title: "Cancel Me Cottage" });
    const created = await book(agent, listing._id, jan(10), jan(12));
    expect(created.status).toBe(201);

    const res = await agent.delete(`/listings/${listing._id}/bookings/${created.body.booking._id}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/bookings");
    const page = await agent.get("/bookings");
    expect(page.text.indexOf("Cancel Me Cottage")).toBeGreaterThan(page.text.indexOf('id="past-bookings"'));
});

test("the confirmation page shows the booking to its owner only", async () => {
    const { agent } = await registerAndLogin(app);
    const { agent: stranger } = await registerAndLogin(app);
    const listing = await createListing({ title: "Confirmed Chalet", price: 1500, location: "Manali" });
    const created = await book(agent, listing._id, jan(10), jan(13));
    const id = created.body.booking._id;

    const mine = await agent.get(`/bookings/${id}`);
    expect(mine.status).toBe(200);
    expect(mine.text).toContain("Booking confirmed");
    expect(mine.text).toContain("Confirmed Chalet");
    expect(mine.text).toContain("10 Jan");
    expect(mine.text).toContain("13 Jan");
    expect(mine.text).toContain("4,500"); // 3 nights x 1500

    expect((await stranger.get(`/bookings/${id}`)).status).toBe(403);
    expect((await agent.get("/bookings/not-an-id")).status).toBe(404);
    expect((await request(app).get(`/bookings/${id}`)).headers.location).toBe("/login");
});

test("a 409 for a JSON client carries the specific unavailable dates", async () => {
    const listing = await createListing();
    const { agent: first } = await registerAndLogin(app);
    const { agent: second } = await registerAndLogin(app);
    expect((await book(first, listing._id, jan(10), jan(13))).status).toBe(201);

    const res = await book(second, listing._id, jan(12), jan(15));

    expect(res.status).toBe(409);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body.unavailableDates).toEqual([jan(12)]);
    expect(res.body.message).toContain(jan(12));
});

test("errors still render the HTML error page for browsers", async () => {
    const res = await request(app).get("/no-such-page");

    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("page not found");
});

test("the listing page shows the booking widget to a visitor who can book, and keeps the existing display", async () => {
    const listing = await createListing({ title: "Widget Lodge", price: 2500 });
    const { agent } = await registerAndLogin(app);

    const res = await agent.get(`/listings/${listing._id}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain('id="booking-widget"');
    expect(res.text).toContain(`data-listing-id="${listing._id}"`);
    expect(res.text).toContain('data-price="2500"');
    expect(res.text).toContain("/js/booking.js");
    // existing listing + review display untouched
    expect(res.text).toContain("Widget Lodge");
    expect(res.text).toContain("Leave a review");
});

test("the listing page asks a logged-out visitor to log in instead of showing the widget", async () => {
    const listing = await createListing({ title: "Public Lodge" });

    const res = await request(app).get(`/listings/${listing._id}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Log in</a> to book this stay");
    expect(res.text).not.toContain('id="booking-widget"');
    expect(res.text).toContain("Public Lodge");
});

test("the listing owner does not see the booking widget", async () => {
    const { agent, user } = await registerAndLogin(app);
    const me = await User.findOne({ username: user.username });
    const listing = await createListing({ title: "My Own Lodge", owner: me._id });

    const res = await agent.get(`/listings/${listing._id}`);

    expect(res.status).toBe(200);
    expect(res.text).not.toContain('id="booking-widget"');
    expect(res.text).not.toContain("Book this stay");
    expect(res.text).toContain("My Own Lodge");
});
