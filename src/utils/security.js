/**
 * Security Utility Module
 * Provides XSS protection and input sanitization
 */

/**
 * Sanitize text to prevent XSS attacks
 * Escapes HTML special characters
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate and sanitize URLs
 * Prevents javascript:, data:, and other dangerous protocols
 * @param {string} url - The URL to validate
 * @returns {string} - Sanitized URL or empty string if invalid
 */
export const sanitizeURL = (url) => {
  if (!url) return '';
  
  const trimmedUrl = String(url).trim();
  
  // Block dangerous protocols
  if (/^(javascript|data|vbscript|file|about):/i.test(trimmedUrl)) {
    console.warn('Security: Blocked dangerous URL protocol', trimmedUrl);
    return '';
  }
  
  // Allow only http, https, and relative URLs
  const urlPattern = /^(https?:\/\/|\/)/i;
  if (!urlPattern.test(trimmedUrl)) {
    // If no protocol, prepend https://
    return 'https://' + trimmedUrl;
  }
  
  return trimmedUrl;
};

/**
 * Validate input length
 * Prevents storage exhaustion and buffer overflow attacks
 * @param {string} input - The input to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Truncated input
 */
export const validateLength = (input, maxLength) => {
  if (!input) return '';
  return String(input).substring(0, maxLength);
};

/**
 * Detect and prevent XSS patterns in user input
 * @param {string} input - The input to check
 * @returns {boolean} - True if input is safe, false if dangerous
 */
export const isInputSafe = (input) => {
  if (!input) return true;
  
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\(/gi,
    /expression\(/gi
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
};

/**
 * Sanitize object to prevent prototype pollution
 * Removes dangerous properties like __proto__, constructor, prototype
 * @param {Object} obj - The object to sanitize
 * @param {Array} allowedKeys - Whitelist of allowed property names
 * @returns {Object} - Sanitized object
 */
export const sanitizeObject = (obj, allowedKeys = []) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  const sanitized = {};
  
  Object.keys(obj).forEach(key => {
    // Block dangerous keys
    if (dangerousKeys.includes(key)) {
      console.warn(`Security: Blocked dangerous property: ${key}`);
      return;
    }
    
    // If allowlist provided, only include allowed keys
    if (allowedKeys.length > 0 && !allowedKeys.includes(key)) {
      return;
    }
    
    sanitized[key] = obj[key];
  });
  
  return sanitized;
};

/**
 * Create a safe HTML string for rendering
 * Use this when you need to display user content that might contain HTML
 * @param {string} html - The HTML string
 * @returns {string} - Sanitized HTML
 */
export const createSafeHTML = (html) => {
  if (!html) return '';
  
  // Remove all script tags and event handlers
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
};

/**
 * Validate date input
 * @param {string} dateString - The date string to validate
 * @returns {boolean} - True if valid date
 */
export const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Rate limiter implementation
 * Prevents spam and DoS attacks on client-side operations
 */
export class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = new Map();
  }

  canProceed(action) {
    const now = Date.now();
    
    if (!this.requests.has(action)) {
      this.requests.set(action, []);
    }
    
    const actionRequests = this.requests.get(action);
    
    // Remove old requests outside time window
    const validRequests = actionRequests.filter(
      time => now - time < this.timeWindow
    );
    
    if (validRequests.length >= this.maxRequests) {
      console.warn(`Security: Rate limit exceeded for ${action}`);
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(action, validRequests);
    return true;
  }

  reset(action) {
    if (action) {
      this.requests.delete(action);
    } else {
      this.requests.clear();
    }
  }
}

// Export singleton rate limiters for common actions
export const addHackathonLimiter = new RateLimiter(5, 60000); // 5 per minute
export const deleteHackathonLimiter = new RateLimiter(3, 60000); // 3 per minute
export const updateHackathonLimiter = new RateLimiter(10, 60000); // 10 per minute
