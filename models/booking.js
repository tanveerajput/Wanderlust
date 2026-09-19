const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
    {
        listing: {
            type: Schema.Types.ObjectId,
            ref: "listing",
            required: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        checkIn: {
            type: Date,
            required: true,
        },
        checkOut: {
            type: Date,
            required: true,
        },
        nights: Number,
        totalPrice: Number,
        status: {
            type: String,
            enum: ["confirmed", "cancelled"],
            default: "confirmed",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("booking", bookingSchema);
