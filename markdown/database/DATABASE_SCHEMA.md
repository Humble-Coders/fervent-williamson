# 🗄️ Database Schema Documentation

## 📋 Table of Contents
- [Schema Overview](#schema-overview)
- [Core Models](#core-models)
- [Relationships](#relationships)
- [Enums](#enums)
- [Indexes and Constraints](#indexes-and-constraints)
- [Data Flow](#data-flow)
- [Migration Strategy](#migration-strategy)

## 🏗️ Schema Overview

The CutQ platform uses PostgreSQL with Prisma ORM for type-safe database operations. The schema is designed for scalability, data integrity, and optimal query performance.

### Key Design Principles
- **Normalization**: Proper data normalization to reduce redundancy
- **Referential Integrity**: Foreign key constraints ensure data consistency
- **Scalability**: Indexed fields for optimal query performance
- **Audit Trail**: Created/updated timestamps on all models
- **Soft Deletes**: Important records use soft deletion
- **Display IDs**: Auto-increment IDs for user-friendly URLs

## 📊 Core Models

### User Model
**Purpose**: Central user management for all platform users

```prisma
model User {
  id        String   @id @default(uuid())
  displayId Int      @unique @default(autoincrement())
  name      String
  email     String   @unique
  password  String?  // Optional for social auth
  phone     String?
  avatar    String?
  role      UserRole @default(CUSTOMER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Preferences and verification
  preferences   Json?
  emailVerified Boolean @default(false)
  phoneVerified Boolean @default(false)
  
  // Relations
  ownedSalons      Salon[]
  bookings         Booking[]
  reviews          Review[]
  loyaltyAccount   LoyaltyAccount?
  paymentMethods   PaymentMethod[]
  favorites        Favorite[]
  refreshTokens    RefreshToken[]
}
```

### Salon Model
**Purpose**: CutQ business profiles and configuration

```prisma
model Salon {
  id          String   @id @default(uuid())
  displayId   Int      @unique @default(autoincrement())
  name        String
  description String
  address     String
  latitude    Float?
  longitude   Float?
  phone       String
  email       String
  rating      Float    @default(0)
  reviewCount Int      @default(0)
  images      String[] // Array of image URLs
  featured    Boolean  @default(false)
  isOpen      Boolean  @default(true)
  
  // Business details
  specialties     String[]
  amenities       String[]
  teamSize        Int      @default(1)
  yearsInBusiness Int      @default(0)
  certifications  String[]
  
  // Booking configuration
  workingHours         Json?
  slotDuration         Int     @default(30)
  breakDuration        Int     @default(15)
  advanceBookingDays   Int     @default(30)
  minimumNoticeHours   Int     @default(2)
  bufferTime           Int     @default(0)
  maxBookingsPerDay    Int     @default(50)
  allowSameDayBooking  Boolean @default(true)
  maxRescheduleLimit   Int     @default(2)
  
  // Payment settings
  enabledPaymentMethods String[] @default(["card", "wallet", "cash"])
  
  // Relations
  ownerId   String?
  owner     User?      @relation(fields: [ownerId], references: [id])
  services  Service[]
  stylists  Stylist[]
  bookings  Booking[]
  reviews   Review[]
  offers    Offer[]
  favorites Favorite[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Service Model
**Purpose**: Service catalog with pricing and details

```prisma
model Service {
  id          String  @id @default(uuid())
  displayId   Int     @unique @default(autoincrement())
  name        String
  description String
  price       Float
  duration    Int     // Duration in minutes
  images      String[]
  isActive    Boolean @default(true)
  
  // Relations
  salonId    String
  salon      Salon           @relation(fields: [salonId], references: [id])
  categoryId String
  category   ServiceCategory @relation(fields: [categoryId], references: [id])
  bookings   Booking[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Booking Model
**Purpose**: Appointment management with verification system

```prisma
model Booking {
  id               String        @id @default(uuid())
  displayId        Int           @unique @default(autoincrement())
  date             DateTime
  startTime        DateTime
  endTime          DateTime
  status           BookingStatus @default(PENDING)
  notes            String?
  verificationCode String?       // Generated for customer verification
  
  // Pricing
  totalAmount      Float
  discountAmount   Float         @default(0)
  finalAmount      Float
  
  // Relations
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  salonId   String
  salon     Salon    @relation(fields: [salonId], references: [id])
  serviceId String
  service   Service  @relation(fields: [serviceId], references: [id])
  stylistId String?
  stylist   Stylist? @relation(fields: [stylistId], references: [id])
  
  // Optional relations
  payment Payment?
  review  Review?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Review Model
**Purpose**: Customer feedback and rating system

```prisma
model Review {
  id      String @id @default(uuid())
  rating  Int    // Overall rating 1-5
  comment String?
  
  // Detailed ratings
  serviceRating   Int?
  staffRating     Int?
  ambianceRating  Int?
  valueRating     Int?
  
  // Relations
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  salonId   String
  salon     Salon   @relation(fields: [salonId], references: [id])
  bookingId String  @unique
  booking   Booking @relation(fields: [bookingId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🔗 Relationships

### User Relationships
- **One-to-Many**: User → Salons (ownership)
- **One-to-Many**: User → Bookings
- **One-to-Many**: User → Reviews
- **One-to-One**: User → LoyaltyAccount
- **One-to-Many**: User → PaymentMethods
- **One-to-Many**: User → Favorites

### Salon Relationships
- **Many-to-One**: Salon → User (owner)
- **One-to-Many**: Salon → Services
- **One-to-Many**: Salon → Stylists
- **One-to-Many**: Salon → Bookings
- **One-to-Many**: Salon → Reviews
- **One-to-Many**: Salon → Offers

### Booking Relationships
- **Many-to-One**: Booking → User
- **Many-to-One**: Booking → Salon
- **Many-to-One**: Booking → Service
- **Many-to-One**: Booking → Stylist (optional)
- **One-to-One**: Booking → Payment
- **One-to-One**: Booking → Review

## 📝 Enums

### UserRole
```prisma
enum UserRole {
  ADMIN
  SALON_OWNER
  MANAGER
  STAFF
  CUSTOMER
}
```

### BookingStatus
```prisma
enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}
```

### PaymentStatus
```prisma
enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
  FAILED
}
```

### OfferType
```prisma
enum OfferType {
  PERCENTAGE
  FIXED_AMOUNT
  FREE_SERVICE
  BOGO
}
```

## 🔍 Indexes and Constraints

### Primary Indexes
- All models have UUID primary keys
- Display IDs are unique and auto-incrementing

### Performance Indexes
```sql
-- User lookups
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_phone ON "User"(phone);
CREATE INDEX idx_user_role ON "User"(role);

-- Salon searches
CREATE INDEX idx_salon_location ON "Salon"(latitude, longitude);
CREATE INDEX idx_salon_featured ON "Salon"(featured);
CREATE INDEX idx_salon_rating ON "Salon"(rating);

-- Booking queries
CREATE INDEX idx_booking_date ON "Booking"(date);
CREATE INDEX idx_booking_status ON "Booking"(status);
CREATE INDEX idx_booking_salon_date ON "Booking"(salonId, date);

-- Service searches
CREATE INDEX idx_service_salon ON "Service"(salonId);
CREATE INDEX idx_service_category ON "Service"(categoryId);
CREATE INDEX idx_service_active ON "Service"(isActive);
```

### Constraints
- **Unique Constraints**: Email, display IDs
- **Foreign Key Constraints**: All relations
- **Check Constraints**: Rating values (1-5), positive prices
- **Not Null Constraints**: Required fields

## 🔄 Data Flow

### User Registration Flow
1. User creates account → User table
2. Loyalty account created → LoyaltyAccount table
3. Email/phone verification → User.emailVerified/phoneVerified

### Booking Flow
1. User selects service → Service lookup
2. Availability check → Booking constraints
3. Booking creation → Booking table
4. Verification code generation → Booking.verificationCode
5. Payment processing → Payment table
6. Completion verification → Booking.status update

### Review Flow
1. Booking completion → BookingStatus.COMPLETED
2. Review creation → Review table
3. Salon rating update → Salon.rating recalculation

## 🚀 Migration Strategy

### Development Migrations
```bash
# Generate migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

### Production Migrations
```bash
# Deploy migrations
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

### Data Seeding
```bash
# Seed database
npx prisma db seed

# Custom seed scripts
npm run seed:categories
npm run seed:payment-methods
npm run seed:system-config
```

## 🔒 Security Considerations

### Data Protection
- Passwords hashed with bcrypt
- Sensitive data encrypted at rest
- PII data handling compliance
- Audit logs for critical operations

### Access Control
- Row-level security for multi-tenant data
- Role-based access control
- API rate limiting
- Input validation and sanitization

### Backup Strategy
- Daily automated backups
- Point-in-time recovery
- Cross-region backup replication
- Regular backup testing
