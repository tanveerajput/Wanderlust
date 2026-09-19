// One document per listing per night. The unique compound index means MongoDB
// itself rejects a second insert for the same listing+date. Two concurrent
// bookings for overlapping dates cannot both succeed regardless of timing,
// because the second insert violates the index. This is enforcement at the
// storage layer, not a check-then-write race in application code.
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookedDateSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: "listing",
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    booking: {
        type: Schema.Types.ObjectId,
        ref: "booking",
        required: true,
    },
});

bookedDateSchema.index({ listing: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("bookedDate", bookedDateSchema);
