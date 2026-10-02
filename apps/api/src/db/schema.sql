CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  external_order_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NULL,
  line_items JSON NOT NULL,
  total_cents INT NOT NULL,
  currency VARCHAR(10) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  raw_payload JSON NOT NULL,
  UNIQUE KEY provider_ext_id (provider, external_order_id),
  INDEX idx_created_at_id (created_at, id),
  INDEX idx_status_created_at_id (status, created_at, id),
  INDEX idx_provider_created_at_id (provider, created_at, id)
);