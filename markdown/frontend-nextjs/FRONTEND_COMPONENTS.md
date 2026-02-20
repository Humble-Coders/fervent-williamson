# 🎨 Frontend Components Documentation

## 📋 Table of Contents
- [Component Architecture](#component-architecture)
- [Layout Components](#layout-components)
- [Authentication Components](#authentication-components)
- [Booking Components](#booking-components)
- [Salon Components](#salon-components)
- [Admin Components](#admin-components)
- [Common UI Components](#common-ui-components)
- [State Management](#state-management)
- [Routing System](#routing-system)

## 🏗️ Component Architecture

### Component Structure
```
src/components/
├── admin/           # Admin-specific components
├── auth/            # Authentication components
├── booking/         # Booking flow components
├── common/          # Shared components
├── dashboard/       # Dashboard components
├── home/            # Homepage components
├── layout/          # Layout components
├── modals/          # Modal components
├── salon/           # CutQ-related components
├── seo/             # SEO components
└── ui/              # Base UI components
```

### Design Principles
- **Reusability**: Components designed for multiple use cases
- **Composition**: Small, focused components that compose well
- **Accessibility**: ARIA labels and keyboard navigation
- **Responsive**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript support with proper interfaces

## 🏠 Layout Components

### CustomerLayout
**Location**: `src/layouts/CustomerLayout.tsx`
**Purpose**: Main layout for customer-facing pages

**Features**:
- Responsive header with navigation
- Mobile bottom navigation
- Footer with links
- Authentication state handling
- SEO meta tags

**Usage**:
```tsx
<CustomerLayout>
  <HomePage />
</CustomerLayout>
```

### AdminLayout
**Location**: `src/layouts/AdminLayout.tsx`
**Purpose**: Admin dashboard layout

**Features**:
- Sidebar navigation
- Admin-specific header
- Role-based menu items
- Breadcrumb navigation
- Quick actions

### SalonLayout
**Location**: `src/layouts/SalonLayout.tsx`
**Purpose**: CutQ owner dashboard layout

**Features**:
- CutQ-specific navigation
- Business context switching
- Analytics widgets
- Quick booking overview

## 🔐 Authentication Components

### LoginModal
**Location**: `src/components/auth/LoginModal.tsx`
**Purpose**: User authentication modal

**Features**:
- Email/password login
- Social authentication buttons
- OTP verification flow
- Form validation with Zod
- Error handling

**Props**:
```tsx
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}
```

### SignupForm
**Location**: `src/components/auth/SignupForm.tsx`
**Purpose**: User registration form

**Features**:
- Multi-step registration
- Email and phone verification
- Social signup options
- Terms acceptance
- Real-time validation

### OTPVerification
**Location**: `src/components/auth/OTPVerification.tsx`
**Purpose**: OTP verification component

**Features**:
- 6-digit OTP input
- Resend functionality
- Timer countdown
- Auto-submit on completion

## 📅 Booking Components

### BookingFlow
**Location**: `src/components/booking/BookingFlow.tsx`
**Purpose**: Multi-step booking process

**Steps**:
1. Service confirmation
2. Stylist selection
3. Date & time picker
4. Payment method
5. Review & confirm

**Features**:
- Step navigation
- Progress indicator
- Form persistence
- Validation at each step

### ServiceSelection
**Location**: `src/components/booking/ServiceSelection.tsx`
**Purpose**: Service selection component

**Features**:
- Service cards with images
- Category filtering
- Price display
- Duration information
- Add-on services

### DateTimePicker
**Location**: `src/components/booking/DateTimePicker.tsx`
**Purpose**: Appointment scheduling

**Features**:
- Calendar widget
- Available time slots
- Stylist availability
- Booking constraints
- Real-time updates

### BookingSummary
**Location**: `src/components/booking/BookingSummary.tsx`
**Purpose**: Booking confirmation summary

**Features**:
- Service details
- Pricing breakdown
- Appointment information
- Cancellation policy
- Verification code display

## 🏪 Salon Components

### SalonCard
**Location**: `src/components/salon/SalonCard.tsx`
**Purpose**: CutQ listing card

**Features**:
- Image gallery with auto-scroll
- Rating and reviews
- Distance calculation
- Favorite toggle
- Quick booking button

**Props**:
```tsx
interface SalonCardProps {
  salon: Salon;
  showDistance?: boolean;
  onFavoriteToggle?: (salonId: string) => void;
}
```

### SalonHeader
**Location**: `src/components/salon/SalonHeader.tsx`
**Purpose**: CutQ detail page header

**Features**:
- Auto-scrolling image gallery
- Business information
- Contact details
- Working hours
- Map integration

### ServiceCard
**Location**: `src/components/salon/ServiceCard.tsx`
**Purpose**: Service display card

**Features**:
- Service images
- Pricing information
- Duration display
- Category badge
- Book now button

### StylistCard
**Location**: `src/components/salon/StylistCard.tsx`
**Purpose**: Stylist profile card

**Features**:
- Profile image (rectangular format)
- Specialties display
- Experience information
- Availability indicator
- Select button

## 👑 Admin Components

### AdminDashboard
**Location**: `src/components/admin/AdminDashboard.tsx`
**Purpose**: Main admin dashboard

**Features**:
- Platform statistics
- Recent activities
- Quick actions
- Performance metrics
- System health

### UserManagement
**Location**: `src/components/admin/UserManagement.tsx`
**Purpose**: User administration

**Features**:
- User listing with filters
- Role management
- Account status control
- Bulk operations
- User details modal

### SalonApproval
**Location**: `src/components/admin/SalonApproval.tsx`
**Purpose**: CutQ registration approval

**Features**:
- Pending requests list
- Business verification
- Document review
- Approval/rejection workflow
- Communication tools

## 🧩 Common UI Components

### Button
**Location**: `src/components/ui/Button.tsx`
**Purpose**: Reusable button component

**Variants**:
- Primary, secondary, outline
- Small, medium, large sizes
- Loading states
- Icon support

### Modal
**Location**: `src/components/ui/Modal.tsx`
**Purpose**: Modal dialog component

**Features**:
- Backdrop click to close
- Escape key handling
- Focus management
- Animation transitions
- Size variants

### Card
**Location**: `src/components/ui/Card.tsx`
**Purpose**: Content container

**Features**:
- Consistent styling
- Shadow variants
- Hover effects
- Responsive design

### Input
**Location**: `src/components/ui/Input.tsx`
**Purpose**: Form input component

**Features**:
- Multiple input types
- Validation states
- Icon support
- Label integration
- Error messages

## 🗂️ State Management

### Auth Store
**Location**: `src/store/authStore.ts`
**Purpose**: Authentication state management

**State**:
```tsx
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

### Booking Store
**Location**: `src/store/bookingStore.ts`
**Purpose**: Booking flow state

**State**:
```tsx
interface BookingState {
  selectedService: Service | null;
  selectedSalon: Salon | null;
  selectedStylist: Stylist | null;
  selectedDate: string | null;
  selectedTime: string | null;
  currentStep: number;
}
```

### Salon Store
**Location**: `src/store/salonStore.ts`
**Purpose**: CutQ-related state

**State**:
```tsx
interface SalonState {
  currentSalon: Salon | null;
  services: Service[];
  reviews: Review[];
  loading: boolean;
  error: string | null;
}
```

## 🛣️ Routing System

### Route Structure
```
/                           # Homepage
/salons                     # CutQ listing
/salons/:salonName/:id      # CutQ detail (SEO-friendly)
/booking                    # Booking flow
/booking/confirmation       # Booking success
/profile                    # User profile
/favorites                  # User favorites
/appointments               # User appointments

/admin/*                    # Admin routes
/salon/*                    # CutQ owner routes
```

### Protected Routes
- **Authentication Required**: Profile, favorites, appointments
- **Role-Based**: Admin and salon owner routes
- **Guest Access**: Homepage, CutQ listing, CutQ details

### Route Components
- **ProtectedRoute**: Authentication wrapper
- **RoleBasedRoute**: Role authorization wrapper
- **PageWrapper**: SEO and layout wrapper

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Features
- Bottom navigation bar
- Touch-friendly interactions
- Swipe gestures
- Optimized image loading
- Reduced data usage

### Accessibility
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- High contrast support
- Focus management
