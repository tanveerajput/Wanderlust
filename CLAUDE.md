\# Wanderlust — Project Context



\## What this is

Airbnb-style travel listing platform. Node.js + Express + MongoDB (Mongoose) + EJS.

Deployed on Render with MongoDB Atlas.



\## Architecture

MVC. `models/` Mongoose schemas, `controller/` business logic, `routes/` Express

routers, `views/` EJS templates, `utils/` error helpers, `middleware.js` auth guards.



\## Conventions

\- Async route handlers are wrapped in `wrapAsync` from `utils/wrapasync.js`

\- Errors thrown as `ExpressError` from `utils/expresserror.js`

\- Validation via Joi schemas in `schema.js`

\- Auth via Passport.js local strategy; `isLoggedIn` and `isOwner` in `middleware.js`

\- Flash messages via `connect-flash` for user feedback



\## Key models

\- `Listing` — title, description, price, location, country, image, geometry (GeoJSON

&#x20; Point), owner (ref User), reviews (ref Review array)

\- `Review` — rating, comment, author (ref User)

\- `User` — passport-local-mongoose



\## Rules for changes

\- Do NOT change existing route paths or template variable names without saying so

\- Always use `wrapAsync` on new async routes

\- New env vars must be documented in README setup section

\- Run `npm test` before declaring a task done

