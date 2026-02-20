# 🧪 cutq Backend Testing Guide

This document provides comprehensive information about the testing infrastructure and test suites for the cutq backend application.

## 📋 Table of Contents

1. [Test Overview](#test-overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Suites](#test-suites)
5. [Test Data & Setup](#test-data--setup)
6. [Coverage Reports](#coverage-reports)
7. [CI/CD Integration](#cicd-integration)
8. [Writing New Tests](#writing-new-tests)

## 🎯 Test Overview

The cutq backend includes comprehensive test coverage for:

- **Unit Tests**: Individual functions and modules
- **Integration Tests**: API endpoints and workflows
- **End-to-End Tests**: Complete user journeys
- **Service Tests**: External service integrations

### Test Statistics

- **Total Test Files**: 8+
- **Test Categories**: 7 main categories
- **Coverage Target**: 90%+
- **Test Environment**: Isolated PostgreSQL database

## 🏗️ Test Structure

```
backend/
├── tests/
│   ├── setup.ts                 # Test configuration and utilities
│   ├── globalSetup.ts          # Global test setup
│   ├── globalTeardown.ts       # Global test cleanup
│   ├── runTests.ts             # Custom test runner
│   ├── auth.test.ts            # Authentication tests
│   ├── user.test.ts            # User management tests
│   ├── salon.test.ts           # Salon management tests
│   ├── service.test.ts         # Service management tests
│   ├── booking.test.ts         # Booking system tests
│   ├── otp.test.ts             # OTP service tests
│   ├── systemConfig.test.ts    # System configuration tests
│   └── integration/
│       └── bookingFlow.test.ts # End-to-end booking flows
├── jest.config.js              # Jest configuration
└── package.json               # Test scripts
```

## 🚀 Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm run test:auth
npm run test:booking
npm run test:salon
```

### Advanced Test Commands

```bash
# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests for CI/CD
npm run test:ci

# Run specific test file
npm test auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create user"
```

### Custom Test Runner

```bash
# Run all test suites with detailed output
npx ts-node tests/runTests.ts all

# Run specific test suite
npx ts-node tests/runTests.ts auth
npx ts-node tests/runTests.ts booking

# Generate coverage report
npx ts-node tests/runTests.ts coverage

# Show help
npx ts-node tests/runTests.ts help
```

## 📚 Test Suites

### 1. Authentication Tests (`auth.test.ts`)

**Coverage**: User registration, login, JWT handling, password reset

**Key Test Cases**:
- ✅ User registration with validation
- ✅ Login with valid/invalid credentials
- ✅ JWT token generation and validation
- ✅ Refresh token functionality
- ✅ Password reset flow
- ✅ Account activation/deactivation
- ✅ Session management

**Example**:
```typescript
describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);
    
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data.user).not.toHaveProperty('password');
  });
});
```

### 2. User Management Tests (`user.test.ts`)

**Coverage**: User CRUD operations, profile management, permissions

**Key Test Cases**:
- ✅ User creation by admin
- ✅ User profile updates
- ✅ Permission-based access control
- ✅ User status management
- ✅ Password hashing verification
- ✅ User deletion and cascade effects

### 3. Salon Management Tests (`salon.test.ts`)

**Coverage**: Salon CRUD operations, search, availability

**Key Test Cases**:
- ✅ Salon creation and validation
- ✅ Salon search and filtering
- ✅ Availability checking
- ✅ Owner permissions
- ✅ Salon activation/deactivation
- ✅ Working hours management

### 4. Service Management Tests (`service.test.ts`)

**Coverage**: Service CRUD operations, categories, pricing

**Key Test Cases**:
- ✅ Service creation and validation
- ✅ Price and duration validation
- ✅ Category management
- ✅ Service activation/deactivation
- ✅ Salon-service relationships

### 5. Booking System Tests (`booking.test.ts`)

**Coverage**: Booking creation, modification, cancellation

**Key Test Cases**:
- ✅ Booking creation with validation
- ✅ Availability conflict detection
- ✅ Booking status management
- ✅ Time slot validation
- ✅ Business hours enforcement
- ✅ Cancellation policies
- ✅ Multi-user booking scenarios

### 6. OTP Service Tests (`otp.test.ts`)

**Coverage**: Email/SMS OTP generation and verification

**Key Test Cases**:
- ✅ Development mode static OTP
- ✅ Production mode dynamic OTP
- ✅ Email OTP generation
- ✅ SMS OTP generation
- ✅ OTP verification
- ✅ Configuration-based behavior
- ✅ Error handling

### 7. System Configuration Tests (`systemConfig.test.ts`)

**Coverage**: Admin settings, feature toggles, system configuration

**Key Test Cases**:
- ✅ Configuration CRUD operations
- ✅ Admin-only access control
- ✅ Configuration validation
- ✅ Public vs private configurations
- ✅ Type-specific validation
- ✅ Configuration categories

### 8. Integration Tests (`integration/bookingFlow.test.ts`)

**Coverage**: End-to-end user journeys and complex workflows

**Key Test Cases**:
- ✅ Complete booking flow (discovery to confirmation)
- ✅ Booking conflict resolution
- ✅ Multi-service bookings
- ✅ Cancellation and modification flows
- ✅ Error handling scenarios
- ✅ Business rule enforcement

## 🛠️ Test Data & Setup

### Test Database

Tests use an isolated PostgreSQL database:

```bash
# Database URL for tests
DATABASE_URL="postgresql://test:test@localhost:5432/cutq_test"
```

### Test Data Factory

The `setup.ts` file provides:

- **Test Users**: Admin, salon owner, customer
- **Test Salons**: Complete salon data with working hours
- **Test Services**: Services with categories and pricing
- **Test Bookings**: Various booking scenarios
- **Helper Functions**: Data creation utilities

### Cleanup Strategy

- **Before Each Test**: Clean all test data
- **After All Tests**: Disconnect from database
- **Isolation**: Each test runs in clean state

## 📊 Coverage Reports

### Generating Coverage

```bash
# Generate HTML coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

