/**
 * URL utilities for handling redirects and navigation
 */

/**
 * Get current page URL for redirect purposes
 * @returns {string} Current pathname with search params
 */
export const getCurrentUrl = (): string => {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname + window.location.search;
};

/**
 * Create login URL with redirect parameter
 * @param {string} redirectUrl - URL to redirect back to after login
 * @returns {string} Login URL with encoded redirect parameter
 */
export const createLoginUrl = (redirectUrl?: string): string => {
  const url = redirectUrl || getCurrentUrl();
  return `/login?redirect=${encodeURIComponent(url)}`;
};

/**
 * Get redirect URL from search params, with fallback
 * @param {URLSearchParams} searchParams - URL search parameters
 * @param {string} defaultUrl - Default URL if no redirect param (default: '/')
 * @returns {string} Decoded redirect URL or default
 */
export const getRedirectUrl = (searchParams: URLSearchParams, defaultUrl: string = '/'): string => {
  try {
    const redirect = searchParams.get('redirect');
    if (!redirect) return defaultUrl;
    
    const decodedUrl = decodeURIComponent(redirect);
    
    // Security check: ensure redirect is relative URL (prevent open redirects)
    if (decodedUrl.startsWith('/') && !decodedUrl.startsWith('//')) {
      return decodedUrl;
    }
    
    return defaultUrl;
  } catch (error) {
    console.warn('Failed to decode redirect URL:', error);
    return defaultUrl;
  }
};

/**
 * Safe redirect with URL encoding
 * @param {any} router - Next.js router instance
 * @param {string} message - Toast message to show
 * @param {any} showError - Toast error function
 * @param {string} redirectUrl - Optional specific redirect URL
 */
export const redirectToLogin = (
  router: any, 
  message: string, 
  showError: any, 
  redirectUrl?: string
): void => {
  showError(message);
  const loginUrl = createLoginUrl(redirectUrl);
  router.push(loginUrl);
};

/**
 * Pages where users can add to cart or need authentication
 */
export const CART_ENABLED_PAGES = [
  '/',
  '/new',
  '/sale', 
  '/products',
  '/featured',
  '/products/[id]'  // Dynamic product pages
];

/**
 * Check if current page supports cart operations
 * @param {string} pathname - Current page pathname
 * @returns {boolean} True if page supports cart operations
 */
export const isCartEnabledPage = (pathname: string): boolean => {
  return CART_ENABLED_PAGES.some(page => {
    if (page.includes('[id]')) {
      return pathname.match(/^\/products\/[^\/]+$/);
    }
    return pathname === page;
  });
};
