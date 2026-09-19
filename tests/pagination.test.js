const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app.js");
const Listing = require("../models/listing.js");

const PER_PAGE = 20;
const TOTAL = 45; // 3 pages: 20 + 20 + 5

beforeEach(async () => {
    const owner = new mongoose.Types.ObjectId();
    const docs = Array.from({ length: TOTAL }, (_, i) => ({
        title: `Listing ${String(i + 1).padStart(2, "0")}`,
        description: "Seeded for pagination tests",
        location: "Manali",
        country: "India",
        price: 1000 + i,
        geometry: { type: "Point", coordinates: [77.209, 28.6139] },
        owner,
    }));
    await Listing.insertMany(docs);
});

// Each card links to /listings/<id>; pull the ids out of the rendered page.
function listingIds(html) {
    return [...html.matchAll(/href="\/listings\/([0-9a-f]{24})"/g)].map((m) => m[1]);
}

test("GET /listings?page=2 returns a distinct 20-listing slice", async () => {
    const page1 = await request(app).get("/listings?page=1");
    const page2 = await request(app).get("/listings?page=2");

    const ids1 = listingIds(page1.text);
    const ids2 = listingIds(page2.text);

    expect(page2.status).toBe(200);
    expect(ids1).toHaveLength(PER_PAGE);
    expect(ids2).toHaveLength(PER_PAGE);
    expect(ids2.filter((id) => ids1.includes(id))).toEqual([]);
    expect(page2.text).toContain("Page 2 of 3");
});

test("GET /listings with no page param defaults to page 1", async () => {
    const noParam = await request(app).get("/listings");
    const page1 = await request(app).get("/listings?page=1");

    expect(noParam.status).toBe(200);
    expect(listingIds(noParam.text)).toEqual(listingIds(page1.text));
    expect(noParam.text).toContain("Page 1 of 3");
});

test("GET /listings?page=999 returns 200 and clamps to the last page", async () => {
    const res = await request(app).get("/listings?page=999");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Page 3 of 3");
    expect(listingIds(res.text)).toHaveLength(TOTAL - 2 * PER_PAGE);
});

test("GET /listings?page=abc returns 200 and falls back to page 1", async () => {
    const res = await request(app).get("/listings?page=abc");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Page 1 of 3");
    expect(listingIds(res.text)).toHaveLength(PER_PAGE);
});
