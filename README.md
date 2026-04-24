<div align="center">

# ⚙️ IRBS Car Rental

### Backend API

**IRBS** (Intelligent Rental Booking System) is a full-stack car rental web application built as a **BSc Computer Science Individual Project** — designed and developed within **3 months** with a focus on real-world architecture, clean code, and production-quality user experience.

[![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)](https://mongoosejs.com/)
[![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)](https://jwt.io/)

</div>

---

## 📌 Overview

This repository is the **Backend API** — the single server powering both the Customer UI and the Admin Dashboard. It handles all business logic, authentication, data persistence, and file uploads through a structured RESTful API built with Node.js and Express.
 
The backend follows an **MVC-inspired architecture**, with a clear separation between routes, controllers, models, and middleware. All data is stored in MongoDB and accessed through Mongoose ODM, keeping the data layer clean and schema-driven.
 
Authentication is handled using **JWT tokens**, stored and cleared via HTTP-only cookies using `cookie-parser` — providing a secure and seamless session experience. Role-based middleware (`adminOnly`, `customerAccess`, `verifiedCustomerOnly`) ensures that every endpoint is accessible only to the right type of user.
 
The server also supports **multi-file image uploads** via Multer — handling profile pictures, driving licence images, and car images — and includes background job support, reusable helpers, and email/document templating utilities to support real-world functionality beyond basic CRUD.

---

## 🔗 Related Repositories

| Repo | Role | Link |
|---|---|---|
| **Customer UI** | What customers see and interact with | [my-project](https://github.com/Min-Thant794/my-project) |
| **Admin Dashboard** | Internal management interface for admins | [car-rental-admin](https://github.com/Min-Thant794/car-rental-admin) |
| **Backend API** *(this repo)* | RESTful API powering both frontends | [car-rental-backend](https://github.com/Min-Thant794/car-rental-backend) |

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication** | Secure token-based auth for both customers and admins |
| 🚘 **Car Management API** | Full CRUD operations for the vehicle fleet |
| 📅 **Booking Management API** | Create, update, and cancel rental bookings |
| 👥 **User Management API** | Profile updates and admin-level user controls |
| 🖼️ **Image Uploads** | Car image handling via Multer |
| ✅ **Request Validation** | Input validation on all incoming requests |
| 🌐 **CORS Support** | Configured to allow requests from both frontend apps |
| 🍪 **Cookie-based Logout** | Session token cleared via HTTP-only cookie on logout |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB |
| **ODM** | Mongoose |
| **Authentication** | JSON Web Tokens (JWT) |
| **File Uploads** | Multer |
| **Validation** | express-validator |
| **Config** | dotenv |
| **CORS** | cors middleware |
| **Cookie Parsing** | cookie-parser |

---

## 🗂️ Project Structure
 
```
car-rental-backend/
├── src/
│   ├── config/               # DB connection & Multer setup
│   ├── controllers/          # Route handler logic (user, car, booking)
│   ├── helper/               # Reusable helper functions
│   ├── jobs/                 # Background jobs / scheduled tasks
│   ├── middleware/           # auth, adminOnly, customerAccess, verifyCustomer
│   ├── models/               # Mongoose schemas (User, Car, Booking)
│   ├── routes/               # Express route definitions
│   ├── temp/                 # Temporary file storage
│   ├── template/             # Email or document templates
│   └── utils/                # Utility/helper functions
├── .env                      # Environment variables
├── .gitignore
├── package.json
├── package-lock.json
└── server.js                 # Application entry point
```
 
---

## 🚀 Getting Started

### Prerequisites

Ensure the following are installed before proceeding:

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A running [MongoDB](https://www.mongodb.com/) instance (local or Atlas)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Min-Thant794/car-rental-backend.git
cd car-rental-backend
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/irbs-car-rental
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
```

**4. Start the server**

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

The API will be running at `http://localhost:5000`

---

## 🔑 Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server runs on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/irbs` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your_secret_key` |
| `CLIENT_URL` | Customer UI origin (for CORS) | `http://localhost:5173` |
| `ADMIN_URL` | Admin Dashboard origin (for CORS) | `http://localhost:5174` |

---

## 📡 API Endpoints

### 🚘 Cars — `/api/cars`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/cars` | Public | Get all cars |
| `GET` | `/api/cars/discount-car` | Public | Get cars with active discounts |
| `GET` | `/api/cars/:id` | Auth | Get a single car by ID |
| `POST` | `/api/cars/create-car` | Admin | Add a new car (with image upload) |
| `PUT` | `/api/cars/:id` | Admin | Update car details (with image upload) |
| `DELETE` | `/api/cars/:id` | Admin | Remove a car from the fleet |

### 📅 Bookings — `/api/bookings`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/bookings` | Admin | Get all bookings |
| `GET` | `/api/bookings/auth/my-bookings` | Customer | Get the logged-in customer's bookings |
| `POST` | `/api/bookings` | Verified Customer | Create a new booking |
| `PATCH` | `/api/bookings/update-my-booking/:id` | Verified Customer | Update own booking details |
| `PATCH` | `/api/bookings/cancel-my-booking/:id` | Verified Customer | Cancel own booking |
| `PATCH` | `/api/bookings/:id` | Admin | Update any booking (approve / manage) |
| `DELETE` | `/api/bookings/:id` | Admin | Delete a booking |

### 👥 Users — `/api/users`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/users` | Public | Register a new customer account (with profile & license image upload) |
| `POST` | `/api/users/user-create-by-admin` | Admin | Create a customer account on behalf of admin |
| `POST` | `/api/users/auth/login` | Public | Customer login |
| `POST` | `/api/users/auth/admin/login` | Public | Admin login |
| `GET` | `/api/users/auth/me` | Auth | Get current logged-in customer's profile |
| `GET` | `/api/users/auth/admin/me` | Admin | Get current logged-in admin's profile |
| `POST` | `/api/users/reset-password` | Public | Reset user password |
| `GET` | `/api/users` | Admin | Get all registered users |
| `PUT` | `/api/users/:id` | Auth | Update a user profile (with profile & license image upload) |
| `DELETE` | `/api/users/:id` | Admin | Delete a user account |
| `POST` | `/api/users/auth/logout` | Auth | Log out and clear session cookie |

---

## 🔒 Authentication & Middleware

All protected routes require a valid JWT token passed in the request header:

```
Authorization: Bearer <your_token>
```

| Middleware | Purpose |
|---|---|
| `auth` | Verifies the JWT token on all protected routes |
| `adminOnly` | Restricts access to admin-only routes |
| `customerAccess` | Restricts access to customer-only routes |
| `verifiedCustomerOnly` | Allows only verified customers to create or modify bookings |
| `multer (upload)` | Handles image uploads — profile, license, and car images |

---

## 🏗️ System Architecture

```
┌──────────────────────┐        ┌──────────────────────┐
│    Customer UI        │        │   Admin Dashboard     │
│  (React + Tailwind)   │        │  (React + Tailwind)   │
└────────┬─────────────┘        └────────────┬──────────┘
         │                                   │
         │              REST API             │
         └──────────────────┬────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │    Backend API     │
                  │  (Node + Express)  │
                  └─────────┬─────────┘
                            │
                  ┌─────────▼─────────┐
                  │      MongoDB       │
                  └───────────────────┘
```

---

## 👨‍💻 About

IRBS was built within **3 months** as a BSc Computer Science Individual Project. Rather than treating it as a standard academic exercise, the aim was to simulate a real-world development workflow — separating the system into three independent repositories, designing a proper REST API, implementing JWT authentication, and delivering a polished, responsive frontend for both customers and admins.

---

## Author

**Min Thant Tun** — [@Min-Thant794](https://github.com/Min-Thant794)

---

## 📄 License

This project was built for academic purposes. All rights reserved © Min Thant Tun.