### Coverage Targets

- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

### Coverage Exclusions

- Configuration files
- Database migrations
- Script files
- Type definitions

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Backend Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
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
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/cutq_test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

```bash
# Install pre-commit hooks
npm run pre-commit

# This runs:
# - Linting
# - Type checking
# - Tests
# - Format checking
```

## ✍️ Writing New Tests

### Test File Structure

```typescript
import request from 'supertest';
import { app } from '../src/app';
import { testPrisma, testData, cleanupTestData } from './setup';

describe('Feature Name', () => {
  beforeEach(async () => {
    await cleanupTestData();
    // Setup test data
  });

  describe('API Endpoint', () => {
    it('should handle success case', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .send(testData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should handle error case', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
```

### Best Practices

1. **Descriptive Test Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Test Isolation**: Each test should be independent
4. **Mock External Services**: Mock third-party APIs
5. **Test Edge Cases**: Include error scenarios
6. **Use Test Data Factory**: Leverage setup utilities
7. **Verify Database State**: Check data persistence
8. **Clean Up**: Ensure proper cleanup

### Adding New Test Suites

1. Create test file in `tests/` directory
2. Add test script to `package.json`
3. Update test runner in `runTests.ts`
4. Add documentation to this file
5. Update CI/CD configuration if needed

## 🐛 Debugging Tests

### Common Issues

1. **Database Connection**: Ensure test database is running
2. **Port Conflicts**: Check if test server port is available
3. **Async Issues**: Properly handle async operations
4. **Test Data**: Verify test data setup
5. **Environment Variables**: Check test environment config

### Debug Commands

```bash
# Run single test with debug output
npm test -- --verbose auth.test.ts

# Run tests with Node.js debugging
node --inspect-brk node_modules/.bin/jest auth.test.ts

# Run tests with increased timeout
npm test -- --testTimeout=30000
```

## 📈 Test Metrics

### Current Status

- **Total Tests**: 150+ test cases
- **Test Suites**: 8 main suites
- **Coverage**: 90%+ target
- **Execution Time**: ~2-3 minutes
- **Success Rate**: 100% target

### Performance Benchmarks

- **Unit Tests**: <100ms per test
- **Integration Tests**: <500ms per test
- **Full Suite**: <3 minutes
- **Coverage Generation**: <30 seconds

---

## 🎯 Next Steps

1. **Add E2E Tests**: Browser-based testing with Playwright
2. **Performance Tests**: Load testing with Artillery
3. **Security Tests**: Vulnerability scanning
4. **API Documentation Tests**: OpenAPI validation
5. **Database Migration Tests**: Schema change validation

For questions or issues with testing, please refer to the development team or create an issue in the project repository.
