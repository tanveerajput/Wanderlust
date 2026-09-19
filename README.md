# 🌍 Wanderlust – Travel Listing & Review Platform

[![CI](https://github.com/tanveerajput/Wanderlust/actions/workflows/ci.yml/badge.svg)](https://github.com/tanveerajput/Wanderlust/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green)
![Express](https://img.shields.io/badge/Express.js-Framework-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![EJS](https://img.shields.io/badge/EJS-Templating-red)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Image%20Storage-blue)

A full-stack travel listing web application where users can explore destinations, create listings, upload images, leave reviews, authenticate securely, and view locations on an interactive map.

🔗 **Live Website:** https://wanderlust-prpw.onrender.com/
🔗 **GitHub Repository:** https://github.com/tanveerajput/Wanderlust/

---

# ✨ Features

- 🏠 Create, Edit & Delete travel listings with full CRUD support
- 🖼 Image Upload via Cloudinary + Multer
- 🗺 Interactive Maps using Leaflet.js + OpenStreetMap + Nominatim geocoding
- ⭐ Review System with star ratings and comments
- 🔐 User Authentication — Signup, Login, Logout using Passport.js
- 🛡 Authorization — Only listing owners can edit or delete their listings
- ✔ Input Validation using Joi schema validation
- 🧪 Integration test suite with CI running on every push
- 🔄 RESTful CRUD Architecture
- 🧹 Cascade Delete — Reviews auto-deleted when listing is removed
- 💬 Flash Messages for success and error feedback
- 🎨 Responsive UI with Bootstrap 5
- ☁️ Session Storage with connect-mongo
- 🌐 Deployed on Render with MongoDB Atlas

---

# 🧠 Project Highlights

- Built a full-stack Airbnb-style platform using Node.js, Express.js, MongoDB, and EJS
- Wrote an integration and concurrency test suite (Jest + Supertest + mongodb-memory-server)
  covering auth, listings, reviews, pagination, and transactional booking — including a
  50-concurrent-request double-booking test — with the authorization and booking tests
  each verified to fail when the guard or unique index they protect is removed
- Configured GitHub Actions CI to run the full suite on every push and pull request
- Implemented user authentication and session management using Passport.js + express-session
- Integrated Leaflet.js + Nominatim API for free interactive maps with forward geocoding (no API key required)
- Designed RESTful APIs for listings, reviews, and user auth
- Implemented role-based authorization — owners can only manage their own listings
- Integrated Cloudinary + Multer for cloud-based image upload and storage
- Used MongoDB Atlas for cloud database with connect-mongo for persistent sessions
- Structured backend using modular MVC architecture (models, routes, controllers, utils)
- Deployed on Render with environment-based configuration

---

# 🛠️ Tech Stack

## Frontend
- HTML5
- CSS3
- Bootstrap 5
- EJS Templates
- JavaScript

## Backend
- Node.js
- Express.js

## Database
- MongoDB Atlas
- Mongoose

## Authentication
- Passport.js
- Passport Local
- Passport Local Mongoose

## Testing & CI
- Jest
- Supertest
- mongodb-memory-server (`MongoMemoryReplSet`, since booking transactions need a replica set)
- GitHub Actions

## Cloud & Deployment
- Cloudinary
- Multer
- Render

## Maps & Geocoding
- Leaflet.js
- OpenStreetMap
- Nominatim API

---

# 📁 Complete Project Architecture

```bash
Wanderlust/
│
├── app.js                         # Express app configuration (exports the app)
├── server.js                      # Entry point — requires app.js and listens
├── cloudinary.js                  # Cloudinary configuration
├── middleware.js                  # Custom middleware (auth guards, validation)
├── schema.js                      # Joi validation schemas
├── jest.config.js                 # Jest configuration
├── package.json
├── package-lock.json
├── README.md
│
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions — runs tests on push/PR
│
├── controller/                    # MVC Controllers
│   ├── listing.js
│   ├── review.js
│   └── users.js
│
├── init/
│   ├── data.js                    # Seed data
│   └── index.js                   # DB seeder script
│
├── models/                        # Mongoose Models
│   ├── listing.js
│   ├── reviews.js
│   └── user.js
│
├── routes/                        # Express Routes
│   ├── listing.js
│   ├── review.js
│   └── user.js
│
├── scripts/
│   └── check-db.js                # Connection diagnostic tool
│
├── tests/                         # Integration test suite
│   ├── setup.js                   # In-memory MongoDB lifecycle
│   ├── smoke.test.js
│   ├── auth.test.js               # Signup, login, logout, sessions
│   ├── listings.test.js           # CRUD, authorization, cascade delete
│   ├── reviews.test.js            # Review validation and authorization
│   └── helpers/
│       ├── auth.js                # Authenticated supertest agent
│       └── factories.js           # Test data factories
│
├── utils/
│   ├── expresserror.js            # Custom error class
│   └── wrapasync.js               # Async wrapper
│
├── public/
│   ├── css/
│   │   ├── style.css
│   │   └── rating.css
│   └── js/
│       ├── script.js
│       └── map.js
│
├── views/
│   ├── includes/
│   │   ├── navbar.ejs
│   │   ├── footer.ejs
│   │   └── flash.ejs
│   │
│   ├── layouts/
│   │   └── boilerplate.ejs
│   │
│   ├── listings/
│   │   ├── index.ejs
│   │   ├── new.ejs
│   │   ├── edit.ejs
│   │   └── show.ejs
│   │
│   ├── users/
│   │   ├── signup.ejs
│   │   └── login.ejs
│   │
│   └── error.ejs
│
├── .env                           # Not committed — see setup below
└── .env.example                   # Template listing required variables
```

---

# ⚙ How the Application Works

1. Users sign up / log in securely via Passport.js authentication
2. Browse all travel listings on the homepage
3. Create new listings with title, description, price, location, country and image
4. Image is uploaded to Cloudinary, coordinates fetched via Nominatim geocoding
5. Each listing page shows details, an interactive Leaflet map, and all reviews
6. Logged-in users can submit reviews with star ratings
7. Only the listing owner can edit or delete their listing
8. Deleting a listing automatically removes all its reviews (cascade delete)
9. Flash messages give users real-time feedback on all actions

---

# ⚙ Installation & Setup

### Prerequisites
- Node.js 20 or higher
- MongoDB Atlas account (or a local MongoDB replica set)
- Cloudinary account (free tier is sufficient)

### 1. Clone the repository

```bash
git clone https://github.com/tanveerajput/Wanderlust.git
cd Wanderlust
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env` file in the project root

```env
ATLAS_URL=your_mongodb_atlas_connection_string
SECRET=your_session_secret
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
SEED_OWNER_ID=a_user_id_from_your_users_collection
```

> **Note on `ATLAS_URL`** — include the database name before the query string:
> `mongodb+srv://user:pass@cluster.mongodb.net/wanderlust?retryWrites=true&w=majority`
> Without it, Mongoose connects to a database named `test`.

### 4. Verify the database connection

```bash
node scripts/check-db.js
```

This checks that `ATLAS_URL` is defined, has a valid scheme, resolves via DNS, and
accepts a connection — reporting which step fails rather than a driver stack trace.

### 5. Seed the database (optional)

Sign up a user first at `/signup`, copy their `_id` from Atlas into `SEED_OWNER_ID`,
then:

```bash
node init/index.js
```

> ⚠️ This **deletes all existing listings** before inserting sample data.

### 6. Start the server

```bash
npm start
```

Server runs at **http://localhost:8080**

---

# 🗓️ Booking System

Guests can book a listing for a range of nights. The design goal is that
**double-booking is impossible at the database level**, not merely prevented by
application code.

| Route | Purpose |
|---|---|
| `POST /listings/:id/bookings` | create a booking (`booking[checkIn]`, `booking[checkOut]` as `YYYY-MM-DD`) |
| `DELETE /listings/:id/bookings/:bookingId` | cancel your own booking and free its nights |
| `GET /listings/:id/availability?month=YYYY-MM` | booked nights for a calendar month |

### How double-booking is prevented

Each booking is stored as one `Booking` document plus one `BookedDate` document
**per listing per night**. `BookedDate` has a unique compound index on
`(listing, date)`, so MongoDB itself rejects a second insert for the same
listing and night. Two concurrent bookings for overlapping dates cannot both
succeed regardless of timing, because the second insert violates the index —
this is enforcement at the storage layer, not a check-then-write race in
application code.

Creating a booking runs inside a single Mongoose transaction: load the listing,
reject the owner booking their own listing (400), create the `Booking`, then
`insertMany` the nights. A duplicate-key error (code `11000`) aborts the
transaction and returns **409 Conflict** naming the unavailable nights.
Transient transaction errors and write conflicts are retried up to 3 times with
100 / 200 / 400 ms backoff. Stays are half-open `[checkIn, checkOut)`: the
check-out day is not a booked night, so back-to-back stays do not conflict.

### Date handling

Only `YYYY-MM-DD` calendar dates are accepted. They are converted with
`Date.UTC(y, m, d)` from the literal digits, never through a local time zone, so
a booking made from IST and one made from UTC produce identical date keys. A
full timestamp such as `2027-06-14T18:30:00.000Z` is rejected with 400, because
accepting it would silently move the booking onto a different night. Check-in
must not be in the past and the maximum stay is 30 nights (Joi, `schema.js`).

### Proving it works

- **Concurrency test** (`tests/booking.concurrency.test.js`): 50 different users
  fire 50 simultaneous booking requests for the same dates on one listing.
  Exactly **one** gets `201` and the other 49 get `409`. The test also asserts
  that only one set of nights is stored (not 50 sets) and that exactly one
  confirmed booking exists.
- **Mutation check:** with `unique: true` temporarily removed from the index,
  all 50 requests returned `201` and the test failed. This confirms the test
  detects the vulnerability instead of passing incidentally.
- **Other cases covered:** partial overlap → 409, adjacent stays → 201, cancel
  then rebook the same dates → 201, check-in after check-out → 400, booking your
  own listing → 400, and `getAvailability` returning exactly the booked nights
  of a month with no leakage from other listings.

### IST / UTC investigation

The date-key tests were also checked by mutation. Replacing the UTC conversion
with a local-midnight `new Date(y, m, d)` made three tests fail, including the
IST-vs-UTC test, which asserts the stored value is exactly
`YYYY-MM-15T00:00:00.000Z`. Replacing it with `new Date(value)` is not
detectable: for a date-only string JavaScript already parses UTC midnight, so
the result is identical, and the timestamp-rejection test is what guards the
input format instead.

To make this class of bug fail everywhere, the test scripts in `package.json`
pin the time zone: `cross-env NODE_ENV=test TZ=Asia/Kolkata jest`. CI runners
default to UTC, so without the pin a local-time mistake could pass in CI and
fail on a developer's IST machine, or the reverse.

### Test infrastructure: replica set required

MongoDB rejects multi-document transactions on a standalone server, so the test
database is a single-node `MongoMemoryReplSet`. It is started once in
`tests/globalSetup.js` (and stopped in `tests/globalTeardown.js`), not in
`tests/setup.js`, because `MongoMemoryReplSet.create()` hangs when run inside a
Jest test file's VM context. `tests/setup.js` connects to the URI exposed as
`MONGO_URI_TEST`. Production runs on MongoDB Atlas, which supports transactions.

---

# 🧪 Testing

An integration and concurrency test suite using Jest, Supertest and
mongodb-memory-server, covering auth, listings, reviews, pagination, and
transactional booking. Tests run against a real in-memory MongoDB instance — no
mocking of the database layer. Because the booking flow uses multi-document
transactions, which MongoDB only allows on a replica set, the suite runs on a
single-node `MongoMemoryReplSet` (started once in `tests/globalSetup.js`) rather
than a standalone server.

```bash
npm test          # run once
npm run test:watch  # re-run on change
```

### What is covered

| Area | Cases |
|---|---|
| **Authentication** | signup creates a session · duplicate username rejected · wrong password creates no session · logout destroys the session |
| **Authorization** | non-owner cannot edit a listing · non-owner cannot delete a listing · non-author cannot delete a review |
| **Cascade delete** | deleting a listing removes all of its reviews |
| **Validation** | missing required fields rejected by Joi · rating above 5 rejected |
| **Access control** | unauthenticated POST creates nothing and redirects to `/login` |

Every test asserts **database state**, not only HTTP status codes — a rejected
request must also leave the documents unchanged.

### Verified against mutation

Each authorization test was checked by temporarily removing the `isowner`
middleware from the route. Both tests failed, confirming they detect the
vulnerability rather than passing incidentally. Removing the guard allowed a
non-owner to successfully delete another user's listing.

CI runs the full suite on every push and pull request via GitHub Actions.

---

# 💡 Key Backend Concepts Implemented

- MVC-style modular project structure
- RESTful API architecture (GET, POST, PUT, DELETE)
- User authentication with Passport.js + passport-local-mongoose
- Role-based authorization middleware
- Session management with express-session + connect-mongo
- Joi schema validation for listings and reviews
- Custom async error handler (wrapAsync)
- Centralized error handling middleware
- GeoJSON geometry storage in MongoDB
- Cloudinary image upload integration
- Forward geocoding with Nominatim API
- Cascade delete using Mongoose post middleware
- Integration testing with an in-memory database
- Separation of app configuration from server startup for testability

---

# 🔮 Future Improvements

- 🗓 **Booking system with double-booking prevention** — unique compound index plus
  MongoDB transactions, verified by a concurrency test
- 🔍 **Geospatial search** — 2dsphere index with `$geoNear` for radius and
  map-viewport queries
- ⚡ **Query optimisation** — eliminate N+1 patterns, with measured before/after latency
- 🛡 **Rate limiting** on authentication routes
- 📊 Average rating calculation per listing
- ❤️ Wishlist / save listings

---

# 👩‍💻 Author

**Tanvee Rajput**
🔗 [GitHub](https://github.com/tanveerajput)
🌐 [Live Project](https://wanderlust-prpw.onrender.com/)

---

# 📜 License

Built for educational purposes as part of a full-stack web development learning journey.

# ⭐ If you liked this project

Give this repository a ⭐ on GitHub!