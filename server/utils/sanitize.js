/**
 * Sanitizes AMI events by redacting sensitive fields
 * Prevents accidental exposure of credentials, secrets, and PII
 */

// Fields that should be completely redacted
const SENSITIVE_FIELDS = [
  "secret",
  "password",
  "passwd",
  "token",
  "authtoken",
  "apikey",
  "api_key",
  "accountcode",
  "md5secret",
];

// Fields that may contain phone numbers or PII - partially redact
const PII_FIELDS = [
  "calleridnum",
  "callerid",
  "connectedlinenum",
  "dnid",
  "rdnis",
  "ani",
];

/**
 * Redacts a phone number, showing only last 4 digits
 * @param {string} value - The phone number to redact
 * @returns {string} - Redacted phone number
 */
function redactPhoneNumber(value) {
  if (!value || typeof value !== "string") return value;
  if (value.length <= 4) return value;
  return "***" + value.slice(-4);
}

/**
 * Sanitizes an AMI event object by redacting sensitive fields
 * @param {Object} evt - The AMI event object
 * @returns {Object} - Sanitized copy of the event
 */
function sanitizeEvent(evt) {
  if (!evt || typeof evt !== "object") return evt;

  const sanitized = {};

  for (const [key, value] of Object.entries(evt)) {
    const lowerKey = key.toLowerCase();

    // Completely redact sensitive fields
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    // Partially redact PII fields
    if (PII_FIELDS.some((field) => lowerKey.includes(field))) {
      sanitized[key] = redactPhoneNumber(String(value));
      continue;
    }

    // Recursively sanitize nested objects
    if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeEvent(value);
      continue;
    }

    // Pass through other values unchanged
    sanitized[key] = value;
  }

  return sanitized;
}

module.exports = { sanitizeEvent, redactPhoneNumber };
