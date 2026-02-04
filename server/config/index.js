// Configuration with environment variable support
const required = ["AMI_HOST", "AMI_USER", "AMI_PASS"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
  console.error("Copy .env.example to .env and fill in your AMI credentials.");
  process.exit(1);
}

const isDevelopment = process.env.NODE_ENV !== "production";

module.exports = {
  PORT: process.env.PORT || 3000,
  AMI_PORT: process.env.AMI_PORT || 5038,
  AMI_HOST: process.env.AMI_HOST,
  AMI_USER: process.env.AMI_USER,
  AMI_PASS: process.env.AMI_PASS,
  // Debug events are disabled in production by default for security
  DEBUG_EVENTS: process.env.DEBUG_EVENTS === "true" || isDevelopment,
  IS_DEVELOPMENT: isDevelopment,
  // Log level: error, warn, info, debug (default: info in production, debug in development)
  LOG_LEVEL: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
};
