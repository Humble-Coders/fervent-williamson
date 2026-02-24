# 🏪 CutQ Management Backend API

A robust Node.js backend API for the CutQ management system, built with Express.js, TypeScript, and Prisma.

## 🚀 Features

- **RESTful API**: Well-structured REST endpoints
- **Authentication**: JWT with refresh tokens + social auth
- **Database**: PostgreSQL with Prisma ORM
- **File Upload**: Image upload with Multer
- **Email/SMS**: Notifications and OTP verification
- **API Documentation**: OpenAPI 3.0 with Swagger UI
- **Security**: Helmet, CORS, rate limiting
- **Validation**: Zod schema validation
- **Logging**: Structured logging with Morgan

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Passport.js + JWT
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI

### Project Structure
```
backend/
├── src/
│   ├── controllers/         # Request handlers
│   │   └── AuthController.ts
│   ├── routes/              # API route definitions
│   │   ├── auth.ts
│   │   ├── salons.ts
│   │   ├── bookings.ts
│   │   └── ...
│   ├── middleware/          # Custom middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── services/            # Business logic
│   │   ├── AuthService.ts
│   │   └── otpService.ts
│   ├── types/               # TypeScript definitions
│   │   ├── database.ts
│   │   ├── api.ts
│   │   └── auth.ts
│   ├── utils/               # Helper functions
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── helpers.ts
│   ├── config/              # Configuration
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── passport.ts
│   └── app.ts               # Express app setup
├── prisma/                  # Database schema
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── uploads/                 # File upload directory
├── swagger.yaml             # API documentation
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.local .env

# Edit .env with your configuration
nano .env

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed database with sample data
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables
```env
# Server Configuration
NODE_ENV=development
PORT=3002
HOST=localhost

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/cutq_db"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Session Secret
SESSION_SECRET=your-session-secret-here

# SMS Configuration (Fast2SMS)
FAST2SMS_API_KEY=your-fast2sms-api-key
FAST2SMS_SENDER_ID=FSTSMS

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Social Authentication (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
# ... other social auth configs
```

## 📚 API Documentation

### Interactive Documentation
Visit http://localhost:3002/api/v1/docs when the server is running for interactive API documentation.

### API Endpoints

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/send-otp` - Send OTP for verification
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `GET /api/v1/auth/google` - Google OAuth
- `GET /api/v1/auth/facebook` - Facebook OAuth

#### Salons
- `GET /api/v1/salons` - Get all salons
- `GET /api/v1/salons/:id` - Get salon by ID
- `POST /api/v1/salons` - Create salon (authenticated)
- `PUT /api/v1/salons/:id` - Update salon (authenticated)
- `DELETE /api/v1/salons/:id` - Delete salon (authenticated)

#### Services
- `GET /api/v1/services` - Get all services
- `GET /api/v1/services/:id` - Get service by ID
- `POST /api/v1/services` - Create service (authenticated)

#### Bookings
- `GET /api/v1/bookings` - Get user bookings (authenticated)
- `POST /api/v1/bookings` - Create booking
- `PUT /api/v1/bookings/:id` - Update booking (authenticated)
- `DELETE /api/v1/bookings/:id` - Cancel booking (authenticated)

#### Reviews
- `GET /api/v1/reviews` - Get reviews
- `POST /api/v1/reviews` - Create review (authenticated)

#### Admin (Admin only)
- `GET /api/v1/admin/stats` - Get admin dashboard stats
- `GET /api/v1/admin/users` - Get all users
- `PUT /api/v1/admin/users/:id` - Update user

### Response Format
All API responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "pagination": { ... } // For paginated responses
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // Validation errors if applicable
}
```

## 🗄️ Database Schema

### Key Models
- **User**: Customer and business owner accounts
- **Business**: Business profiles with location and settings
- **Service**: Services offered by businesses
- **Booking**: Appointment bookings
- **Review**: Customer reviews and ratings
- **Payment**: Payment tracking
- **Offer**: Promotions and discounts

### Relationships
- Users can own multiple businesses
- Businesses have multiple services and staff
- Bookings link users, businesses, and services
- Reviews are tied to bookings

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure
```
src/__tests__/
├── controllers/
├── services/
├── middleware/
└── utils/
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

### Code Quality
- **ESLint**: Configured for TypeScript
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Husky**: Git hooks for quality checks

### Database Operations
```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database (development)
npm run db:push

# Create and run migrations (production)
npm run db:migrate

# Open database browser
npm run db:studio

# Reset database and reseed
npm run db:reset
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database URL
3. Set secure JWT secrets
4. Configure CORS for production domains
5. Set up SSL certificates
6. Configure reverse proxy (nginx)

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3002
CMD ["npm", "start"]
```

## 🔒 Security

### Implemented Security Measures
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request rate limiting
- **JWT**: Secure authentication
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM
- **Password Hashing**: bcryptjs

### Security Best Practices
- Use HTTPS in production
- Regularly update dependencies
- Implement proper error handling
- Use environment variables for secrets
- Enable database connection encryption

## 📊 Monitoring

### Logging
- Structured logging with Morgan
- Error tracking and reporting
- Request/response logging
- Performance monitoring

### Health Checks
- `GET /health` - Basic health check
- Database connectivity check
- External service status

## 🤝 Contributing

1. Follow TypeScript best practices
2. Write tests for new features
3. Update API documentation
4. Follow existing code style
5. Add proper error handling

## 📄 API Versioning

Current API version: `v1`
Base URL: `/api/v1`

Future versions will be backward compatible or properly versioned.

---

For more information, visit the [main project README](../README.md).
