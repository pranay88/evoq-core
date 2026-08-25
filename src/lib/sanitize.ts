import { z } from 'zod';

/**
 * Strips dangerous HTML tags from a string.
 * This is a lightweight sanitizer for basic text inputs.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return input;
  
  // Basic stripping of script, style, iframe, object, embed, etc.
  let sanitized = input.replace(/<\/?(script|iframe|object|embed|style|link|meta|base|applet|form)[^>]*>/gi, '');
  
  // Strip javascript: uris
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Strip on* event handlers
  sanitized = sanitized.replace(/\bon[a-z]+\s*=\s*(['"]?)[^'">]*\1/gi, '');
  
  return sanitized.trim();
}

/**
 * A Zod schema preprocessor that automatically sanitizes and trims string inputs.
 * Usage: const mySchema = z.object({ name: sanitizedString(z.string().min(2)) })
 */
export function sanitizedString() {
  return z.preprocess((val) => {
    if (typeof val === 'string') {
      return sanitizeHtml(val);
    }
    return val;
  }, z.string());
}

/**
 * A Zod schema preprocessor for optional sanitized strings.
 */
export function sanitizedOptionalString() {
  return z.preprocess((val) => {
    if (typeof val === 'string') {
      return sanitizeHtml(val);
    }
    return val;
  }, z.string().optional());
}
