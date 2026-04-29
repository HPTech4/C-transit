# C-Transit Backend Hardware Integration Service

Production-grade Node.js service bridging the ESP32 terminal fleet (via HiveMQ Cloud MQTTS) to a PostgreSQL financial ledger.

---

## Architecture Overview

```
ESP32 Terminals (SIM800L / 2G)
        │
        │  MQTTS Port 8883 (TLS 1.2)
        ▼
HiveMQ Cloud Broker
        │
        │  ctransit/+/tx  (uplink wildcard)
        │  ctransit/+/status (LWT wildcard)
        ▼
Node.js Backend (This Service)
        │
        ├── PostgreSQL  → Immutable ledger (transactions, wallets, terminals)
        └── Redis       → Volatile state (OTP TTLs, offline terminal queues)
```

---

## Prerequisites

| Dependency | Version | Notes |
|---|---|---|
| Node.js | ≥ 18.0.0 | LTS recommended |
| PostgreSQL | ≥ 14 | With `gen_random_uuid()` extension |
| Redis | ≥ 6 | Standalone or managed (Upstash, etc.) |
| HiveMQ Cloud | Free tier OK | Cluster must be provisioned |

---

## Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd ctransit-backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual credentials
nano .env
```

**Critical variables:**

| Variable | Description |
|---|---|
| `HIVEMQ_HOST` | Your cluster URL: `xxxx.s1.eu.hivemq.cloud` |
| `HIVEMQ_CLIENT_ID` | Must be `C_TRANSIT_CORE_SERVER` — unique, not a terminal ID |
| `DATABASE_URL` | Full PostgreSQL connection string with `sslmode=require` |
| `ADMIN_API_SECRET` | Protect your admin endpoints — use a strong random value |
| `BASE_FARE` | Blacklist threshold in Naira (default: 150) |

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (creates all tables)
npm run prisma:migrate

# Optional: Open Prisma Studio to inspect data
npm run prisma:studio
```

Or apply the raw SQL directly:
```bash
psql -U your_user -d ctransit_ledger -f prisma/migrations/001_initial.sql
```

### 4. Provision Terminals

Before terminals connect, register them in the DB via the admin API:

```bash
curl -X POST http://localhost:3000/admin/terminal/register \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your_admin_secret" \
  -d '{"terminalId": "TERM_04", "secretKey": "your_64_char_hmac_key_here"}'
```

### 5. Run

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

---

## API Reference

All admin endpoints require the `x-admin-secret` header.

### Health Check
```
GET /health
```
Returns status of PostgreSQL and Redis.

### Register Terminal
```
POST /admin/terminal/register
Body: { "terminalId": "TERM_04", "secretKey": "..." }
```

### Confirm Card Registration (Mobile App)
```
POST /admin/confirm-registration
Body: { "otp": "849302" }
```
Called after the student enters the OTP into the mobile app.

### Monnify Top-Up Webhook
```
POST /admin/monnify-webhook
Body: { "studentUid": "A1B2C3D4", "amount": 500 }
```
Credits wallet and broadcasts `REM:BL` if balance crosses threshold.

### Poison Pill (Stolen Terminal)
```
POST /admin/poison-pill
Body: { "terminalId": "TERM_04" }
```
Locks terminal in DB and queues `CMD:POISON_PILL` for delivery.

### OTA Update
```
POST /admin/ota
Body: { "firmwareUrl": "https://yourserver.com/firmware_v2.bin" }
```
Broadcasts `CMD:OTA,[URL]` to all terminals. Hardware downloads via SIM800L HTTP.

---

## MQTT Flow

### Uplink (Hardware → Server)
```
Topic:   ctransit/TERM_04/tx
Payload: T04-1708000500-A1B2C3D4,A1B2C3D4,150,1708000500,Z9Y8X7W6
         [more rows separated by \n]
```

### Registration Uplink
```
Topic:   ctransit/TERM_04/tx
Payload: PENDING_LINK:A1B2C3D4,849302,Z9Y8X7W6
```

### Downlink (Server → Hardware)
```
Topic:   ctransit/TERM_04/rx
Payload: ADD:BL,A1B2C3D4    (blacklist student)
         REM:BL,A1B2C3D4    (remove from blacklist)
         ADD:WL,A1B2C3D4    (add to whitelist)
         ADD:DRV,Z9Y8X7W6,1234  (add driver with PIN)
         CMD:POISON_PILL    (wipe and lock terminal)
         CMD:OTA,https://...    (trigger firmware update)
```

### LWT Status
```
Topic:   ctransit/TERM_04/status
Payload: OFFLINE  (broker publishes when terminal drops)
         ONLINE   (terminal publishes on connect)
```

---

## Key Design Decisions

### Manual PUBACK (QoS 1)
The MQTT client is configured with `manualAcking: true`. The broker's PUBACK to the hardware is only released **after** the transaction is safely written to PostgreSQL. If the server crashes mid-write, the hardware retains its data and retransmits on reconnect. Zero data loss.

### Idempotency at DB Level
The `transaction_id` composite key (`T04-1708000500-A1B2C3D4`) is the PRIMARY KEY in PostgreSQL. Prisma's `createMany({ skipDuplicates: true })` maps to `ON CONFLICT DO NOTHING`. Duplicate batches from 2G retransmissions are silently skipped. Hardware always receives its PUBACK.

### Redis Separation of Concerns
- **PostgreSQL**: Everything permanent — transactions, wallets, terminal registry.
- **Redis**: Everything volatile — OTP codes (5-min TTL), offline downlink queues.
- **Never mix**: No temporary strings in PSQL. No ledger data in Redis.

### No External API Calls in Tap Loop
Monnify is never called during transaction ingestion. All balance math runs as a PostgreSQL UPDATE. External API latency would bottleneck morning rush-hour processing.

---

## Production Deployment Notes

1. **TLS**: HiveMQ Cloud uses publicly trusted CA. No custom certificates needed.
2. **Process Manager**: Use PM2 or systemd. The server has graceful shutdown handlers for SIGTERM.
3. **Logging**: Pino outputs structured JSON. Pipe to your log aggregator (Datadog, CloudWatch, etc.).
4. **Redis Persistence**: Enable AOF persistence in Redis to survive restarts with queued downlinks intact.
5. **Database**: Enable SSL on the PostgreSQL connection string (`?sslmode=require`).
6. **Secrets**: Never commit `.env`. Use environment injection (Docker secrets, AWS SSM, etc.).
