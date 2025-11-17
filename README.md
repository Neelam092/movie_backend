# Movie Backend (NestJS-style, JavaScript ES modules)

This is a small backend project built with NestJS-style structure but implemented in pure JavaScript (ES modules). It provides JWT authentication, MongoDB storage via Mongoose, movie CRUD with image uploads, Swagger docs, and consistent error responses.

## Features
- JWT Authentication (single hardcoded admin user via env)
- Movie CRUD (title, publishingYear, poster)
- Poster file upload using multer stored in `/uploads`
- Pagination on list endpoint
 - Validation is intentionally minimal (no Joi) — controllers use lightweight checks or no-op middleware.

- Global exception filter for consistent responses
- Swagger UI at `/docs`

## Quick start

1. Install dependencies

```powershell
cd movie-backend-nestjs-js
npm install
```

2. Create `.env` from `.env.example` and fill values. Example minimal:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/moviesdb
JWT_SECRET=supersecret
JWT_EXPIRES_IN=1h
ADMIN_EMAIL=admin@example.com
# Create a bcrypt hash for a password and paste here. You can generate one with node - see README instructions
ADMIN_PASSWORD_HASH=$2b$10$...yourhash...
UPLOAD_DIR=uploads
```

To create a password hash quickly using Node REPL:

```powershell
node -e "const bcrypt=require('bcrypt');bcrypt.hash('yourpassword',10).then(h=>console.log(h));"
```

3. Run (development with nodemon):

```powershell
npm run start:dev
```

or production:

```powershell
npm start
```

4. Swagger UI

Open http://localhost:5000/docs

5. Endpoints

- POST /auth/login { email, password } -> { access_token }
- GET /movies?page=1&limit=10
- GET /movies/:id
- POST /movies (multipart: fields title,publishingYear and file poster) protected
- PUT /movies/:id (multipart) protected
- DELETE /movies/:id protected

Protected routes require Authorization: Bearer <token>

## Notes
- This project intentionally uses express-style wiring instead of full TypeScript Nest CLI for clarity and to meet the "no TypeScript" requirement.
- Keep .env secure; do not commit real secrets.

## MongoDB
Run a local MongoDB instance and set `MONGODB_URI` accordingly. For testing, you can use a Docker container:

```powershell
# Start a mongodb container
docker run --name movies-mongo -p 27017:27017 -d mongo:6
```

Then connect using the default URI `mongodb://localhost:27017/moviesdb`.
