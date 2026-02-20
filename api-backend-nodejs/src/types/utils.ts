// Utility types for better type safety

// Make all properties optional
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Make all properties required
export type Required<T> = {
  [P in keyof T]-?: T[P];
};

// Pick specific properties from a type
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit specific properties from a type
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Create a type with some properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Create a type with some properties required
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Extract the type of array elements
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

// Extract the return type of a function
export type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// Extract the parameters of a function
export type Parameters<T> = T extends (...args: infer P) => any ? P : never;

// Create a type that excludes null and undefined
export type NonNullable<T> = T extends null | undefined ? never : T;

// Create a union of all property names of a type
export type KeysOf<T> = keyof T;

// Create a union of all property values of a type
export type ValuesOf<T> = T[keyof T];

// Deep partial type
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Deep required type
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// Create a type that represents a record with string keys
export type StringRecord<T = any> = Record<string, T>;

// Create a type that represents a record with number keys
export type NumberRecord<T = any> = Record<number, T>;

// Create a type for environment variables
export type Environment = 'development' | 'production' | 'test';

// Create a type for HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

// Create a type for HTTP status codes
export type HttpStatusCode = 
  | 200 | 201 | 202 | 204
  | 400 | 401 | 403 | 404 | 409 | 422 | 429
  | 500 | 501 | 502 | 503 | 504;

// Create a type for log levels
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Create a type for sort orders
export type SortOrder = 'asc' | 'desc';

// Create a type for date formats
export type DateFormat = 'ISO' | 'timestamp' | 'date-only' | 'time-only';

// Create a type for file types
export type FileType = 'image' | 'document' | 'video' | 'audio' | 'other';

// Create a type for image formats
export type ImageFormat = 'jpeg' | 'jpg' | 'png' | 'gif' | 'webp' | 'svg';

// Create a type for document formats
export type DocumentFormat = 'pdf' | 'doc' | 'docx' | 'txt' | 'rtf';

// Create a type for time units
export type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

// Create a type for currency codes
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

// Create a type for phone number formats
export type PhoneFormat = 'international' | 'national' | 'e164' | 'rfc3966';

// Create a type for email validation levels
export type EmailValidation = 'basic' | 'strict' | 'disposable-check';

// Create a type for password strength levels
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';

// Create a type for API versions
export type ApiVersion = 'v1' | 'v2' | 'v3';

// Create a type for cache strategies
export type CacheStrategy = 'memory' | 'redis' | 'database' | 'file';

// Create a type for queue priorities
export type QueuePriority = 'low' | 'normal' | 'high' | 'critical';

// Create a type for notification types
export type NotificationType = 'email' | 'sms' | 'push' | 'in-app';

// Create a type for audit actions
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout';

// Create a type for feature flags
export type FeatureFlag = 'enabled' | 'disabled' | 'beta' | 'alpha';

// Create a type for deployment environments
export type DeploymentEnvironment = 'local' | 'development' | 'staging' | 'production';

// Create a type for database operations
export type DatabaseOperation = 'select' | 'insert' | 'update' | 'delete' | 'upsert';

// Create a type for validation rules
export type ValidationRule = 'required' | 'email' | 'phone' | 'url' | 'date' | 'number' | 'string' | 'boolean' | 'array' | 'object';

// Create a type for error categories
export type ErrorCategory = 'validation' | 'authentication' | 'authorization' | 'not-found' | 'conflict' | 'rate-limit' | 'server' | 'external';

// Create a type for service status
export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
