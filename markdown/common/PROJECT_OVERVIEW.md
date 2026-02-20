# 🏪 CutQ Management System - Project Overview

## 📋 Table of Contents
- [Project Summary](#project-summary)
- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Database Design](#database-design)
- [API Endpoints](#api-endpoints)
- [Frontend Components](#frontend-components)
- [State Management](#state-management)
- [Authentication & Authorization](#authentication--authorization)
- [Service Categories System](#service-categories-system)
- [Analytics & Tracking](#analytics--tracking)
- [Queue System & Background Jobs](#queue-system--background-jobs)
- [File Upload System](#file-upload-system)
- [SEO & Performance](#seo--performance)
- [Testing Strategy](#testing-strategy)
- [Deployment & Environment](#deployment--environment)
- [Recent Updates](#recent-updates)

## 📊 Project Summary

CutQ is a comprehensive beauty business management platform that connects customers with beauty service providers (CutQs). The platform facilitates appointment booking, business management, and customer engagement through a modern web application.

### Core Objectives
- **Customer Experience**: Seamless discovery and booking of beauty services
- **Business Management**: Complete CutQ operation management tools
- **Platform Administration**: Centralized control and analytics
- **Scalability**: Support for multiple CutQs and high user volume
- **Mobile-First**: Responsive design optimized for mobile devices

## 🎯 Key Features

### Customer Features
- **CutQ Discovery**: Browse and search beauty businesses with filters
- **Service Booking**: Multi-step booking process with verification codes
- **User Authentication**: Email/phone signup with OTP verification
- **Social Login**: Google and Facebook authentication
- **Reviews & Ratings**: Detailed feedback system
- **Favorites**: Save preferred CutQs for quick access
- **Loyalty Program**: Points-based rewards system
- **Payment Integration**: Multiple payment methods
- **Mobile Optimization**: Responsive design for all devices

### CutQ Owner Features
- **Business Profile**: Complete CutQ management with image galleries and auto-scrolling headers
- **Service Management**: Add, edit, and organize services with SEO-friendly URLs
- **Staff Management**: Manage stylists with profiles, schedules, and rectangular image display
- **Booking Management**: Handle appointments with verification codes and status tracking
- **Service Categories**: Create custom categories specific to the CutQ (isolated from other CutQs)
- **Analytics Dashboard**: Revenue tracking and business insights with configurable tracking
- **Promotional Tools**: Create offers and discounts with static/minimal animation tags
- **Image Organization**: Structured file upload system with organized folder hierarchy
- **Settings Management**: Multi-tab settings interface (Profile, Categories, Booking, Payment, Notifications, System)
- **Verification System**: Generate and verify customer codes for appointment completion
- **Grid Toggle**: 2-column vs current view options for CutQ listings
- **Configuration**: Customize booking settings, working hours, and signup permissions

### Admin Features
- **Platform Management**: Oversee all CutQs and users with comprehensive dashboards
- **User Management**: Comprehensive user and role management across all user types
- **CutQ Approval**: Review and approve CutQ registration requests with configurable signup
- **Global Service Categories**: Manage service categories visible to all CutQs platform-wide
- **System Configuration**: Platform-wide settings including analytics, notifications, and features
- **Analytics Configuration**: Toggle which events to record with separate Google Analytics controls
- **Content Management**: Manage global categories, system data, and platform content
- **Communication Tracking**: Monitor SMS, email, and WhatsApp notification metrics
- **Revenue Analytics**: Track platform-wide revenue and business metrics

## 🏗️ Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (Express)     │◄──►│ (PostgreSQL)    │
│                 │    │                 │    │                 │
│ - Components    │    │ - Controllers   │    │ - Prisma ORM    │
│ - Pages         │    │ - Routes        │    │ - Migrations    │
│ - State Mgmt    │    │ - Middleware    │    │ - Seeds         │
│ - Services      │    │ - Services      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Request Flow
1. **Client Request**: Frontend sends HTTP request
2. **Authentication**: JWT token validation
3. **Authorization**: Role-based access control
4. **Validation**: Request data validation with Zod
5. **Business Logic**: Service layer processing
6. **Database**: Prisma ORM database operations
7. **Response**: JSON response with proper error handling

## 🛠️ Technology Stack

### Backend Technologies
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 14+ with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Social Auth**: Passport.js (Google, Facebook)
- **Validation**: Zod schema validation
- **File Upload**: Multer with organized storage
- **Email**: Nodemailer for notifications
- **SMS**: Fast2SMS for OTP verification
- **Documentation**: OpenAPI 3.0 with Swagger UI
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Morgan with custom logger
- **Testing**: Jest with supertest

### Frontend Technologies
- **Framework**: Next.js 15.5.4 with TypeScript for SEO optimization
- **Build Tool**: Next.js App Router for server-side rendering
- **Routing**: Next.js App Router with nested layouts and dynamic routes
- **State Management**: Zustand with localStorage persistence
- **Styling**: Tailwind CSS with custom components and responsive design
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with interceptors and environment-based URLs
- **Icons**: Lucide React with comprehensive icon set
- **Date Handling**: date-fns for date manipulation
- **SEO**: Dynamic meta tags, sitemap, and SEO-friendly URLs
- **Analytics**: Custom analytics system with Google Analytics integration
- **Testing**: Vitest with React Testing Library
- **Performance**: Image optimization and lazy loading

## 🗄️ Database Design

### Core Models
- **User**: Authentication and profile management with multi-role support
- **Salon**: CutQ business profiles with auto-increment display IDs and SEO-friendly URLs
- **Service**: Service catalog with categories and SEO-friendly URLs (/services/hair/<service-display-id>)
- **ServiceCategory**: Two-level category system (global admin + salon-specific custom)
- **Stylist**: Staff management and scheduling with rectangular image display
- **Booking**: Appointment system with verification codes and status tracking
- **Review**: Rating and feedback system tied to completed bookings
- **Payment**: Transaction tracking with multiple payment methods
- **Loyalty**: Points and rewards system for customer retention
- **Offer**: Promotional campaigns with configurable display options
- **Favorite**: User preferences for quick CutQ access
- **SystemConfig**: Platform configuration stored in system_config table
- **SalonRequest**: CutQ approval workflow with configurable signup
- **Analytics**: Event tracking system with configurable event types
- **Notification**: Communication tracking (SMS, email, WhatsApp metrics)

### Key Relationships
- Users can own multiple Salons (CutQs)
- Salons have multiple Services and Stylists
- Bookings link Users, Salons, Services, and Stylists
- Reviews are tied to completed Bookings
- Loyalty accounts track user points and transactions
- Favorites allow users to save preferred Salons

### Data Integrity
- Foreign key constraints ensure referential integrity
- Enum types for status fields (BookingStatus, PaymentStatus, etc.)
- Unique constraints on email, display IDs
- Soft deletes for important records
- Audit trails for critical operations

## 🔐 Authentication & Authorization

### Unified Login System
- **Single Entry Point**: All users (customers, salon owners, admins) login from `/welcome` page
- **Role-Based Redirects**: Automatic redirect to appropriate dashboard after successful authentication
- **No Separate Login Pages**: Unified experience for all user types

### Authentication Methods
1. **Email/Password**: Traditional login with JWT tokens
2. **Phone/OTP**: SMS-based authentication
3. **Social Login**: Google and Facebook OAuth
4. **Refresh Tokens**: Secure token renewal

### Authorization Levels
- **ADMIN**: Full platform access
- **SALON_OWNER**: CutQ management access
- **MANAGER**: Limited CutQ management
- **STAFF**: Basic CutQ operations
- **CUSTOMER**: Booking and profile access

### Security Features
- JWT token validation with expiration
- Refresh token rotation
- Role-based access control (RBAC)
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- CORS configuration for production
- Helmet for security headers

## 📁 File Upload System

### Organized Structure
```
uploads/
├── cutqs/
│   └── {cutq-name-displayId}/
│       ├── services/
│       │   └── {service-name-displayId}/
│       └── stylists/
│           └── {stylist-name-displayId}/
└── temp/
    └── {temporary-uploads}/
```

### Features
- **Structured Organization**: Logical folder hierarchy
- **Multiple Image Support**: Gallery functionality
- **Auto-scrolling**: Image carousels for CutQs
- **File Validation**: Type and size restrictions
- **Secure Upload**: Authentication required
- **Cleanup**: Temporary file management

## � Service Categories System

### Two-Level Category Architecture
- **Global Categories**: Admin-managed categories visible to all CutQs
- **Salon-Specific Categories**: Custom categories only visible to that specific CutQ
- **Complete Isolation**: Salon categories are not visible to other CutQs
- **Visual Distinction**: Clear UI separation between global and custom categories

### Database Schema
```sql
model ServiceCategory {
  id          String    @id @default(uuid())
  name        String
  icon        String
  color       String?
  emoji       String
  description String?
  isGlobal    Boolean   @default(true)  // true for admin, false for salon-specific
  salonId     String?   // null for global, salon ID for salon-specific
  createdAt   DateTime  @default(now())
  services    Service[]
  salon       Salon?    @relation(fields: [salonId], references: [id], onDelete: Cascade)

  @@unique([name, salonId]) // Allow same name for different salons
}
```

### API Endpoints
- `GET /api/v1/salon/categories` - Get all available categories (global + salon-specific)
- `GET /api/v1/salon/categories/custom` - Get only salon-specific categories
- `POST /api/v1/salon/categories` - Create new salon-specific category
- `PUT /api/v1/salon/categories/:id` - Update salon-specific category
- `DELETE /api/v1/salon/categories/:id` - Delete salon-specific category
- `GET /api/v1/admin/service-categories` - Admin: Get all global categories
- `POST /api/v1/admin/service-categories` - Admin: Create global category

### Frontend Implementation
- **Settings Tab**: Service Categories tab in salon settings
- **Admin Interface**: Global category management page
- **Modal System**: Create/edit interface for categories
- **Real-time Updates**: Immediate UI updates after CRUD operations

## 📊 Analytics & Tracking

### Custom Analytics System
- **Event Types**: PAGE_VIEW, ACTION, ERROR, PERFORMANCE
- **Configurable Tracking**: Admin can toggle which events to record
- **Asynchronous Processing**: Events processed via separate queues
- **Database Storage**: Events stored in analytics table with detailed metadata

### Google Analytics Integration
- **Separate Configuration**: Independent from custom analytics
- **Environment-based**: Different tracking IDs for dev/staging/production
- **Privacy Compliant**: Configurable data collection

### Tracked Metrics
- **Page Views**: Track which pages users visit most
- **User Actions**: Button clicks, form submissions, feature usage
- **Communication**: SMS, email, WhatsApp notification counts
- **Performance**: Page load times, API response times
- **Business**: Revenue tracking, booking conversion rates

### Analytics Configuration
```typescript
interface AnalyticsConfig {
  enabled: boolean;
  trackPageViews: boolean;
  trackUserActions: boolean;
  trackErrors: boolean;
  trackPerformance: boolean;
  googleAnalyticsEnabled: boolean;
  googleAnalyticsId?: string;
}
```

## ⚡ Queue System & Background Jobs

### Asynchronous Processing
- **Analytics Events**: Process tracking events without blocking main flow
- **Email Notifications**: Send emails via background queues
- **SMS Processing**: Handle SMS notifications asynchronously
- **Image Processing**: Resize and optimize images in background

### Queue Implementation
- **Event-driven Architecture**: Separate queues for different job types
- **Retry Logic**: Automatic retry for failed jobs
- **Dead Letter Queue**: Handle permanently failed jobs
- **Monitoring**: Track queue health and processing times

## 🌐 Deployment & Environment

### Environment Configuration
- **Development**: Local development with hot reload and debug logging
- **Staging**: Testing environment with production-like setup
- **Production**: Optimized build with security hardening and monitoring

### Key Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...
DATABASE_DIRECT_URL=postgresql://...

# Authentication
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Social Authentication
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Communication
EMAIL_HOST=smtp.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-email-password
SMS_API_KEY=your-fast2sms-api-key

# Application
CORS_ORIGIN=["http://localhost:3000","https://yourdomain.com"]
BACKEND_URL=http://localhost:3002
FRONTEND_URL=http://localhost:3000
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Brand Configuration
BRAND_NAME=CutQ
BRAND_PHONE=+91 8197970532
BRAND_ADDRESS=New Delhi, IN 110001

# Analytics
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
ANALYTICS_ENABLED=true
```

### Production Considerations
- **SSL/TLS Encryption**: HTTPS enforcement
- **Database Connection Pooling**: Optimized database connections
- **CDN Integration**: Static asset delivery via CDN
- **Load Balancing**: High availability with multiple instances
- **Monitoring & Logging**: Comprehensive application monitoring
- **Backup Strategy**: Automated database backups
- **Performance Optimization**: Caching, compression, and optimization
## 🔍 SEO & Performance

### SEO-Friendly URLs
- **Services**: `/services/hair/<service-display-id>` format
- **CutQs**: `/salons/<salon-name>/<salon-display-id>` format
- **Auto-increment Display IDs**: User-friendly IDs (1, 2, 3) instead of UUIDs
- **Dynamic Meta Tags**: Page-specific titles and descriptions
- **Sitemap Generation**: Automated sitemap for search engines

### Performance Optimizations
- **Next.js SSR**: Server-side rendering for better SEO indexing
- **Image Optimization**: Automatic image compression and lazy loading
- **Code Splitting**: Dynamic imports for reduced bundle size
- **Caching Strategy**: Browser and server-side caching
- **Mobile-First Design**: Optimized for mobile performance

### Google Indexing
- **Structured Data**: Schema.org markup for rich snippets
- **Open Graph**: Social media sharing optimization
- **Page Titles**: Unique titles for each page/tab
- **Logo Integration**: Consistent branding across all pages
- **Favicon**: Brand logo used as favicon

## 🧪 Testing Strategy

### Backend Testing
- **Unit Tests**: Jest with comprehensive test coverage
- **Integration Tests**: API endpoint testing with supertest
- **Database Testing**: Prisma with test database
- **Authentication Testing**: JWT and role-based access testing
- **Validation Testing**: Zod schema validation testing

### Frontend Testing
- **Component Testing**: React Testing Library for UI components
- **Integration Testing**: User flow testing with Vitest
- **E2E Testing**: Playwright for end-to-end scenarios
- **Accessibility Testing**: ARIA compliance and screen reader testing
- **Performance Testing**: Core Web Vitals monitoring

### Quality Assurance
- **Code Coverage**: Minimum 80% coverage requirement
- **Linting**: ESLint with TypeScript rules
- **Type Safety**: Strict TypeScript configuration
- **Code Review**: Pull request review process
- **Automated Testing**: CI/CD pipeline integration

## 📈 Recent Updates

### Latest Features (2025)
- **✅ Service Categories System**: Two-level category architecture with global and salon-specific categories
- **✅ Unified Login System**: All users login from `/welcome` page with role-based redirects
- **✅ Settings Interface**: Complete multi-tab settings with all previously commented features
- **✅ Navigation Updates**: Added Services and Stylists to salon navigation
- **✅ Analytics System**: Configurable event tracking with Google Analytics integration
- **✅ SEO Improvements**: Next.js 15.5.4 upgrade with SEO-friendly URLs
- **✅ Authentication Fixes**: Resolved redirect issues and token management
- **✅ Database Schema**: Added salon-specific categories with proper isolation

### Technical Improvements
- **✅ Next.js Upgrade**: Migrated from React to Next.js 15.5.4 for better SEO
- **✅ App Router**: Implemented Next.js App Router for improved routing
- **✅ Environment Configuration**: Centralized environment variable management
- **✅ Error Handling**: Improved error handling and user feedback
- **✅ Code Organization**: Better separation of concerns and modular architecture
- **✅ TypeScript**: Enhanced type safety across frontend and backend

### Bug Fixes
- **✅ Authentication Redirect**: Fixed welcome page redirect for authenticated users
- **✅ Settings Navigation**: Fixed JavaScript errors in settings tab navigation
- **✅ API Token Issues**: Resolved authentication token persistence
- **✅ Database Migrations**: Successfully applied schema changes for categories
- **✅ Route Mounting**: Fixed API route mounting for salon categories

### Upcoming Features
- **🔄 Payment Integration**: Enhanced payment processing with multiple providers
- **🔄 Advanced Analytics**: More detailed business intelligence and reporting
- **🔄 Mobile App**: React Native mobile application
- **🔄 API Documentation**: Comprehensive OpenAPI documentation
- **🔄 Performance Monitoring**: Real-time performance tracking and alerts

## 📚 API Endpoints

### Authentication Endpoints
```
POST /api/v1/auth/signup          - User registration
POST /api/v1/auth/login           - User login
POST /api/v1/auth/refresh         - Token refresh
POST /api/v1/auth/logout          - User logout
POST /api/v1/auth/verify-otp      - OTP verification
POST /api/v1/auth/resend-otp      - Resend OTP
```

### User Management
```
GET  /api/v1/users/profile        - Get user profile
PUT  /api/v1/users/profile        - Update user profile
GET  /api/v1/users/bookings       - Get user bookings
GET  /api/v1/users/favorites      - Get user favorites
POST /api/v1/users/favorites      - Add to favorites
```

### Salon Management
```
GET  /api/v1/salons               - Get all salons
GET  /api/v1/salons/:id           - Get salon details
POST /api/v1/salons               - Create salon (admin)
PUT  /api/v1/salons/:id           - Update salon
GET  /api/v1/salons/:id/services  - Get salon services
GET  /api/v1/salons/:id/stylists  - Get salon stylists
```

### Service Categories
```
GET  /api/v1/salon/categories           - Get available categories
GET  /api/v1/salon/categories/custom    - Get salon-specific categories
POST /api/v1/salon/categories           - Create salon category
PUT  /api/v1/salon/categories/:id       - Update salon category
DELETE /api/v1/salon/categories/:id     - Delete salon category
GET  /api/v1/admin/service-categories   - Admin: Get global categories
POST /api/v1/admin/service-categories   - Admin: Create global category
```

### Booking System
```
POST /api/v1/bookings             - Create booking
GET  /api/v1/bookings/:id         - Get booking details
PUT  /api/v1/bookings/:id         - Update booking status
POST /api/v1/bookings/:id/verify  - Verify booking code
GET  /api/v1/salon/bookings       - Get salon bookings
```

### Analytics & Tracking
```
POST /api/v1/analytics/track      - Track analytics event
GET  /api/v1/analytics/dashboard  - Get analytics dashboard
GET  /api/v1/analytics/reports    - Get detailed reports
PUT  /api/v1/analytics/config     - Update analytics configuration
```

## 🎨 Frontend Components

### Layout Components
- **AdminLayout**: Admin dashboard layout with navigation
- **SalonLayout**: Salon owner dashboard layout
- **PublicLayout**: Public pages layout for customers
- **AuthLayout**: Authentication pages layout

### Page Components
- **OnboardingPage**: Welcome page with unified login
- **SalonDashboard**: Salon owner main dashboard
- **AdminDashboard**: Admin control panel
- **SettingsPage**: Multi-tab settings interface
- **ServiceCategoriesPage**: Category management interface
- **ServicesPage**: Service management interface
- **StylistsPage**: Stylist management interface

### UI Components
- **Modal**: Reusable modal component for forms
- **Button**: Styled button with variants
- **Input**: Form input with validation
- **Select**: Dropdown select component
- **Card**: Content card component
- **Badge**: Status and category badges
- **LoadingSpinner**: Loading state indicator

### Form Components
- **CategoryForm**: Service category creation/editing
- **ServiceForm**: Service creation/editing
- **StylistForm**: Stylist profile management
- **BookingForm**: Appointment booking interface
- **ProfileForm**: User profile management

## 🔄 State Management

### Zustand Stores
- **authStore**: Authentication state and user data
- **salonStore**: Salon-specific data and settings
- **bookingStore**: Booking state and cart management
- **uiStore**: UI state (modals, loading, notifications)
- **analyticsStore**: Analytics configuration and data

### Persistence
- **localStorage**: Authentication tokens and user preferences
- **sessionStorage**: Temporary data and form state
- **URL State**: Tab selection and filter state
- **Server State**: Real-time data synchronization

### State Patterns
- **Optimistic Updates**: Immediate UI updates with rollback
- **Error Boundaries**: Graceful error handling
- **Loading States**: Comprehensive loading indicators
- **Cache Management**: Efficient data caching and invalidation
