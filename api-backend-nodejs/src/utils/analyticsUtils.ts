import { DeviceType } from '@prisma/client';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Detect device type from user agent string
 */
export function detectDeviceType(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();
  
  // Mobile detection
  if (ua.includes('mobile') || 
      ua.includes('android') || 
      ua.includes('iphone') || 
      ua.includes('ipod') || 
      ua.includes('blackberry') || 
      ua.includes('windows phone')) {
    return DeviceType.MOBILE;
  }
  
  // Tablet detection
  if (ua.includes('tablet') || 
      ua.includes('ipad') || 
      ua.includes('kindle') || 
      ua.includes('silk') || 
      (ua.includes('android') && !ua.includes('mobile'))) {
    return DeviceType.TABLET;
  }
  
  // Default to desktop
  return DeviceType.DESKTOP;
}

/**
 * Extract IP address from request
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  const realIP = req.headers['x-real-ip'] as string;
  const clientIP = req.connection?.remoteAddress || req.socket?.remoteAddress;
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return clientIP || 'unknown';
}

/**
 * Generate or extract session ID from request
 */
export function getSessionId(req: Request): string {
  // Try to get session ID from various sources
  const sessionId = req.headers['x-session-id'] as string ||
                   req.cookies?.sessionId ||
                   req.session?.id;
  
  if (sessionId) {
    return sessionId;
  }
  
  // Generate new session ID
  const newSessionId = uuidv4();
  
  // Store in session if available
  if (req.session) {
    req.session.id = newSessionId;
  }
  
  return newSessionId;
}

/**
 * Extract page route from request path
 */
export function getPageRoute(req: Request): string {
  const path = req.path || req.url || '/';
  
  // Normalize the path
  let normalizedPath = path;
  
  // Remove query parameters
  const queryIndex = normalizedPath.indexOf('?');
  if (queryIndex !== -1) {
    normalizedPath = normalizedPath.substring(0, queryIndex);
  }
  
  // Remove trailing slash except for root
  if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.slice(0, -1);
  }
  
  return normalizedPath;
}

/**
 * Extract business context from request
 */
export function extractBusinessContext(req: Request) {
  const path = req.path || req.url || '/';
  const query = req.query;
  
  const context: {
    salonId?: string;
    salonDisplayId?: number;
    serviceId?: string;
    serviceDisplayId?: number;
    stylistId?: string;
    stylistDisplayId?: number;
    bookingId?: string;
    bookingDisplayId?: number;
  } = {};
  
  // Extract from URL parameters
  if (req.params) {
    if (req.params.salonId) context.salonId = req.params.salonId;
    if (req.params.serviceId) context.serviceId = req.params.serviceId;
    if (req.params.stylistId) context.stylistId = req.params.stylistId;
    if (req.params.bookingId) context.bookingId = req.params.bookingId;
    
    // Extract display IDs
    if (req.params.salonDisplayId) context.salonDisplayId = parseInt(req.params.salonDisplayId);
    if (req.params.serviceDisplayId) context.serviceDisplayId = parseInt(req.params.serviceDisplayId);
    if (req.params.stylistDisplayId) context.stylistDisplayId = parseInt(req.params.stylistDisplayId);
    if (req.params.bookingDisplayId) context.bookingDisplayId = parseInt(req.params.bookingDisplayId);
  }
  
  // Extract from query parameters
  if (query.salonId && typeof query.salonId === 'string') context.salonId = query.salonId;
  if (query.serviceId && typeof query.serviceId === 'string') context.serviceId = query.serviceId;
  if (query.stylistId && typeof query.stylistId === 'string') context.stylistId = query.stylistId;
  if (query.bookingId && typeof query.bookingId === 'string') context.bookingId = query.bookingId;
  
  if (query.salonDisplayId && typeof query.salonDisplayId === 'string') {
    context.salonDisplayId = parseInt(query.salonDisplayId);
  }
  if (query.serviceDisplayId && typeof query.serviceDisplayId === 'string') {
    context.serviceDisplayId = parseInt(query.serviceDisplayId);
  }
  if (query.stylistDisplayId && typeof query.stylistDisplayId === 'string') {
    context.stylistDisplayId = parseInt(query.stylistDisplayId);
  }
  if (query.bookingDisplayId && typeof query.bookingDisplayId === 'string') {
    context.bookingDisplayId = parseInt(query.bookingDisplayId);
  }
  
  return context;
}

/**
 * Sanitize user agent string
 */
export function sanitizeUserAgent(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  // Limit length and remove potentially sensitive information
  return userAgent.substring(0, 500).replace(/[<>]/g, '');
}

/**
 * Get referrer from request
 */
export function getReferrer(req: Request): string | undefined {
  const referrer = req.headers.referer || req.headers.referrer;
  
  if (!referrer || typeof referrer !== 'string') {
    return undefined;
  }
  
  // Limit length and sanitize
  return referrer.substring(0, 500);
}

/**
 * Determine if request is from a bot/crawler
 */
export function isBot(userAgent: string): boolean {
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python',
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
    'yandexbot', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
    'whatsapp', 'telegram', 'slack', 'discord'
  ];
  
  const ua = userAgent.toLowerCase();
  return botPatterns.some(pattern => ua.includes(pattern));
}

/**
 * Create analytics metadata from request
 */
export function createAnalyticsMetadata(req: Request, additionalData?: Record<string, any>) {
  const metadata: Record<string, any> = {
    method: req.method,
    path: req.path,
    query: req.query,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
  
  // Add headers that might be useful for analytics
  if (req.headers['accept-language']) {
    metadata.language = req.headers['accept-language'];
  }
  
  if (req.headers['accept-encoding']) {
    metadata.encoding = req.headers['accept-encoding'];
  }
  
  return metadata;
}

/**
 * Validate analytics event data
 */
export function validateAnalyticsEvent(data: any): boolean {
  // Basic validation
  if (!data.sessionId || typeof data.sessionId !== 'string') return false;
  if (!data.eventType || typeof data.eventType !== 'string') return false;
  if (!data.page || typeof data.page !== 'string') return false;
  
  // Validate enum values
  const validEventTypes = ['PAGE_VIEW', 'ACTION', 'CONVERSION', 'ERROR'];
  if (!validEventTypes.includes(data.eventType)) return false;
  
  const validDeviceTypes = ['MOBILE', 'DESKTOP', 'TABLET'];
  if (data.deviceType && !validDeviceTypes.includes(data.deviceType)) return false;
  
  const validUserRoles = ['ADMIN', 'SALON_OWNER', 'MANAGER', 'STAFF', 'CUSTOMER'];
  if (data.userRole && !validUserRoles.includes(data.userRole)) return false;
  
  return true;
}

/**
 * Rate limiting for analytics events (prevent spam)
 */
const eventCounts = new Map<string, { count: number; resetTime: number }>();

export function isRateLimited(sessionId: string, maxEvents: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = sessionId;
  
  const current = eventCounts.get(key);
  
  if (!current || now > current.resetTime) {
    eventCounts.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (current.count >= maxEvents) {
    return true;
  }
  
  current.count++;
  return false;
}

/**
 * Clean up rate limiting cache
 */
export function cleanupRateLimitCache(): void {
  const now = Date.now();
  for (const [key, value] of eventCounts.entries()) {
    if (now > value.resetTime) {
      eventCounts.delete(key);
    }
  }
}

// Clean up rate limit cache every 5 minutes
setInterval(cleanupRateLimitCache, 5 * 60 * 1000);
