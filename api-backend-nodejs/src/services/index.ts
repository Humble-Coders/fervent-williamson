// Service layer barrel exports
export { AuthService } from './AuthService';
export * from './otpService';

// Re-export service interfaces
export type {
  IUserService,
  ICustomerService,
  IStylistService,
  IServiceService,
  IAppointmentService,
  IPaymentService,
  IReviewService,
  IAuthService,
} from '../types';
