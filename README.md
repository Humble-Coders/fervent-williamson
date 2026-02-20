# 🏪 CutQ Management System

A comprehensive beauty business booking and management platform built with modern web technologies.

## 🚀 Features

### For Customers
- **Easy Booking**: Browse beauty businesses, services, and book appointments with verification codes
- **User Authentication**: Email/phone signup with OTP verification
- **Social Login**: Google, Facebook authentication with JWT tokens
- **Reviews & Ratings**: Rate and review beauty services with detailed feedback
- **Favorites**: Save favorite businesses for quick access
- **Loyalty Program**: Earn points and redeem rewards with tier system
- **Payment Integration**: Multiple payment methods support (card, wallet, cash)
- **Mobile-First Design**: Optimized responsive interface for all devices
- **SEO-Friendly URLs**: Clean URLs for services and salons

### For Business Owners (CutQ Owners)
- **Business Management**: Complete CutQ profile with image galleries and Google Maps
- **Service Management**: Add, edit, and organize services with categories
- **Staff Management**: Manage stylists with individual profiles and schedules
- **Booking Management**: View and manage customer bookings with verification system
- **Analytics**: Revenue tracking and business insights dashboard
- **Offers & Promotions**: Create special offers and discounts with flexible types
- **Image Organization**: Structured file upload system with auto-scrolling galleries
- **Booking Configuration**: Customize slot duration, advance booking, and working hours
- **Customer Verification**: Generate and verify booking codes when customers arrive

### For Administrators
- **User Management**: Manage all users and roles with comprehensive permissions
- **CutQ Oversight**: Monitor and manage all CutQs with approval system
- **System Configuration**: Configure system-wide settings and payment methods
- **Analytics Dashboard**: Comprehensive platform analytics and metrics
- **CutQ Requests**: Approve/reject CutQ registration requests
- **Content Management**: Manage service categories and system configurations
- **Payment Methods**: Configure available payment options platform-wide

## 🏗️ Architecture

### Backend (Node.js + TypeScript)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens + social auth (Google, Facebook)
- **API Documentation**: OpenAPI 3.0 with Swagger UI
- **File Upload**: Multer for organized image handling with structured folders
- **Email**: Nodemailer for notifications and OTP
- **SMS**: Fast2SMS for OTP verification
- **Security**: Helmet, CORS, rate limiting, input validation
- **Validation**: Zod schema validation for all endpoints
- **Logging**: Structured logging with Morgan and custom logger
- **Error Handling**: Centralized error handling with custom error classes

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: React Router v7 with nested routes and protected routes
- **State Management**: Zustand for global state with persistence
- **Styling**: Tailwind CSS for responsive design with custom components
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios for API communication with interceptors
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date manipulation and formatting
- **SEO**: Dynamic meta tags, sitemap generation, and structured data

### Database Schema
- **Users**: Customer and business owner management with roles and authentication
- **Salons (CutQs)**: Business profiles with location data, images, and settings
- **Services**: Service catalog with categories, pricing, and images
- **Stylists**: Staff management with profiles, schedules, and specialties
- **Bookings**: Appointment management with verification codes and status tracking
- **Reviews**: Rating and review system with detailed feedback
- **Payments**: Payment tracking and methods with multiple providers
- **Loyalty**: Points and rewards system with tier-based benefits
- **Offers**: Promotional system with flexible discount types
- **Favorites**: User favorites for quick access to preferred CutQs
- **System Config**: Platform-wide configuration management
- **Salon Requests**: CutQ registration approval workflow

## 📁 Project Structure

```
cutq/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Request handlers for API endpoints
│   │   ├── routes/          # API route definitions and middleware
│   │   ├── middleware/      # Authentication, validation, error handling
│   │   ├── services/        # Business logic and external integrations
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Helper functions and utilities
│   │   ├── config/          # Configuration files and environment setup
│   │   ├── repositories/    # Data access layer
│   │   └── scripts/         # Database scripts and utilities
│   ├── prisma/              # Database schema, migrations, and seeds
│   ├── uploads/             # Organized file upload directory structure
│   ├── swagger.yaml         # OpenAPI 3.0 documentation
│   ├── tests/               # Test suites and test utilities
│   └── logs/                # Application logs
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── admin/       # Admin-specific components
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── booking/     # Booking flow components
│   │   │   ├── common/      # Common UI components
│   │   │   ├── salon/       # CutQ-related components
│   │   │   └── ui/          # Base UI components
│   │   ├── pages/           # Page components
│   │   │   ├── admin/       # Admin dashboard pages
│   │   │   ├── salon/       # CutQ owner pages
│   │   │   └── ...          # Customer pages
│   │   ├── layouts/         # Layout components (Admin, Customer, Salon)
│   │   ├── services/        # API service functions
│   │   ├── store/           # Zustand state management
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Helper functions and utilities
│   │   ├── router/          # Routing configuration
│   │   └── config/          # Configuration files
│   ├── public/              # Static assets
│   └── tests/               # Test suites and test utilities
└── docs/                    # Additional documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cutq
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3002
- **API Documentation**: http://localhost:3002/api/v1/docs
- **Database Studio**: `npm run db:studio` (in backend directory)

## 📚 Documentation

### Core Documentation
- [Project Overview](./PROJECT_OVERVIEW.md) - Comprehensive project summary
- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Frontend Components](./FRONTEND_COMPONENTS.md) - Frontend architecture guide
- [Database Schema](./DATABASE_SCHEMA.md) - Database design documentation
- [Testing Guide](./TESTING_GUIDE.md) - Testing strategy and examples
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production deployment instructions

### Technical Documentation
- [Backend API Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [Database Schema File](./backend/prisma/schema.prisma)
- [Live API Reference](http://localhost:3002/api/v1/docs) (when running)

### Additional Resources
- [Context Data](./CONTEXT_DATA.md) - Project context for development
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md) - Production setup guide

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                   # Run all tests
npm run test:watch        # Watch mode
```

## 🔧 Development

### Code Quality
- **Linting**: ESLint for code quality
- **Formatting**: Prettier for consistent formatting
- **Type Checking**: TypeScript for type safety
- **Git Hooks**: Pre-commit hooks for quality checks

### Available Scripts

#### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set:
- Database connection strings
- JWT secrets
- API keys for external services
- CORS origins for production

### Production Build
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Serve the dist/ directory with your web server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API documentation at `/api/v1/docs`

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added social authentication and enhanced UI
- **v1.2.0** - Admin dashboard and system configuration

---

Built with ❤️ using modern web technologies
