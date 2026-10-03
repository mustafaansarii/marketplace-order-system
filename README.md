# Marketplace Order System

A full-stack application that unifies food delivery orders from multiple platforms (Uber Eats, DoorDash) into a single, cohesive restaurant dashboard. 

The system receives incoming webhooks from external providers, normalizes the varying data structures into a unified format, and allows restaurant staff to track and manage order statuses from a beautiful React interface.

---

## 🛠 Tech Stack
- **Backend:** Node.js, Express 5, TypeScript
- **Database:** MySQL (using `mysql2/promise`)
- **Frontend:** React, Vite, Tailwind CSS, SWR
- **Monorepo:** npm workspaces

---

## 🏗 Architecture Workflow

```mermaid
flowchart TD
    Uber([Uber Server])
    DD([DoorDash Server])
    Mock([Local Mock Server\n:3002])
    
    subgraph Internal System
    API[Marketplace API\n:3001]
    DB[(MySQL DB)]
    UI[React Admin UI\n:5173]
    end

    Uber -- 1. Webhook Notification --> API
    DD -- Webhook OrderCreate --> API
    Mock -. Simulated Webhooks .-> API
    
    API -- 2. Get Order Details --> Uber
    
    API -- Normalize & Upsert --> DB
    UI -- SWR Data Fetching --> API
```

---

## Features
- **Webhook Ingestion:** Securely receives and verifies webhooks using platform-specific authentication (e.g., Uber's HMAC SHA-256 signatures and DoorDash's Bearer tokens).
- **Data Normalization:** Converts totally different Uber and DoorDash JSON payloads into a single `Order` schema.
- **Idempotent Storage:** Uses atomic MySQL `INSERT ... ON DUPLICATE KEY UPDATE` to safely prevent duplicate orders.
- **State Machine:** Enforces a strict, forward-only order progression (`New` ➔ `Accepted` ➔ `Preparing` ➔ `Ready` ➔ `Completed`).
- **Admin Dashboard:** A fast, responsive React UI to view orders, filter by status or platform, and paginate through historical data.

---

## How to Run Locally

### 1. Prerequisites
- Node.js (v22+)
- A MySQL Database (Local or Cloud like Aiven)

### 2. Setup
Clone the repository and install the dependencies:
```bash
npm install
```

Ensure your `.env` file is properly configured at the root of the project. It must contain your MySQL database URL.

### 3. Database Initialization
Reset the database and populate it with exactly 2 orders (from official fixtures):
```bash
npm run db:reset
```

### 4. Start the Application
You can boot the entire system (Backend API, React UI, and the Mock Simulator) with a single command:
```bash
npm run dev
```

- **Admin Dashboard:** Open `http://localhost:5173` in your browser.
- **Marketplace API:** Running on `http://localhost:3001`.
- **Mock Simulator:** Running on `http://localhost:3002`.

---

## Testing the Webhooks

Because testing real Uber and DoorDash webhooks locally is difficult, this project includes a built-in **Mock Server**. 

### Option A: Using the Local Mock Server (Port 3002)
While the application is running, open a new terminal and run these commands to simulate receiving live food orders:

**Simulate an Uber Eats Order:**
```bash
curl -s -X POST http://localhost:3002/simulator/trigger/uber
```

**Simulate a DoorDash Order:**
```bash
curl -s -X POST http://localhost:3002/simulator/trigger/doordash
```

As soon as you run these commands, the simulated orders will securely flow through the backend API and appear on your React Admin Dashboard (the UI auto-refreshes every 5 seconds).

### Option B: Manual Webhooks to the API (Port 3001)
If you want to manually test exactly how a real external provider would hit the ingestor, use these commands. *(Ensure your `.env` client secrets and tokens match!)*

**1. Uber Eats Webhook:**
Requires an HMAC SHA-256 signature header.
```bash
# Generate the signature using openssl
export SIGNATURE=$(cat fixtures/uber/webhook-orders-notification.json | openssl dgst -sha256 -hmac "mock-client-secret" | awk '{print $2}')

curl -i -X POST http://localhost:3001/webhooks/orders \
  -H "Content-Type: application/json" \
  -H "X-Uber-Signature: $SIGNATURE" \
  -d @fixtures/uber/webhook-orders-notification.json
```

**2. DoorDash Webhook:**
Requires a Bearer token.
```bash
curl -i -X POST http://localhost:3001/webhooks/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-dd-token" \
  -d @fixtures/doordash/webhook-order-create.json
```

---

## Mapping Table

