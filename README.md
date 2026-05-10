# 📂 Project Architecture
# 🌍 Wanderlust – Travel Listing & Review Platform

![Node.js](https://img.shields.io/badge/Node.js-Backend-green)
![Express](https://img.shields.io/badge/Express.js-Framework-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![EJS](https://img.shields.io/badge/EJS-Templating-red)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Image%20Storage-blue)

Wanderlust is a full-stack travel listing web application inspired by Airbnb.  
Users can explore travel destinations, create property listings, upload images, and leave reviews.

This project demonstrates **RESTful API development, backend architecture, validation, database relationships, and cloud image storage integration.**

---

# 🚀 Key Features

- 🏠 Create, edit, and delete travel listings  
- 🖼 Upload listing images using **Cloudinary**  
- ⭐ Add and delete reviews with rating system  
- ✔ Input validation using **Joi schema validation**  
- 🔐 Middleware-based error handling  
- 🔄 RESTful CRUD architecture  
- 🧹 Automatic deletion of reviews when listing is deleted  
- 🎨 Responsive UI built using **Bootstrap**

---

# 🧠 Project Highlights

- Built a full-stack Airbnb-style listing platform using **Node.js, Express.js, MongoDB, and EJS**
- Designed **RESTful APIs** for managing listings and reviews
- Implemented **middleware-driven validation and centralized error handling**
- Integrated **Cloudinary + Multer** for image upload and storage
- Structured backend using **modular architecture (models, utilities, middleware)**

---

# 🛠 Tech Stack

### Frontend
- HTML
- CSS
- Bootstrap
- EJS Templates

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

### Tools & Libraries
- Cloudinary (Image Storage)
- Multer (File Uploads)
- Joi (Validation)
- Method Override
- Dotenv

---

# 📂 Project Architecture
Major-project
│
├── models
│ ├── listing.js
│ └── reviews.js
│
├── views
│ ├── listings
│ │ ├── index.ejs
│ │ ├── show.ejs
│ │ ├── new.ejs
│ │ └── edit.ejs
│ │
│ └── layouts
│
├── public
│ └── css / js
│
├── utils
│ ├── wrapasync.js
│ └── expresserror.js
│
├── schema.js
├── app.js
└── README.md


---

# ⚙ How the Application Works

1. Users can explore travel listings on the homepage.
2. New listings can be created with image uploads stored in **Cloudinary**.
3. Listings can be edited or deleted.
4. Users can submit reviews with ratings and comments.
5. Reviews are stored in **MongoDB** and linked to listings.
6. When a listing is deleted, all associated reviews are automatically removed.

---


## ⚙ Installation & Setup

### Clone the repository
git clone https://github.com/yourusername/wanderlust.git


### Navigate into project
cd wanderlust

### Install dependencies
npm install

### Create `.env` file
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_api_key
CLOUD_API_SECRET=your_api_secret

### Start MongoDB
mongodb://127.0.0.1:27017/vanderlust

### Run server
nodemon app.js
Server runs at:
http://localhost:8080


---

# 💡 Key Backend Concepts Implemented

- RESTful API architecture
- MVC-style project structure
- Middleware-based error handling
- Joi schema validation
- MongoDB relationships using Mongoose
- Cloudinary image upload integration
- Async error handling using custom wrapper functions

---

# 🔮 Future Improvements

- 👤 User authentication (Login / Signup)
- ❤️ Wishlist functionality
- ⭐ Average rating calculation
- 🔍 Search and filtering
- 📍 Map integration
- 📱 Fully responsive mobile UI
- 🌐 Deployment (Render / Vercel)

---

# 👨‍💻 Author

**Tanvee Rajput**

---

# 📜 License

This project is built for educational purposes.