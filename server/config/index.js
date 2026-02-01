// Configuration with environment variable support
module.exports = {
  PORT: process.env.PORT || 3000,
  AMI_PORT: process.env.AMI_PORT || 5038,
  AMI_HOST: process.env.AMI_HOST || "164.92.151.217",
  AMI_USER: process.env.AMI_USER || "admin",
  AMI_PASS: process.env.AMI_PASS || "e65d4e978457156ba830710be6d9ff0d",
};
