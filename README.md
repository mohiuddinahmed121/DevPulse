# DevPulse - Internal Tech Issue & Feature Tracker

## Live URL
https://dev-pulse-indol-ten.vercel.app/

---

## Project Overview

DevPulse is a collaborative platform designed for software teams to report bugs, submit feature requests, and track issue resolution progress. The system provides role-based access control using JWT authentication and supports issue management workflows for contributors and maintainers.

---

## Features

### Authentication & Authorization

* User Registration (Contributor / Maintainer)
* User Login with JWT Authentication
* Protected Routes using JWT Middleware
* Role-Based Access Control

### Issue Management

* Create New Issues
* View All Issues
* View Single Issue Details
* Update Issues
* Delete Issues (Maintainers Only)
* Workflow Status Management

### Filtering & Sorting

* Sort Issues by Newest or Oldest
* Filter Issues by Type
* Filter Issues by Status

### Security Features

* Password Hashing using bcrypt
* JWT Token Verification
* Protected API Endpoints
* Role Validation

---

## Tech Stack

### Backend

* Node.js
* TypeScript
* Express.js

### Database

* PostgreSQL (Neon)

### Authentication

* JWT (jsonwebtoken)
* bcryptjs

### Deployment

* Vercel
* Neon PostgreSQL

---

## Project Structure

src/

├── config/

├── db/

├── middleware/

├── modules/

│ ├── auth/

│ └── issue/

├── types/

├── utility/

├── app.ts

└── server.ts

---

## Setup Instructions

cd DevPulse

### Install Dependencies

npm install

### Create Environment Variables

### Run Development Server

npm run dev

### Build Project

npm run build

### Start Production Server

npm start

---

## API Endpoints

### Authentication

#### Register User

POST /api/auth/signup

#### Login User

POST /api/auth/login

---

### Issues

#### Create Issue

POST /api/issues

Authentication Required

#### Get All Issues

GET /api/issues

Optional Query Parameters:

* sort=newest
* sort=oldest
* type=bug
* type=feature_request
* status=open
* status=in_progress
* status=resolved

#### Get Single Issue

GET /api/issues/:id

#### Update Issue

PATCH /api/issues/:id

Authentication Required

#### Delete Issue

DELETE /api/issues/:id

Maintainer Only

---

## Database Schema Summary

### Users Table

| Field      | Type                     |
| ---------- | ------------------------ |
| id         | SERIAL PRIMARY KEY       |
| name       | VARCHAR                  |
| email      | VARCHAR UNIQUE           |
| password   | TEXT                     |
| role       | contributor / maintainer |
| created_at | TIMESTAMP                |
| updated_at | TIMESTAMP                |

### Issues Table

| Field       | Type                          |
| ----------- | ----------------------------- |
| id          | SERIAL PRIMARY KEY            |
| title       | VARCHAR(150)                  |
| description | TEXT                          |
| type        | bug / feature_request         |
| status      | open / in_progress / resolved |
| reporter_id | INTEGER                       |
| created_at  | TIMESTAMP                     |
| updated_at  | TIMESTAMP                     |

---

## Role Permissions

### Contributor

* Create Issues
* View Issues
* Update Own Open Issues

### Maintainer

* All Contributor Permissions
* Update Any Issue
* Delete Any Issue
* Change Issue Status

---

## Author

Mohiuddin Ahmed

Department of Computer Science and Engineering

University of Asia Pacific
