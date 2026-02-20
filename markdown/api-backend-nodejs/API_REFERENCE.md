# 🔌 CutQ API Reference

## 📋 Table of Contents
- [Base URL & Authentication](#base-url--authentication)
- [Authentication Endpoints](#authentication-endpoints)
- [User Management](#user-management)
- [Salon (CutQ) Management](#salon-cutq-management)
- [Service Management](#service-management)
- [Booking Management](#booking-management)
- [Review System](#review-system)
- [File Upload](#file-upload)
- [Admin Endpoints](#admin-endpoints)
- [Error Handling](#error-handling)

## 🌐 Base URL & Authentication

### Base URL
```
Development: http://localhost:5002/api/v1
Production: https://your-domain.com/api/v1
```

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Response Format
All API responses follow this structure:
```json
{
  "success": boolean,
  "data": object | array,
  "message": string,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number,
    "hasNext": boolean,
    "hasPrev": boolean
  }
}
```

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+1234567890"
}
```

### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### Social Authentication
```http
GET /auth/google
GET /auth/facebook
GET /auth/callback/google
GET /auth/callback/facebook
```

### OTP Authentication
```http
POST /auth/send-otp
{
  "phone": "+1234567890"
}

POST /auth/verify-otp
{
  "phone": "+1234567890",
  "otp": "123456"
}
```

### Token Management
```http
POST /auth/refresh
{
  "refreshToken": "your-refresh-token"
}

POST /auth/logout
Authorization: Bearer <token>
```

## 👤 User Management

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Update User Profile
```http
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+1234567890",
  "avatar": "/uploads/avatars/user.jpg"
}
```

### Get User Bookings
```http
GET /bookings/user
Authorization: Bearer <token>
Query Parameters:
- status: pending|confirmed|cancelled|completed
- page: number (default: 1)
- limit: number (default: 10)
```

## 🏪 Salon (CutQ) Management

### Get All Salons
```http
GET /salons
Query Parameters:
- search: string
- category: string
- featured: boolean
- latitude: number
- longitude: number
- radius: number (km)
- page: number
- limit: number
```

### Get Salon by ID
```http
GET /salons/{id}
# Supports both UUID and display ID
GET /salons/123 (display ID)
GET /salons/uuid-string (UUID)
```

### Create Salon (Salon Owner)
```http
POST /salons
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Beautiful Cuts",
  "description": "Premium beauty salon",
  "address": "123 Main St, City",
  "phone": "+1234567890",
  "email": "info@beautifulcuts.com",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "specialties": ["Hair", "Nails", "Makeup"],
  "amenities": ["WiFi", "Parking", "AC"],
  "workingHours": {
    "monday": {"open": "09:00", "close": "18:00"},
    "tuesday": {"open": "09:00", "close": "18:00"}
  }
}
```

### Update Salon
```http
PUT /salons/{id}
Authorization: Bearer <token>
Content-Type: application/json
```

### Get Salon Services
```http
GET /salons/{id}/services
Query Parameters:
- category: string
- active: boolean
```

### Get Salon Stylists
```http
GET /salons/{id}/stylists
Query Parameters:
- active: boolean
- specialties: string[]
```

## 💼 Service Management

### Get All Services
```http
GET /services
Query Parameters:
- salonId: string
- categoryId: string
- search: string
- minPrice: number
- maxPrice: number
```

### Create Service
```http
POST /services
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Haircut & Style",
  "description": "Professional haircut with styling",
  "price": 50.00,
  "duration": 60,
  "categoryId": "category-uuid",
  "salonId": "salon-uuid",
  "images": ["/uploads/services/image1.jpg"],
  "isActive": true
}
```

### Update Service
```http
PUT /services/{id}
Authorization: Bearer <token>
```

### Delete Service
```http
DELETE /services/{id}
Authorization: Bearer <token>
```

## 📅 Booking Management

### Create Booking
```http
POST /bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "salonId": "salon-uuid",
  "serviceId": "service-uuid",
  "stylistId": "stylist-uuid",
  "date": "2024-01-15",
  "time": "14:00",
  "notes": "Special requirements"
}
```

### Get Booking Details
```http
GET /bookings/{id}
Authorization: Bearer <token>
```

### Update Booking Status
```http
PATCH /bookings/{id}/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed|cancelled|completed",
  "verificationCode": "ABC123" // For completion
}
```

### Get Available Time Slots
```http
GET /bookings/availability
Query Parameters:
- salonId: string (required)
- serviceId: string (required)
- stylistId: string (optional)
- date: string (YYYY-MM-DD, required)
```

## ⭐ Review System

### Create Review
```http
POST /reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "booking-uuid",
  "rating": 5,
  "comment": "Excellent service!",
  "serviceRating": 5,
  "staffRating": 5,
  "ambianceRating": 4
}
```

### Get Salon Reviews
```http
GET /salons/{id}/reviews
Query Parameters:
- page: number
- limit: number
- rating: number (filter by rating)
```

## 📁 File Upload

### Upload Images
```http
POST /upload/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- images: File[] (max 10 files)

Query Parameters:
- type: salon|service|stylist
- salonId: string (required for service/stylist)
- entityId: string (required for service/stylist)
```

### Upload Single Image
```http
POST /upload/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- image: File

Query Parameters:
- type: salon|service|stylist
- salonId: string
- entityId: string
```

## 👑 Admin Endpoints

### Get Platform Statistics
```http
GET /admin/stats
Authorization: Bearer <admin-token>
```

### Manage Users
```http
GET /admin/users
POST /admin/users
PUT /admin/users/{id}
DELETE /admin/users/{id}
Authorization: Bearer <admin-token>
```

### Manage Salon Requests
```http
GET /admin/salon-requests
POST /admin/salon-requests/{id}/approve
POST /admin/salon-requests/{id}/reject
Authorization: Bearer <admin-token>
```

### System Configuration
```http
GET /admin/system-config
PUT /admin/system-config
Authorization: Bearer <admin-token>
```

## ❌ Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error information"
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (validation failed)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Common Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `AUTHENTICATION_REQUIRED` - Valid token required
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `DUPLICATE_RESOURCE` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
