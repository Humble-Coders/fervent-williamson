# 🧪 Testing Guide

## 📋 Table of Contents
- [Testing Strategy](#testing-strategy)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [Integration Testing](#integration-testing)
- [Test Data Management](#test-data-management)
- [Continuous Integration](#continuous-integration)
- [Performance Testing](#performance-testing)

## 🎯 Testing Strategy

### Testing Pyramid
```
    /\
   /  \     E2E Tests (Few)
  /____\    
 /      \   Integration Tests (Some)
/________\  Unit Tests (Many)
```

### Coverage Goals
- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: Critical user flows
- **E2E Tests**: Key business scenarios
- **API Tests**: All endpoints tested

### Testing Principles
- **Fast Feedback**: Quick test execution
- **Reliable**: Consistent test results
- **Maintainable**: Easy to update tests
- **Comprehensive**: Cover edge cases
- **Isolated**: Tests don't depend on each other

## 🔧 Backend Testing

### Test Setup
**Framework**: Jest with TypeScript
**Location**: `backend/tests/`
**Configuration**: `backend/jest.config.js`

### Test Structure
```
backend/tests/
├── unit/
│   ├── services/
│   ├── utils/
│   └── middleware/
├── integration/
│   ├── auth/
│   ├── salons/
│   ├── bookings/
│   └── uploads/
├── fixtures/
│   ├── users.json
│   ├── salons.json
│   └── services.json
└── helpers/
    ├── testDb.ts
    ├── authHelper.ts
    └── mockData.ts
```

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts

# Run in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration
```

### Example Unit Test
```typescript
// tests/unit/services/AuthService.test.ts
import { AuthService } from '../../../src/services/AuthService';
import { prismaMock } from '../../helpers/prismaMock';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+1234567890'
      };

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'user-id',
        ...userData,
        role: 'CUSTOMER',
        createdAt: new Date()
      });

      const result = await authService.register(userData);

      expect(result.user.email).toBe(userData.email);
      expect(result.token).toBeDefined();
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'password123'
      };

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: userData.email
      });

      await expect(authService.register(userData))
        .rejects.toThrow('User with this email already exists');
    });
  });
});
```

### Example Integration Test
```typescript
// tests/integration/auth.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { setupTestDb, cleanupTestDb } from '../helpers/testDb';

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
  });
});
```

## ⚛️ Frontend Testing

### Test Setup
**Framework**: Vitest with React Testing Library
**Location**: `frontend/src/test/`
**Configuration**: `frontend/vite.config.ts`

### Test Structure
```
frontend/src/test/
├── components/
│   ├── auth/
│   ├── booking/
│   └── salon/
├── pages/
├── hooks/
├── services/
├── utils/
├── mocks/
│   ├── api.ts
│   ├── auth.ts
│   └── data.ts
└── setup.ts
```

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- LoginModal.test.tsx

# Run in watch mode
npm run test:watch

# Run UI tests
npm run test:ui
```

### Example Component Test
```typescript
// src/test/components/auth/LoginModal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { LoginModal } from '../../../components/auth/LoginModal';
import { useAuthStore } from '../../../store/authStore';

// Mock the auth store
vi.mock('../../../store/authStore');

describe('LoginModal', () => {
  const mockLogin = vi.fn();
  
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null
    });
  });

  it('renders login form', () => {
    render(<LoginModal isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    render(<LoginModal isOpen={true} onClose={() => {}} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('displays validation errors', async () => {
    render(<LoginModal isOpen={true} onClose={() => {}} />);
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });
});
```

### Example Hook Test
```typescript
// src/test/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';

vi.mock('../../store/authStore');

describe('useAuth', () => {
  it('should return auth state', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeDefined();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });
});
```

## 🔗 Integration Testing

### E2E Testing with Playwright
**Framework**: Playwright
**Location**: `frontend/e2e/`

### Test Structure
```
frontend/e2e/
├── auth/
│   ├── login.spec.ts
│   └── registration.spec.ts
├── booking/
│   ├── booking-flow.spec.ts
│   └── payment.spec.ts
├── salon/
│   ├── salon-listing.spec.ts
│   └── salon-detail.spec.ts
└── admin/
    ├── dashboard.spec.ts
    └── user-management.spec.ts
```

### Example E2E Test
```typescript
// e2e/booking/booking-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('complete booking process', async ({ page }) => {
    // Navigate to salon page
    await page.goto('/salons/beautiful-cuts/1');
    
    // Select a service
    await page.click('[data-testid="service-card-1"]');
    await page.click('[data-testid="book-now-button"]');
    
    // Select stylist
    await page.click('[data-testid="stylist-card-1"]');
    await page.click('[data-testid="continue-button"]');
    
    // Select date and time
    await page.click('[data-testid="date-picker"]');
    await page.click('[data-testid="date-15"]');
    await page.click('[data-testid="time-slot-14:00"]');
    await page.click('[data-testid="continue-button"]');
    
    // Complete booking
    await page.click('[data-testid="confirm-booking"]');
    
    // Verify success
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="verification-code"]')).toBeVisible();
  });
});
```

## 📊 Test Data Management

### Test Database Setup
```typescript
// tests/helpers/testDb.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL
    }
  }
});

export async function setupTestDb() {
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Salon" CASCADE`;
  // ... truncate other tables
  
  // Seed test data
  await seedTestData();
}

export async function cleanupTestDb() {
  await prisma.$disconnect();
}

async function seedTestData() {
  // Create test users, salons, services, etc.
}
```

### Mock Data Factory
```typescript
// tests/helpers/mockData.ts
export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'CUSTOMER',
  createdAt: new Date(),
  ...overrides
});

export const createMockSalon = (overrides = {}) => ({
  id: 'salon-1',
  displayId: 1,
  name: 'Test Salon',
  description: 'A test salon',
  address: '123 Test St',
  phone: '+1234567890',
  email: 'salon@example.com',
  rating: 4.5,
  reviewCount: 10,
  ...overrides
});
```

## 🚀 Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run tests
        run: cd backend && npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd frontend && npm ci
      
      - name: Run tests
        run: cd frontend && npm test
```

## ⚡ Performance Testing

### Load Testing with Artillery
```yaml
# performance/load-test.yml
config:
  target: 'http://localhost:3002'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50

scenarios:
  - name: "API Load Test"
    requests:
      - get:
          url: "/api/v1/salons"
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
```

### Running Performance Tests
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run performance/load-test.yml

# Generate report
artillery run --output report.json performance/load-test.yml
artillery report report.json
```
