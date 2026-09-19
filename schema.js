const Joi = require('joi');
module.exports.listingschema = Joi.object({
listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    price: Joi.number().required().min(0),
    image: Joi.string().allow("",null),
}).required(),

});
module.exports.reviewSchema=Joi.object({
    review:Joi.object({
        rating:Joi.number().required().min(1).max(5),
        comment:Joi.string().required(),
    }).required()
})

const MAX_NIGHTS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

module.exports.bookingSchema = Joi.object({
    booking: Joi.object({
        checkIn: Joi.date().required().custom((value, helpers) => {
            // Compared against the start of today so booking for today is allowed.
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            if (value < startOfToday) {
                return helpers.error("date.min", { limit: startOfToday });
            }
            return value;
        }),
        checkOut: Joi.date().required().greater(Joi.ref("checkIn")),
    })
        .required()
        .custom((value, helpers) => {
            const nights = Math.round((value.checkOut - value.checkIn) / MS_PER_DAY);
            if (nights > MAX_NIGHTS) {
                return helpers.message(`Maximum stay is ${MAX_NIGHTS} nights`);
            }
            return value;
        }),
});
