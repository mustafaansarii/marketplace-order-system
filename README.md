# Marketplace Order System

This repository contains a full-stack monorepo for a unified marketplace ordering system. It ingests incoming webhooks from external food delivery providers (Uber Eats, DoorDash), normalizes them into a unified domain model, and presents them in a real-time admin dashboard for restaurant staff to manage.

## Run Instructions

### Prerequisites
- Node.js v22+
- npm v10+
- A MySQL database

### How to start the API and admin

1. Clone the repository and install the dependencies:
```bash
npm install
```

2. Ensure your `.env` file is properly configured with your MySQL `DATABASE_URL` and provider secrets.

3. Boot the backend API (port 3001), the Mock Uber Server (port 3002), and the React Admin UI (port 5173) simultaneously:
```bash
npm run dev
```

You can view the dashboard by opening `http://localhost:5173` in your browser.

## cURL Examples

You can simulate incoming webhooks by using the following `curl` commands. Note that the authentication headers must match your `.env` configuration.

**1. Uber Eats Webhook:**
Uber requires an `X-Uber-Signature` header (HMAC SHA256 of the raw body using the client secret). For local testing, our webhook ingestor handles the payload.
```bash
curl -i -X POST http://localhost:3001/webhooks/orders \
  -H "Content-Type: application/json" \
  -H "X-Uber-Signature: <GENERATED_HMAC_SHA256_SIGNATURE>" \
  -d '{"event_id": "812b1a1c-99c5-430b-b18c-3642398687ba", "meta": {"resource_id": "test-uber-resource", "status": "pos.create"}}'
```

**2. DoorDash Webhook:**
DoorDash requires a static Bearer token configured in the dashboard.
```bash
curl -i -X POST http://localhost:3001/webhooks/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_doordash_token" \
  -d '{"event": {"status": "New"}, "order": {"id": "test-dd-order", "estimated_total": 1500, "currency": "USD"}}'
```

## Mapping Table

| Internal Field | Uber Eats | DoorDash |
|---|---|---|
| `id` | Generated UUID | Generated UUID |
| `provider` | `'uber'` | `'doordash'` |
| `external_order_id` | `meta.resource_id` | `id` (Webhook `order` obj) |
| `status` | `meta.status` (Webhook) | `event.status` (Webhook) |
| `customer.name` | `eater.first_name` + `eater.last_name` | `consumer.first_name` + `consumer.last_name` |
| `customer.phone` | `eater.phone` | `consumer.phone` |
| `line_items[].name` | `cart.items[].title` | `order.categories[].items[].name` |
| `line_items[].quantity` | `cart.items[].quantity` | `order.categories[].items[].quantity` |
| `line_items[].unit_price`| `cart.items[].price.unit_price` | `order.categories[].items[].price` |
| `total_cents` | `payment.charges.total.amount` | `order.estimated_total` (or `subtotal` + `tax`) |
| `currency` | `payment.charges.total.currency_code` | Default to `USD` |
| `created_at` | `event_time` (Webhook payload) | `event.time` (Webhook payload) |
| `raw_payload` | Full Get Order Response + Webhook | Full Webhook Payload |

## Conflicts Log (Verify, Don't Trust)

Reviewing the working notes provided in the brief against the official documentation:

### Verified as correct
- **Uber Webhook Signature:** The working note that `X-Uber-Signature` is an HMAC SHA256 signature of the raw request body was verified as correct.
- **Uber Webhook Response:** Uber does indeed expect a fast 200/204 response. We implemented asynchronous processing to return immediately.
- **DoorDash Customer Phone:** Customer phone numbers are found in `order.consumer.phone` as noted.

### Rejected / Changed
- **DoorDash monetary fields:** The working notes were uncertain about which field should become `total_cents` and if tax was included. *Change:* We explicitly map `order.estimated_total`. If it is completely missing, we fallback to summing `subtotal` and `tax`.

### Overruled by official documentation
- **Uber cart in webhook:** The working notes suggested Uber might include the full cart in the webhook payload. *Overruled:* The official Uber documentation confirms the webhook only contains event IDs and resource IDs. A secondary `Get Order` API call using the `resource_id` is strictly required to get the actual cart.
- **DoorDash Marketplace items array:** The working notes mentioned line items might use a top-level `items[]` array. *Overruled:* According to the official DoorDash payload schemas, items are deeply nested inside `order.categories[].items[]`.

## Architecture

The project is structured as an npm workspaces monorepo:

- **`packages/shared`**: The source of truth for the domain model.
- **`apps/api`**: A Node.js backend using Express 5 and `mysql2/promise`. It exposes an idempotent webhook ingest route utilizing a Strategy pattern (`ProviderAdapter`) to handle varying HMAC signatures and payload parsing. The data is safely persisted with a forward-only state machine.
- **`apps/admin`**: A React single-page application built with Vite and Tailwind CSS. It connects to the API via SWR to fetch and optimistically update order statuses with cursor-based pagination.

## Testing

The system employs `vitest` for fast, pure-function unit testing.
```bash
npm test
```
