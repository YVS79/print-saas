-- RLS tenant scaffolding based on app.shop_id setting.
-- app.shop_id is expected to be set via SET LOCAL in transaction scope.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_tenant_policy ON users;
CREATE POLICY users_tenant_policy
ON users
USING (shop_id = current_setting('app.shop_id', true)::uuid)
WITH CHECK (shop_id = current_setting('app.shop_id', true)::uuid);

DROP POLICY IF EXISTS templates_tenant_policy ON templates;
CREATE POLICY templates_tenant_policy
ON templates
USING (shop_id = current_setting('app.shop_id', true)::uuid)
WITH CHECK (shop_id = current_setting('app.shop_id', true)::uuid);

DROP POLICY IF EXISTS assets_tenant_policy ON assets;
CREATE POLICY assets_tenant_policy
ON assets
USING (shop_id = current_setting('app.shop_id', true)::uuid)
WITH CHECK (shop_id = current_setting('app.shop_id', true)::uuid);

DROP POLICY IF EXISTS canvas_designs_tenant_policy ON canvas_designs;
CREATE POLICY canvas_designs_tenant_policy
ON canvas_designs
USING (shop_id = current_setting('app.shop_id', true)::uuid)
WITH CHECK (shop_id = current_setting('app.shop_id', true)::uuid);

DROP POLICY IF EXISTS orders_tenant_policy ON orders;
CREATE POLICY orders_tenant_policy
ON orders
USING (shop_id = current_setting('app.shop_id', true)::uuid)
WITH CHECK (shop_id = current_setting('app.shop_id', true)::uuid);

DROP POLICY IF EXISTS print_jobs_tenant_policy ON print_jobs;
CREATE POLICY print_jobs_tenant_policy
ON print_jobs
USING (shop_id = current_setting('app.shop_id', true)::uuid)
WITH CHECK (shop_id = current_setting('app.shop_id', true)::uuid);
