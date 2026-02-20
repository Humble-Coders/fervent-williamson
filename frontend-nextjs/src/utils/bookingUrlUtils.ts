/**
 * Utility functions for encoding/decoding booking data in URLs
 * Supports multiple services with quantities in a compressed format
 */

interface ServiceItem {
  serviceId: string;
  subServiceId?: string;
  quantity?: number;
}

/**
 * Encode multiple services into a compressed URL parameter
 * Format: serviceId:subServiceId:qty,serviceId:subServiceId:qty
 * Example: "5:10:2,7::1,8:12:3" means:
 *   - Service 5, SubService 10, Quantity 2
 *   - Service 7, No SubService, Quantity 1
 *   - Service 8, SubService 12, Quantity 3
 */
export function encodeServicesForUrl(services: ServiceItem[]): string {
  if (!services || services.length === 0) return '';
  
  return services
    .map(item => {
      const parts = [
        item.serviceId,
        item.subServiceId || '',
        (item.quantity || 1).toString()
      ];
      return parts.join(':');
    })
    .join(',');
}

/**
 * Decode services from URL parameter
 * Returns array of service items with serviceId, subServiceId, and quantity
 */
export function decodeServicesFromUrl(encoded: string): ServiceItem[] {
  if (!encoded || encoded.trim() === '') return [];
  
  try {
    return encoded.split(',').map(item => {
      const [serviceId, subServiceId, quantity] = item.split(':');
      return {
        serviceId,
        subServiceId: subServiceId || undefined,
        quantity: parseInt(quantity) || 1
      };
    });
  } catch (error) {
    console.error('Failed to decode services from URL:', error);
    return [];
  }
}

/**
 * Build booking URL with all selected services
 */
export function buildBookingUrl(
  salonId: string,
  services: ServiceItem[],
  couponCode?: string
): string {
  const params = new URLSearchParams();
  params.set('salonId', salonId);
  
  const encodedServices = encodeServicesForUrl(services);
  if (encodedServices) {
    params.set('services', encodedServices);
  }
  
  if (couponCode) {
    params.set('coupon', couponCode);
  }
  
  return `/booking?${params.toString()}`;
}