| Internal Field | Uber Eats | DoorDash | Notes |
|---|---|---|---|
| `id` | Generated UUID | Generated UUID | Primary key |
| `provider` | `'uber'` | `'doordash'` | |
| `external_order_id` | `meta.resource_id` | `order.id` | External identifier |
| `status` | `Get Order -> current_state` | `event.status` | Normalized to internal enum |
| `customer.name` | `eater.first_name` + `eater.last_name` | `consumer.first_name` + `consumer.last_name` | |
| `customer.phone` | `eater.phone` | `consumer.phone` | |
| `line_items[].name` | `cart.items[].title` | `order.categories[].items[].name` | |
| `line_items[].quantity` | `cart.items[].quantity` | `order.categories[].items[].quantity` | |
| `line_items[].unit_price_cents`| `cart.items[].price.unit_price.amount` | `order.categories[].items[].price` | Uber price is nested |
| `line_items[].line_total_cents`| `cart.items[].price.total_price.amount` | `quantity * price` | DoorDash price is base |
| `total_cents` | `sub_total.amount` + `tax.amount` | `subtotal + tax` | Aligned to mean food value |
| `currency` | `payment.charges.total.currency_code` | Default to `USD` | |
| `created_at` | `placed_at` | Webhook timestamp | |
| `raw_payload` | Webhook + Get Order | Webhook Payload | Saved for auditing |

---

## Conflicts Log (Working Notes vs. Official Docs)

| Note | Verdict | Evidence | Implementation |
|---|---|---|---|
| Uber may include full cart in webhook | Overruled | Uber Webhooks docs | Implemented async `Get Order` fetch using `resource_id`. |
| DoorDash line items use top-level `items[]` | Overruled | DoorDash Order Integration docs | Parsed deeply from `order.categories[].items[]`. |
| DoorDash monetary field for `total_cents` | Changed | N/A | Explicitly calculated as `subtotal + tax` for both providers to mean "food value". |
| Uber signature generation | Verified | Uber Webhooks docs | Signature is HMAC SHA256 of raw body, checked in `UberAdapter`. |
| Exact Uber webhook response status | Verified | Uber Webhooks docs | Returning `200 OK` empty body immediately, parsing in background. |
| DoorDash Drive webhooks are optional | Verified | DoorDash docs | Ignored Drive webhooks (only `OrderCreate` handled). |
| Uber webhook `resource_id` == Get Order `id` | Verified / Changed | Uber Official Examples | The examples use different UUIDs, but conceptually they represent the same ID. Documented in Mapping Table. |
| Provider query parameter | Verified | Assignment Brief | Provider detection is entirely payload-based via `matches()` in adapters. |
| DoorDash customer phone data | Verified | DoorDash docs | Pulled from `consumer.phone`. |
| Normalize statuses | Verified | Assignment Brief | Mapped to strict internal state machine (`domain/order-status.ts`). |

---

## Walkthrough & Design Decisions

### Architecture
The API strictly adheres to a layered architecture: **Controller ➔ Service ➔ Domain ➔ Repository**. This ensures business logic (such as order state transitions) is isolated from HTTP routes and data access logic, making it easily testable.

### Pure Adapters
Provider adapters (`UberAdapter`, `DoorDashAdapter`) are pure classes responsible for detecting, authenticating, and mapping payloads into an `OrderDraft`. They do not have access to the repository. The `IngestService` orchestrates saving these drafts to the database.

### State Machine
Orders follow a strict, forward-only progression defined in `domain/order-status.ts`. The UI is driven by the backend (`can_advance` and `next_status` flags), preventing scattered frontend logic.

### Fault Tolerance
Because Uber requires fetching the cart *after* acknowledging the webhook, this process runs in the background. We implemented an in-process retry mechanism with exponential backoff. In a production environment, this would be replaced with a reliable message queue (e.g., Kafka) and an outbox pattern.

---

## Known Trade-offs

- **In-process Background Tasks:** Uber cart fetching runs in-process. If the server crashes after acknowledging the webhook but before saving the order, data is lost. A persistent queue is needed for production.
- **DoorDash Menu Options:** DoorDash includes modifier options recursively. For this MVP, we ignore deep options and rely on the base item price (as seen in the official sample where total `subtotal` includes options but item `price` may be 0).
- **Mock Server Integration:** The mock server runs on a separate port but reads from the same configuration file to ensure signature matching works locally.

---

## Project Structure

- **`apps/api/`**: The Node.js Express backend. Handles incoming webhooks, validates signatures, normalizes data, and saves to MySQL.
- **`apps/admin/`**: The React frontend dashboard for restaurant staff to manage and progress orders. 
- **`fixtures/`**: Sample JSON payloads from official provider documentation used for testing.
