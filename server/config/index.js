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

module.exports = {
  PORT: process.env.PORT || 3000,
  AMI_PORT: process.env.AMI_PORT || 5038,
  AMI_HOST: process.env.AMI_HOST,
  AMI_USER: process.env.AMI_USER,
  AMI_PASS: process.env.AMI_PASS,
};
