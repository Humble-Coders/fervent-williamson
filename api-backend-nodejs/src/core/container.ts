/**
 * Dependency Injection Container
 * Simple IoC container for managing service dependencies
 */

type Constructor<T = {}> = new (...args: any[]) => T;
type Factory<T = any> = (...args: any[]) => T;

interface ServiceDefinition<T = any> {
  factory: Factory<T>;
  singleton: boolean;
  instance?: T;
  dependencies?: string[];
}

export class Container {
  private services = new Map<string, ServiceDefinition>();
  private resolving = new Set<string>();

  /**
   * Register a service with the container
   */
  register<T>(
    name: string,
    factory: Factory<T> | Constructor<T>,
    options: { singleton?: boolean; dependencies?: string[] } = {}
  ): void {
    const { singleton = true, dependencies = [] } = options;

    this.services.set(name, {
      factory: typeof factory === 'function' && factory.prototype 
        ? (...args: any[]) => new (factory as Constructor<T>)(...args)
        : factory as Factory<T>,
      singleton,
      dependencies
    });
  }

  /**
   * Register a singleton service
   */
  singleton<T>(
    name: string,
    factory: Factory<T> | Constructor<T>,
    dependencies: string[] = []
  ): void {
    this.register(name, factory, { singleton: true, dependencies });
  }

  /**
   * Register a transient service (new instance each time)
   */
  transient<T>(
    name: string,
    factory: Factory<T> | Constructor<T>,
    dependencies: string[] = []
  ): void {
    this.register(name, factory, { singleton: false, dependencies });
  }

  /**
   * Register an instance directly
   */
  instance<T>(name: string, instance: T): void {
    this.services.set(name, {
      factory: () => instance,
      singleton: true,
      instance
    });
  }

  /**
   * Resolve a service by name
   */
  resolve<T>(name: string): T {
    const service = this.services.get(name);
    
    if (!service) {
      throw new Error(`Service '${name}' not found in container`);
    }

    // Check for circular dependencies
    if (this.resolving.has(name)) {
      throw new Error(`Circular dependency detected for service '${name}'`);
    }

    // Return existing singleton instance
    if (service.singleton && service.instance) {
      return service.instance;
    }

    // Mark as resolving
    this.resolving.add(name);

    try {
      // Resolve dependencies
      const dependencies = service.dependencies?.map(dep => this.resolve(dep)) || [];
      
      // Create instance
      const instance = service.factory(...dependencies);

      // Store singleton instance
      if (service.singleton) {
        service.instance = instance;
      }

      return instance;
    } finally {
      // Remove from resolving set
      this.resolving.delete(name);
    }
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.resolving.clear();
  }

  /**
   * Create a child container that inherits from this one
   */
  createChild(): Container {
    const child = new Container();
    
    // Copy all service definitions
    for (const [name, service] of this.services) {
      child.services.set(name, { ...service });
    }
    
    return child;
  }
}

// Export singleton container instance
export const container = new Container();

// Decorator for automatic dependency injection
export function Injectable(dependencies: string[] = []) {
  return function <T extends Constructor>(target: T) {
    return class extends target {
      constructor(...args: any[]) {
        const resolvedDeps = dependencies.map(dep => container.resolve(dep));
        super(...resolvedDeps, ...args);
      }
    };
  };
}

// Helper function to register services from configuration
export function registerServices(config: any): void {
  // This will be implemented when we create the actual services
  // For now, it's a placeholder for the registration logic
}

// Type-safe service resolution
export function getService<T>(name: string): T {
  return container.resolve<T>(name);
}

// Service registration helpers
export const Services = {
  // Service name constants
  AUTH: 'auth',
  OTP: 'otp',
  EMAIL: 'email',
  SMS: 'sms',
  STORAGE: 'storage',
  LOGGER: 'logger',
  DATABASE: 'database',
  
  // Repository names
  USER_REPOSITORY: 'userRepository',
  SALON_REPOSITORY: 'salonRepository',
  BOOKING_REPOSITORY: 'bookingRepository',
  
  // Provider names
  EMAIL_PROVIDER: 'emailProvider',
  SMS_PROVIDER: 'smsProvider',
  STORAGE_PROVIDER: 'storageProvider',
} as const;
