# 🌍 Wanderlust – Travel Listing & Review Platform

[![CI](https://github.com/tanveerajput/Wanderlust/actions/workflows/ci.yml/badge.svg)](https://github.com/tanveerajput/Wanderlust/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green)
![Express](https://img.shields.io/badge/Express.js-Framework-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![EJS](https://img.shields.io/badge/EJS-Templating-red)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Image%20Storage-blue)
![Tests](https://img.shields.io/badge/tests-15%20passing-brightgreen)

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
- Wrote 15 integration tests (Jest + Supertest + mongodb-memory-server) covering the
  authorization boundary, cascade deletion, and validation — each authorization test
  verified to fail when its guard middleware is removed
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
- mongodb-memory-server
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

# 🧪 Testing

15 integration tests using Jest, Supertest and mongodb-memory-server. Tests run
against a real in-memory MongoDB instance — no mocking of the database layer.

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