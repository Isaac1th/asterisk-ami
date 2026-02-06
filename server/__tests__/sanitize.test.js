const { sanitizeEvent, redactPhoneNumber } = require("../utils/sanitize");

describe("sanitize utility", () => {
  describe("redactPhoneNumber", () => {
    it("should redact phone numbers showing only last 4 digits", () => {
      expect(redactPhoneNumber("1234567890")).toBe("***7890");
      expect(redactPhoneNumber("+15551234567")).toBe("***4567");
    });

    it("should return short numbers unchanged", () => {
      expect(redactPhoneNumber("1234")).toBe("1234");
      expect(redactPhoneNumber("123")).toBe("123");
    });

    it("should handle null and undefined", () => {
      expect(redactPhoneNumber(null)).toBe(null);
      expect(redactPhoneNumber(undefined)).toBe(undefined);
    });

    it("should handle non-string values", () => {
      expect(redactPhoneNumber(12345)).toBe(12345);
      expect(redactPhoneNumber({})).toEqual({});
    });
  });

  describe("sanitizeEvent", () => {
    it("should completely redact sensitive fields", () => {
      const event = {
        event: "TestEvent",
        secret: "mysecretpassword",
        password: "mypassword",
        token: "abc123token",
        apikey: "api-key-value",
      };

      const sanitized = sanitizeEvent(event);

      expect(sanitized.event).toBe("TestEvent");
      expect(sanitized.secret).toBe("[REDACTED]");
      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.token).toBe("[REDACTED]");
      expect(sanitized.apikey).toBe("[REDACTED]");
    });

    it("should partially redact PII fields", () => {
      const event = {
        event: "NewChannel",
        calleridnum: "5551234567",
        connectedlinenum: "5559876543",
        channel: "PJSIP/1001-00000001",
      };

      const sanitized = sanitizeEvent(event);

      expect(sanitized.event).toBe("NewChannel");
      expect(sanitized.calleridnum).toBe("***4567");
      expect(sanitized.connectedlinenum).toBe("***6543");
      expect(sanitized.channel).toBe("PJSIP/1001-00000001");
    });

    it("should handle case-insensitive field matching", () => {
      const event = {
        SECRET: "secret1",
        Password: "pass1",
        CallerIDNum: "5551234567",
      };

      const sanitized = sanitizeEvent(event);

      expect(sanitized.SECRET).toBe("[REDACTED]");
      expect(sanitized.Password).toBe("[REDACTED]");
      expect(sanitized.CallerIDNum).toBe("***4567");
    });

    it("should recursively sanitize nested objects", () => {
      const event = {
        event: "TestEvent",
        nested: {
          secret: "nestedsecret",
          calleridnum: "5551234567",
        },
      };

      const sanitized = sanitizeEvent(event);

      expect(sanitized.nested.secret).toBe("[REDACTED]");
      expect(sanitized.nested.calleridnum).toBe("***4567");
    });

    it("should handle null and non-object inputs", () => {
      expect(sanitizeEvent(null)).toBe(null);
      expect(sanitizeEvent(undefined)).toBe(undefined);
      expect(sanitizeEvent("string")).toBe("string");
      expect(sanitizeEvent(123)).toBe(123);
    });

    it("should pass through non-sensitive fields unchanged", () => {
      const event = {
        event: "Hangup",
        channel: "PJSIP/1001-00000001",
        uniqueid: "1234567890.123",
        cause: "16",
        causetxt: "Normal Clearing",
      };

      const sanitized = sanitizeEvent(event);

      expect(sanitized).toEqual(event);
    });
  });
});
