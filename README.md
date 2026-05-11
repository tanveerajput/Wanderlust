# 📂 Project Architecture
# 🌍 Wanderlust – Travel Listing & Review Platform

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
- 🔄 RESTful CRUD Architecture
- 🧹 Cascade Delete — Reviews auto-deleted when listing is removed
- 💬 Flash Messages for success and error feedback
- 🎨 Responsive UI with Bootstrap 5
- ☁️ Session Storage with connect-mongo
- 🌐 Deployed on Render with MongoDB Atlas

---

🧠 Project Highlights

- Built a full-stack Airbnb-style platform using Node.js, Express.js, MongoDB, and EJS
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
├── cloudinary.js                  # Cloudinary configuration
├── middleware.js                  # Custom middleware functions
├── schema.js                      # Joi validation schemas
├── app.js                         # Main Express application
├── package.json
├── package-lock.json
├── README.md
│
├── controller/                    # MVC Controllers
│   ├── listing.js
│   ├── review.js
│   └── users.js
│
├── init/
│   ├── data.js                    # Seed data
│   |__ index.js                   # DB initialization
│   
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
├── utils/
│   ├── expresserror.js            # Custom error class
│   └── wrapasync.js               # Async wrapper
│
├── public/
│   ├── css/
│   │   ├── style.css
│   │   └── rating.css
│   │
│   ├── js/
│       ├── script.js
│       └── map.js
│   
│  
│
├── views/
│   │
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
└── .env

---

⚙ How the Application Works

1. Users sign up / log in securely via Passport.js authentication
2. Browse all travel listings on the homepage
3. Create new listings with title, description, price, location, country and image
4. Image is uploaded to Cloudinary, coordinates fetched via Nominatim geocoding
5. Each listing page shows details, an interactive Leaflet map, and all reviews
6. Logged-in users can submit reviews with star ratings
7. Only the listing owner can edit or delete their listing
8. Deleting a listing automatically removes all its reviews (cascade delete)
9.Flash messages give users real-time feedback on all actions
