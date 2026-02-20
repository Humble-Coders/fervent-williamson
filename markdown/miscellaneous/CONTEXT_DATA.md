# 🧠 CutQ Project Context Data

## 📋 Project Overview
**Project Name**: CutQ Management System
**Type**: Full-stack beauty business management platform
**Architecture**: React + TypeScript frontend, Node.js + Express backend, PostgreSQL database
**Status**: Active development with comprehensive features

## 🏗️ Technical Architecture

### Backend Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens, social auth (Google, Facebook)
- **File Upload**: Multer with organized folder structure
- **API Documentation**: OpenAPI 3.0 with Swagger UI
- **Security**: Helmet, CORS, rate limiting, Zod validation
- **Email/SMS**: Nodemailer, Fast2SMS for OTP

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7 with nested routes
- **State Management**: Zustand with persistence
- **Styling**: Tailwind CSS with responsive design
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React

### Database Design
- **Primary Models**: User, Salon, Service, Stylist, Booking, Review, Payment, Loyalty
- **Key Features**: Auto-increment display IDs, UUID primary keys, soft deletes
- **Relationships**: Comprehensive foreign key constraints
- **Enums**: UserRole, BookingStatus, PaymentStatus, OfferType

## 🎯 Core Features

### Customer Features
- CutQ discovery with advanced filters
- Multi-step booking process with verification codes
- Social authentication (Google, Facebook)
- Review and rating system
- Favorites and loyalty program
- Mobile-first responsive design
- SEO-friendly URLs

### CutQ Owner Features
- Complete business profile management
- Service and stylist management
- Booking management with verification system
- Analytics dashboard
- Image galleries with auto-scrolling
- Promotional tools and offers
- Configurable booking settings

### Admin Features
- Platform-wide management
- User and CutQ oversight
- Salon request approval system
- System configuration management
- Comprehensive analytics
- Content management

## 📁 Project Structure

### Backend Structure
```
backend/src/
├── controllers/     # Request handlers
├── routes/          # API endpoints
├── middleware/      # Auth, validation, error handling
├── services/        # Business logic
├── types/           # TypeScript definitions
├── utils/           # Helper functions
├── config/          # Configuration files
├── repositories/    # Data access layer
└── scripts/         # Database utilities
```

### Frontend Structure
```
frontend/src/
├── components/      # UI components
│   ├── admin/       # Admin components
│   ├── auth/        # Authentication
│   ├── booking/     # Booking flow
│   ├── salon/       # CutQ components
│   └── ui/          # Base components
├── pages/           # Page components
├── layouts/         # Layout components
├── services/        # API services
├── store/           # State management
├── hooks/           # Custom hooks
├── types/           # TypeScript types
└── utils/           # Helper functions
```

## 🔐 Authentication & Authorization

### Authentication Methods
1. Email/password with JWT tokens
2. Phone/OTP verification
3. Social login (Google, Facebook)
4. Refresh token rotation

### User Roles
- **ADMIN**: Full platform access
- **SALON_OWNER**: CutQ management
- **MANAGER**: Limited CutQ operations
- **STAFF**: Basic CutQ operations
- **CUSTOMER**: Booking and profile access

### Security Features
- JWT token validation
- Role-based access control
- Rate limiting
- Input validation with Zod
- CORS configuration
- Helmet security headers

## 📊 Key API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/google` - Google OAuth
- `POST /auth/send-otp` - Send OTP
- `POST /auth/verify-otp` - Verify OTP

### Salon Management
- `GET /salons` - List salons with filters
- `GET /salons/{id}` - Get salon details
- `POST /salons` - Create salon
- `PUT /salons/{id}` - Update salon

### Booking System
- `POST /bookings` - Create booking
- `GET /bookings/availability` - Check availability
- `PATCH /bookings/{id}/status` - Update status

### File Upload
- `POST /upload/images` - Upload multiple images
- `POST /upload/image` - Upload single image

## 🗄️ Database Schema

### Core Models
- **User**: Authentication and profiles
- **Salon**: CutQ business data
- **Service**: Service catalog
- **Stylist**: Staff management
- **Booking**: Appointment system
- **Review**: Feedback system
- **Payment**: Transaction tracking
- **Loyalty**: Rewards system

### Key Relationships
- Users own multiple Salons
- Salons have Services and Stylists
- Bookings link Users, Salons, Services
- Reviews tied to completed Bookings

## 🎨 Frontend Components

### Layout Components
- **CustomerLayout**: Main customer interface
- **AdminLayout**: Admin dashboard
- **SalonLayout**: CutQ owner interface

### Key Components
- **SalonCard**: CutQ listing with auto-scroll images
- **BookingFlow**: Multi-step booking process
- **ServiceCard**: Service display
- **StylistCard**: Stylist profiles (rectangular images)
- **LoginModal**: Authentication modal

### State Management
- **authStore**: User authentication state
- **bookingStore**: Booking flow state
- **salonStore**: CutQ-related state
- **homeStore**: Homepage state

## 🔧 Development Workflow

### Environment Setup
- Node.js 18+ required
- PostgreSQL 14+ database
- Environment variables for configuration
- Prisma for database management

### Key Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run db:migrate` - Database migrations
- `npm run db:seed` - Seed database
- `npm test` - Run tests

## 🚀 Deployment

### Environment Variables
- Database connection strings
- JWT secrets
- Social auth credentials
- Email/SMS service keys
- CORS origins
- File upload paths

### Production Considerations
- SSL/TLS encryption
- Database connection pooling
- CDN for static assets
- Load balancing
- Monitoring and logging

## 📝 User Preferences (From Memory)

### Technical Preferences
- Node.js Express with TypeScript and Prisma
- Multi-tab pages over modals for complex forms
- Separate flows for services and staff entry
- CORS_ORIGIN as array for multiple URLs
- Auto-increment IDs for better UX
- Nodemailer with free email services

### UI/UX Preferences
- Welcome page with email/phone signup
- Login modal only on booking confirmation
- Static/minimal animation for tags
- Grid toggle options (2 columns vs current)
- Complete data cleanup on logout
- SEO-friendly URLs with display names

### Business Logic Preferences
- CutQ self-signup configurable via admin
- Verification code system for appointments
- Booking success redirects to appointments
- Image organization in structured folders
- CutQ images with auto-scrolling galleries
- Stylist images in rectangular format

### Branding
- Brand name: "CutQ" (replace salon/salonbook references)
- Organized file structure with meaningful names
- Professional, scalable architecture
- Best coding practices and separation of concerns

## 🔄 Recent Updates

### Latest Features
- Comprehensive authentication system
- File upload with organized structure
- Admin approval workflow for CutQs
- Booking verification system
- SEO optimization
- Mobile-responsive design

### Current Focus Areas
- Performance optimization
- Test coverage improvement
- Documentation updates
- Security enhancements
- User experience refinements

## 📚 Documentation Files Created
- **PROJECT_OVERVIEW.md**: Comprehensive project summary
- **API_REFERENCE.md**: Complete API documentation
- **FRONTEND_COMPONENTS.md**: Frontend architecture guide
- **DATABASE_SCHEMA.md**: Database design documentation
- **CONTEXT_DATA.md**: Project context for AI assistant

## 🧪 Testing Strategy
- **Backend**: Jest with supertest for API testing
- **Frontend**: Vitest with React Testing Library
- **Integration**: End-to-end testing with Playwright
- **Coverage**: Minimum 80% code coverage target
