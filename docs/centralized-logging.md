# Centralized Logging System

**Branch:** `feature/centralized-logging`
**Date:** February 2026
**Status:** Ready for Review

---

## Overview

This feature introduces a centralized logging utility that replaces scattered `console.log` statements throughout the server codebase. The new logging system provides:

- **Log Levels** - Control verbosity with error, warn, info, and debug levels
- **Structured Output** - Consistent format with timestamps, levels, and context
- **Environment-Based Defaults** - Different defaults for development vs production
- **Context Labels** - Each module identifies itself in log output

---

## Problem Statement

Previously, the codebase used raw `console.log` statements which caused several issues:

| Issue | Impact |
|-------|--------|
| No log levels | Unable to filter verbose debug output in production |
| Inconsistent format | Difficult to parse logs or search for specific events |
| No timestamps | Hard to correlate events with external systems |
| No context | Unclear which module produced each log message |

---

## Configuration

### Environment Variable

| Variable | Values | Default |
|----------|--------|---------|
| `LOG_LEVEL` | `error`, `warn`, `info`, `debug` | `debug` (dev) / `info` (prod) |

### Log Level Hierarchy

```
error (0) ← Most restrictive, only errors
warn  (1) ← Errors + warnings
info  (2) ← Errors + warnings + info messages
debug (3) ← All messages including verbose debug output
```

Setting `LOG_LEVEL=warn` will show only `error` and `warn` messages.

---

## Log Output Format

```
[TIMESTAMP] [LEVEL] [CONTEXT] MESSAGE [DATA]
```

### Examples

```
[2026-02-04T13:29:38.784Z] [INFO ] [Server] Dashboard running at http://localhost:3000
[2026-02-04T13:29:38.847Z] [INFO ] [AMI] Connected to Asterisk AMI
[2026-02-04T13:29:38.848Z] [DEBUG] [AMI] Fetching initial SIP peers...
[2026-02-04T13:29:38.908Z] [DEBUG] [AMI] Event FullyBooted {
  "event": "FullyBooted",
  "privilege": "system,all",
  "uptime": "46746",
  "status": "Fully Booted"
}
[2026-02-04T14:15:22.123Z] [WARN ] [AMI-Handlers] [DialBegin] No active call found for uniqueid: 1234567890.123
[2026-02-04T14:15:25.456Z] [ERROR] [Routes] Express error: TypeError: Cannot read property 'id' of undefined
```

---

## Files Changed

### New Files

| File | Description |
|------|-------------|
| `server/utils/logger.js` | Centralized logging utility with `createLogger()` factory function |

### Modified Files

| File | Changes |
|------|---------|
| `server/config/index.js` | Added `LOG_LEVEL` configuration option |
| `server/server.js` | Replaced console statements with logger (context: `Server`) |
| `server/ami/index.js` | Replaced console statements with logger (context: `AMI`) |
| `server/ami/handlers.js` | Replaced ~20 console statements with logger (context: `AMI-Handlers`) |
| `server/ami/parsers.js` | Replaced console statement with logger (context: `AMI-Parsers`) |
| `server/socket/index.js` | Replaced console statements with logger (context: `Socket`) |
| `server/routes/index.js` | Replaced console statement with logger (context: `Routes`) |

---

## Usage Guide

### Creating a Logger Instance

```javascript
const { createLogger } = require("../utils/logger");
const log = createLogger("MyModule");
```

### Logging Methods

```javascript
// Debug - verbose development information
log.debug("Processing request", { requestId: 123 });

// Info - general operational information
log.info("Server started on port 3000");

// Warn - potentially problematic situations
log.warn("Connection retry attempt", 3);

// Error - error conditions
log.error("Failed to connect", err);
```

### With Data Objects

The logger automatically formats objects as JSON:

```javascript
log.debug("Received event", { type: "call", id: "12345" });
// Output: [2026-02-04T13:29:38.908Z] [DEBUG] [MyModule] Received event {
//   "type": "call",
//   "id": "12345"
// }
```

### Error Handling

For errors, pass the Error object as the second parameter:

```javascript
try {
  // ...
} catch (err) {
  log.error("Operation failed", err);
  // In debug mode, also prints stack trace
}
```

---

## Context Labels by Module

| Context | Module | Description |
|---------|--------|-------------|
| `Server` | server.js | Main entry point, startup, shutdown |
| `AMI` | ami/index.js | AMI connection management |
| `AMI-Handlers` | ami/handlers.js | AMI event handlers |
| `AMI-Parsers` | ami/parsers.js | CLI output parsing |
| `Socket` | socket/index.js | WebSocket connections |
| `Routes` | routes/index.js | HTTP route handling |

---

## Production Recommendations

### Recommended Settings

```bash
# Production
NODE_ENV=production
LOG_LEVEL=info

# Staging/QA
NODE_ENV=production
LOG_LEVEL=debug

# Development
NODE_ENV=development
# LOG_LEVEL defaults to debug
```

### Log Aggregation

The structured format is compatible with log aggregation tools:
- **Elasticsearch/Kibana** - Parse with grok pattern
- **Splunk** - Extract fields from bracketed format
- **CloudWatch** - Filter by level or context

Example grok pattern:
```
\[%{TIMESTAMP_ISO8601:timestamp}\] \[%{WORD:level}\s*\] \[%{DATA:context}\] %{GREEDYDATA:message}
```

---

## Backward Compatibility

- The `config/index.js` startup errors still use `console.error` since they run before the logger module loads
- No breaking changes to existing functionality
- Existing log messages are preserved, just reformatted

---

## Testing

Verified the following scenarios:

1. ✅ Server starts with formatted log output
2. ✅ AMI connection events are logged with context
3. ✅ Debug events show full JSON when LOG_LEVEL=debug
4. ✅ Production mode (NODE_ENV=production) defaults to info level
5. ✅ Error objects include stack traces in debug mode

---

## Related Changes

This feature builds upon the previous hotfix:
- `hotfix/filter-sensitive-debug-events` - Added event sanitization for security

Together, these changes ensure:
1. Sensitive data is redacted before logging
2. Logs are structured and filterable by level
3. Production environments have appropriate verbosity defaults
