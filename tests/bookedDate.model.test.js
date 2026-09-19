const mongoose = require("mongoose");
const BookedDate = require("../models/bookedDate.js");

beforeAll(async () => {
    // Make sure the unique index exists before the first insert.
    await BookedDate.init();
});

test("a second BookedDate for the same listing and date is rejected with E11000", async () => {
    const listing = new mongoose.Types.ObjectId();
    const date = new Date("2030-01-15T00:00:00.000Z");

    await BookedDate.create({ listing, date, booking: new mongoose.Types.ObjectId() });

    const err = await BookedDate.create({
        listing,
        date,
        booking: new mongoose.Types.ObjectId(),
    }).catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("MongoServerError");
    expect(err.code).toBe(11000);
    expect(await BookedDate.countDocuments({ listing, date })).toBe(1);
});

test("the same date on a different listing is allowed", async () => {
    const date = new Date("2030-01-15T00:00:00.000Z");

    await BookedDate.create({ listing: new mongoose.Types.ObjectId(), date, booking: new mongoose.Types.ObjectId() });
    await expect(
        BookedDate.create({ listing: new mongoose.Types.ObjectId(), date, booking: new mongoose.Types.ObjectId() })
    ).resolves.toBeDefined();
});
