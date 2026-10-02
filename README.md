# Marketplace Order System

This repository contains a full-stack monorepo for a unified marketplace ordering system. It ingests incoming webhooks from external food delivery providers (Uber Eats, DoorDash), normalizes them into a unified domain model, and presents them in an admin dashboard for restaurant staff to manage.

## Run Instructions

### Prerequisites
- Node.js v22+
- npm v10+
- A MySQL database (You can provide the connection string in the `.env` file)

### How to start the API and admin

1. Clone the repository and install the dependencies:
```bash
npm install
```

2. Configure your environment variables. Copy `.env.example` to `.env` and insert your MySQL database URL.

3. Boot the backend API (port 3001), the Mock Uber Server (port 3002), and the React Admin UI (port 5173) simultaneously:
```bash
npm run dev
```

You can view the dashboard by opening `http://localhost:5173` in your browser.

## Architecture & Workflow

Below is the high-level data flow for how incoming webhooks are processed:

```mermaid
flowchart TD
    %% Entities
    Uber([Uber Server])
    DD([DoorDash Server])
    Mock([Local Mock Server\n:3002])
    
    subgap
    API[Marketplace API\n:3001]
    DB[(MySQL DB)]
    UI[React Admin UI\n:5173]
    end

    %% Webhook Flows
    Uber -- 1. Webhook Notification --> API
    DD -- Webhook OrderCreate --> API
    Mock -. Simulated Webhooks .-> API
    
    API -- 2. Get Order Details --> Uber
    
    %% Processing
    API -- Normalize & Upsert --> DB
    UI -- SWR Polling / Mutations --> API
```

## cURL Examples

You can test the system either by using our **Mock Server** (easiest for local testing) or by manually simulating the **Marketplace API** webhooks directly.

### Option A: Using the Local Mock Server (Port 3002)
The Mock Server automatically generates the required authentication headers (like HMAC signatures) and fires webhooks at the Marketplace API for you.

```bash
# Trigger a random simulated Uber webhook
curl -s -X POST http://localhost:3002/simulator/trigger/uber

# Trigger a random simulated DoorDash webhook
curl -s -X POST http://localhost:3002/simulator/trigger/doordash
```

### Option B: Manual Webhooks to the Marketplace API (Port 3001)
If you want to manually test the ingestor exactly how a real external provider would hit it, use these commands. Note that the authentication headers must match your `.env` configuration.

**1. Uber Eats Webhook:**
Uber requires an `X-Uber-Signature` header (HMAC SHA256 of the raw body using the client secret).
```bash
# Generate the HMAC signature using openssl
export SIGNATURE=$(cat fixtures/uber/webhook-orders-notification.json | openssl dgst -sha256 -hmac "mock-client-secret" | awk '{print $2}')

curl -i -X POST http://localhost:3001/webhooks/orders \
  -H "Content-Type: application/json" \
  -H "X-Uber-Signature: $SIGNATURE" \
  -d @fixtures/uber/webhook-orders-notification.json
```

**2. DoorDash Webhook:**
DoorDash requires a static Bearer token configured in the dashboard.
```bash
curl -i -X POST http://localhost:3001/webhooks/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-dd-token" \
  -d @fixtures/doordash/webhook-order-create.json
```

## Mapping Table

| Internal Field | Uber Eats | DoorDash |
|---|---|---|
| `id` | Generated UUID | Generated UUID |
| `provider` | `'uber'` | `'doordash'` |
| `external_order_id` | `meta.resource_id` | `id` (Webhook `order` obj) |
| `status` | `Get Order -> current_state` | `event.status` (Webhook) |
| `customer.name` | `eater.first_name` + `eater.last_name` | `consumer.first_name` + `consumer.last_name` |
| `customer.phone` | `eater.phone` | `consumer.phone` |
| `line_items[].name` | `cart.items[].title` | `order.categories[].items[].name` |
| `line_items[].quantity` | `cart.items[].quantity` | `order.categories[].items[].quantity` |
| `line_items[].unit_price`| `cart.items[].price.unit_price` | `order.categories[].items[].price` |
| `total_cents` | `payment.charges.total.amount` | `internal normalization: subtotal + tax` |
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
- **DoorDash monetary fields:** The working notes were uncertain about which field should become `total_cents` and if tax was included. *Change:* We fixed DoorDash double-counting by explicitly calculating `total_cents` as the sum of `subtotal` and `tax`.
- **Uber raw payload preservation:** *Change:* We updated Uber raw webhook payload preservation to ensure a complete audit trail by storing both the webhook payload and the Get Order response.

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
