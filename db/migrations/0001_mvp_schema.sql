CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  domain TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, email)
);

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('A4', 'A3')),
  width_mm NUMERIC(10, 3) NOT NULL,
  height_mm NUMERIC(10, 3) NOT NULL,
  bleed_mm NUMERIC(10, 3) NOT NULL DEFAULT 0,
  base_design_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  bucket TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  width_px INT,
  height_px INT,
  size_bytes BIGINT NOT NULL,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE canvas_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  design_id UUID NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('A4', 'A3')),
  width_mm NUMERIC(10, 3) NOT NULL,
  height_mm NUMERIC(10, 3) NOT NULL,
  dpi INT NOT NULL CHECK (dpi = 300),
  bleed_mm NUMERIC(10, 3) NOT NULL DEFAULT 0,
  objects_jsonb JSONB NOT NULL,
  version INT NOT NULL CHECK (version > 0),
  schema_version INT NOT NULL CHECK (schema_version > 0),
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, design_id, version)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  design_id UUID NOT NULL,
  design_version INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL CHECK (status IN ('created', 'queued', 'printed', 'cancelled')),
  customer_name TEXT,
  customer_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (shop_id, design_id, design_version)
    REFERENCES canvas_designs(shop_id, design_id, version)
    ON DELETE RESTRICT
);

CREATE TABLE print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  design_id UUID NOT NULL,
  design_version INT NOT NULL,
  printer_format TEXT NOT NULL CHECK (printer_format IN ('A4', 'A3')),
  dpi INT NOT NULL CHECK (dpi = 300),
  bleed_mm NUMERIC(10, 3) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('queued', 'rendering', 'ready', 'failed')),
  pdf_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (shop_id, design_id, design_version)
    REFERENCES canvas_designs(shop_id, design_id, version)
    ON DELETE RESTRICT
);

CREATE INDEX idx_users_shop_id ON users (shop_id);
CREATE INDEX idx_templates_shop_id ON templates (shop_id);
CREATE INDEX idx_assets_shop_id_created_at ON assets (shop_id, created_at DESC);
CREATE INDEX idx_canvas_designs_shop_design_version ON canvas_designs (shop_id, design_id, version DESC);
CREATE INDEX idx_orders_shop_created_at ON orders (shop_id, created_at DESC);
CREATE INDEX idx_print_jobs_shop_status_created_at ON print_jobs (shop_id, status, created_at DESC);
