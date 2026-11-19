/**
 * Security Hardening Middleware
 * - Security Headers (Protects against MIME sniffing, clickjacking, XSS)
 * - NoSQL Injection Prevention (Sanitizes body, query, and params against $ or dot operators)
 */

// Set standard secure HTTP response headers
const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // In production / HTTPS, add HSTS
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  // Remove Express fingerprint header
  res.removeHeader("X-Powered-By");

  next();
};

/**
 * Recursively sanitize an object to strip NoSQL operators (keys starting with '$' or containing '.')
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    // Drop keys containing MongoDB query operators like $gt, $ne, $where
    if (key.startsWith("$") || key.includes(".")) {
      console.warn(`[Security Alert] Blocked potential NoSQL injection key: "${key}"`);
      continue;
    }
    clean[key] = typeof value === "object" ? sanitizeObject(value) : value;
  }
  return clean;
};

// NoSQL Injection sanitizer middleware for body, query, and params
const sanitizeNoSQL = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

module.exports = {
  securityHeaders,
  sanitizeNoSQL,
};
