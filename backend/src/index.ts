import "reflect-metadata";
import express from "express";
import cors from "cors";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "crm",
  password: process.env.DB_PASSWORD || "crm_secret_2024",
  database: process.env.DB_NAME || "crm",
});

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// ─── Helper: async route wrapper ─────────────────────────────
const asyncHandler = (fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// ─── Helper: query wrapper ───────────────────────────────────
async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function withTransaction<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function ensureDeviceSshCredentialColumns() {
  await query(`
    ALTER TABLE devices
    ADD COLUMN IF NOT EXISTS ssh_user VARCHAR(255),
    ADD COLUMN IF NOT EXISTS ssh_password VARCHAR(255)
  `);
}

// ─── Helper: build audit log ─────────────────────────────────
async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  entityName: string,
  details: any[] = [],
  source = "form"
) {
  await query(
    `INSERT INTO audit_logs (action, entity_type, entity_id, entity_name, details, source)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
    [action, entityType, entityId, entityName, JSON.stringify(details), source]
  );
}

function computeChanges(oldData: any, newData: any, fields: string[]): any[] {
  const changes: any[] = [];
  for (const f of fields) {
    const oldVal = oldData[f] ?? "";
    const newVal = newData[f] ?? "";
    if (String(oldVal) !== String(newVal)) {
      changes.push({ field: f, oldValue: String(oldVal), newValue: String(newVal) });
    }
  }
  return changes;
}

// ═══════════════════════════════════════════════════════════════
// ENUM VALUES
// ═══════════════════════════════════════════════════════════════
app.get("/api/enums", asyncHandler(async (_req, res) => {
  const { rows } = await query("SELECT * FROM enum_values ORDER BY category, label");
  res.json(rows);
}));

app.get("/api/enums/:category", asyncHandler(async (req, res) => {
  const { rows } = await query(
    "SELECT * FROM enum_values WHERE category = $1 ORDER BY label",
    [req.params.category]
  );
  res.json(rows);
}));

app.post("/api/enums", asyncHandler(async (req, res) => {
  const { category, label, color, ssid } = req.body;
  const { rows } = await query(
    `INSERT INTO enum_values (category, label, color, ssid)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [category, label, color || null, ssid || false]
  );
  await logAudit("create", `enum_${category}`, rows[0].id, label);
  res.status(201).json(rows[0]);
}));

app.put("/api/enums/:id", asyncHandler(async (req, res) => {
  const { label, color, ssid } = req.body;
  const old = (await query("SELECT * FROM enum_values WHERE id = $1", [req.params.id])).rows[0];
  if (!old) return res.status(404).json({ error: "Not found" });
  const { rows } = await query(
    `UPDATE enum_values SET label=$1, color=$2, ssid=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
    [label, color || null, ssid || false, req.params.id]
  );
  const changes = computeChanges(old, rows[0], ["label", "color", "ssid"]);
  if (changes.length) await logAudit("update", `enum_${old.category}`, old.id, label, changes);
  res.json(rows[0]);
}));

app.patch("/api/enums/:id/toggle-delete", asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE enum_values SET is_deleted = NOT is_deleted, updated_at=NOW() WHERE id=$1 RETURNING *`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Not found" });
  await logAudit(rows[0].is_deleted ? "delete" : "create", `enum_${rows[0].category}`, rows[0].id, rows[0].label, [], "system");
  res.json(rows[0]);
}));

// ═══════════════════════════════════════════════════════════════
// GENERIC CRUD FACTORY
// ═══════════════════════════════════════════════════════════════
function crudRoutes(
  entityPath: string,
  tableName: string,
  entityType: string,
  fields: string[],
  nameGetter: (row: any) => string
) {
  // List
  app.get(`/api/${entityPath}`, asyncHandler(async (_req, res) => {
    const { rows } = await query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
    res.json(rows);
  }));

  // Get one
  app.get(`/api/${entityPath}/:id`, asyncHandler(async (req, res) => {
    const { rows } = await query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  }));

  // Create
  app.post(`/api/${entityPath}`, asyncHandler(async (req, res) => {
    const cols = fields.filter((f) => req.body[f] !== undefined);
    if (cols.length === 0) return res.status(400).json({ error: "No valid fields provided" });
    const vals = cols.map((f) => req.body[f]);
    const placeholders = cols.map((_, i) => `$${i + 1}`);
    const { rows } = await query(
      `INSERT INTO ${tableName} (${cols.join(",")}) VALUES (${placeholders.join(",")}) RETURNING *`,
      vals
    );
    await logAudit("create", entityType, rows[0].id, nameGetter(rows[0]));
    res.status(201).json(rows[0]);
  }));

  // Update
  app.put(`/api/${entityPath}/:id`, asyncHandler(async (req, res) => {
    const old = (await query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id])).rows[0];
    if (!old) return res.status(404).json({ error: "Not found" });
    const cols = fields.filter((f) => req.body[f] !== undefined);
    if (cols.length === 0) return res.status(400).json({ error: "No valid fields provided" });
    const sets = cols.map((f, i) => `${f}=$${i + 1}`);
    sets.push(`updated_at=NOW()`);
    const vals = cols.map((f) => req.body[f]);
    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE ${tableName} SET ${sets.join(",")} WHERE id=$${vals.length} RETURNING *`,
      vals
    );
    const changes = computeChanges(old, rows[0], fields);
    if (changes.length) await logAudit("update", entityType, old.id, nameGetter(rows[0]), changes);
    res.json(rows[0]);
  }));

  // Toggle delete
  app.patch(`/api/${entityPath}/:id/toggle-delete`, asyncHandler(async (req, res) => {
    const { rows } = await query(
      `UPDATE ${tableName} SET is_deleted = NOT is_deleted, updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    await logAudit(rows[0].is_deleted ? "delete" : "create", entityType, rows[0].id, nameGetter(rows[0]), [], "system");
    res.json(rows[0]);
  }));

  // Hard delete
  app.delete(`/api/${entityPath}/:id`, asyncHandler(async (req, res) => {
    const old = (await query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id])).rows[0];
    if (!old) return res.status(404).json({ error: "Not found" });
    await query(`DELETE FROM ${tableName} WHERE id = $1`, [req.params.id]);
    await logAudit("delete", entityType, old.id, nameGetter(old));
    res.json({ success: true });
  }));
}

// ═══════════════════════════════════════════════════════════════
// REGISTER CRUD ROUTES
// ═══════════════════════════════════════════════════════════════

crudRoutes("addresses", "addresses", "address",
  ["street", "descriptive_number", "reference_number", "city", "zip_code", "state", "gps_lat", "gps_lon"],
  (r) => `${r.street || ""} ${r.descriptive_number || ""}, ${r.city || ""}`
);

crudRoutes("sites", "sites", "site",
  ["name", "address_id", "description"],
  (r) => r.name
);

crudRoutes("racks", "racks", "rack",
  ["name", "site_id", "u_height", "description"],
  (r) => r.name
);

crudRoutes("customers", "customers", "customer",
  ["customer_number", "first_name", "last_name", "company_name", "ico", "dic", "ic_dph",
   "personal_id", "id_card_number", "date_of_birth", "address_id", "correspondence_address_id", "email", "phone", "mobile", "legal_form_id"],
  (r) => r.company_name || `${r.first_name || ""} ${r.last_name || ""}`.trim()
);

crudRoutes("user-groups", "user_groups", "userGroup",
  ["name", "description"],
  (r) => r.name
);

crudRoutes("users", "users", "user",
  ["name", "surname", "email", "group_id"],
  (r) => `${r.name || ""} ${r.surname || ""}`.trim()
);

crudRoutes("devices", "devices", "device",
  ["name", "vendor_id", "device_group_id", "address_id", "gps_lat", "gps_lon",
   "parent_device_id", "ip_address", "device_type_id", "ssid",
   "ssh_enabled", "ssh_port", "ssh_user", "ssh_password", "http_enabled", "http_port",
   "https_enabled", "https_port", "api_enabled", "api_port", "api_user", "api_password",
   "rack_id", "rack_position", "rack_height"],
  (r) => r.name
);

crudRoutes("plans", "plans", "plan",
  ["category_id", "reporting_method_id", "priority_id", "description",
   "customer_id", "device_id", "scheduled_from", "scheduled_to"],
  (r) => r.description?.substring(0, 50) || "Plan"
);

crudRoutes("device-templates", "device_templates", "deviceTemplate",
  ["name", "vendor_id", "front_image", "back_image"],
  (r) => r.name
);

crudRoutes("vlan-domains", "vlan_domains", "vlanDomain",
  ["name", "parent_domain_id", "description"],
  (r) => r.name
);

crudRoutes("vlans", "vlans", "vlan",
  ["vlan_id", "name", "domain_id", "role_id", "site_id"],
  (r) => r.name || `VLAN ${r.vlan_id}`
);

crudRoutes("prefixes", "prefixes", "prefix",
  ["prefix", "name", "status", "role_id", "site_id", "is_pool", "description"],
  (r) => r.prefix
);

crudRoutes("l2-vpns", "l2_vpns", "l2vpn",
  ["name", "vc_id", "customer_id", "description", "encapsulation_id", "mode_id", "signalization_id"],
  (r) => r.name
);

crudRoutes("l3-vpns", "l3_vpns", "l3vpn",
  ["name", "route_distinguisher", "import_target", "export_target", "customer_id", "description"],
  (r) => r.name
);

// ═══════════════════════════════════════════════════════════════
// TAG JUNCTION ROUTES
// ═══════════════════════════════════════════════════════════════
function tagRoutes(entityPath: string, tableName: string, fkColumn: string) {
  app.get(`/api/${entityPath}/:id/tags`, asyncHandler(async (req, res) => {
    const { rows } = await query(`SELECT tag_id FROM ${tableName} WHERE ${fkColumn} = $1`, [req.params.id]);
    res.json(rows.map((r: any) => r.tag_id));
  }));

  app.put(`/api/${entityPath}/:id/tags`, asyncHandler(async (req, res) => {
    const tagIds: string[] = req.body.tagIds || [];
    await withTransaction(async (client) => {
      await client.query(`DELETE FROM ${tableName} WHERE ${fkColumn} = $1`, [req.params.id]);
      for (const tagId of tagIds) {
        await client.query(`INSERT INTO ${tableName} (${fkColumn}, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [req.params.id, tagId]);
      }
    });
    res.json({ success: true, tagIds });
  }));
}

tagRoutes("prefixes", "prefix_tags", "prefix_id");
tagRoutes("vlans", "vlan_tags", "vlan_id");
tagRoutes("vlan-domains", "vlan_domain_tags", "vlan_domain_id");
tagRoutes("l2-vpns", "l2_vpn_tags", "l2_vpn_id");
tagRoutes("l3-vpns", "l3_vpn_tags", "l3_vpn_id");

// ═══════════════════════════════════════════════════════════════
// COMMENTS
// ═══════════════════════════════════════════════════════════════
app.get("/api/comments", asyncHandler(async (req, res) => {
  const planId = req.query.plan_id;
  let sql = "SELECT * FROM comments";
  const params: any[] = [];
  if (planId) {
    sql += " WHERE plan_id = $1";
    params.push(planId);
  }
  sql += " ORDER BY created_at DESC";
  const { rows } = await query(sql, params);
  res.json(rows);
}));

app.post("/api/comments", asyncHandler(async (req, res) => {
  const { plan_id, user_id, text } = req.body;
  const { rows } = await query(
    `INSERT INTO comments (plan_id, user_id, text) VALUES ($1, $2, $3) RETURNING *`,
    [plan_id, user_id, text]
  );
  res.status(201).json(rows[0]);
}));

app.delete("/api/comments/:id", asyncHandler(async (req, res) => {
  await query("DELETE FROM comments WHERE id = $1", [req.params.id]);
  res.json({ success: true });
}));

// ═══════════════════════════════════════════════════════════════
// AUDIT LOGS
// ═══════════════════════════════════════════════════════════════
app.get("/api/audit-logs", asyncHandler(async (req, res) => {
  const { entity_type, entity_id } = req.query;
  let sql = "SELECT * FROM audit_logs";
  const params: any[] = [];
  const conditions: string[] = [];
  if (entity_type) { conditions.push(`entity_type = $${params.length + 1}`); params.push(entity_type); }
  if (entity_id) { conditions.push(`entity_id = $${params.length + 1}`); params.push(entity_id); }
  if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY timestamp DESC";
  const { rows } = await query(sql, params);
  res.json(rows);
}));

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════
app.get("/api/settings", asyncHandler(async (_req, res) => {
  const { rows } = await query("SELECT * FROM settings");
  const result: Record<string, any> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  res.json(result);
}));

app.put("/api/settings/:key", asyncHandler(async (req, res) => {
  const { value } = req.body;
  await query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
    [req.params.key, JSON.stringify(value)]
  );
  res.json({ success: true });
}));

// ═══════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════
app.get("/api/dashboard/stats", asyncHandler(async (_req, res) => {
  const [customersRes, devicesRes, plansRes, usersRes, plansByCategoryRes, customersByLegalFormRes, devicesByTypeRes] = await Promise.all([
    query("SELECT COUNT(*) as count FROM customers WHERE NOT is_deleted"),
    query("SELECT COUNT(*) as count FROM devices WHERE NOT is_deleted"),
    query("SELECT COUNT(*) as count FROM plans WHERE NOT is_deleted"),
    query("SELECT COUNT(*) as count FROM users WHERE NOT is_deleted"),
    query(`SELECT e.label, e.color, COUNT(p.id) as count
           FROM plans p JOIN enum_values e ON p.category_id = e.id
           WHERE NOT p.is_deleted GROUP BY e.label, e.color`),
    query(`SELECT e.label, COUNT(c.id) as count
           FROM customers c JOIN enum_values e ON c.legal_form_id = e.id
           WHERE NOT c.is_deleted GROUP BY e.label`),
    query(`SELECT e.label, COUNT(d.id) as count
           FROM devices d JOIN enum_values e ON d.device_type_id = e.id
           WHERE NOT d.is_deleted GROUP BY e.label`),
  ]);

  res.json({
    customers: customersRes.rows[0].count,
    devices: devicesRes.rows[0].count,
    plans: plansRes.rows[0].count,
    users: usersRes.rows[0].count,
    plansByCategory: plansByCategoryRes.rows,
    customersByLegalForm: customersByLegalFormRes.rows,
    devicesByType: devicesByTypeRes.rows,
  });
}));

// ═══════════════════════════════════════════════════════════════
// GLOBAL SEARCH
// ═══════════════════════════════════════════════════════════════
app.get("/api/search", asyncHandler(async (req, res) => {
  const rawQ = String(req.query.q || "").trim();
  if (!rawQ) return res.json({ customers: [], devices: [], plans: [] });
  const escaped = rawQ.replace(/[%_\\]/g, '\\$&');
  const q = `%${escaped}%`;
  const customers = (await query(
    `SELECT * FROM customers WHERE NOT is_deleted AND (
      first_name ILIKE $1 OR last_name ILIKE $1 OR company_name ILIKE $1 OR email ILIKE $1 OR customer_number ILIKE $1
    ) LIMIT 10`, [q]
  )).rows;
  const devices = (await query(
    `SELECT * FROM devices WHERE NOT is_deleted AND (name ILIKE $1 OR ip_address ILIKE $1 OR ssid ILIKE $1) LIMIT 10`, [q]
  )).rows;
  const plans = (await query(
    `SELECT * FROM plans WHERE NOT is_deleted AND description ILIKE $1 LIMIT 10`, [q]
  )).rows;
  res.json({ customers, devices, plans });
}));

// ═══════════════════════════════════════════════════════════════
// CURRENCIES
// ═══════════════════════════════════════════════════════════════
app.get("/api/currencies", asyncHandler(async (_req, res) => {
  const { rows: currencies } = await query("SELECT * FROM currencies ORDER BY code");
  const { rows: denominations } = await query("SELECT * FROM denominations ORDER BY currency_id, value DESC");
  const result = currencies.map((c: any) => ({
    ...c,
    denominations: denominations.filter((d: any) => d.currency_id === c.id),
  }));
  res.json(result);
}));

// ═══════════════════════════════════════════════════════════════
// HEALTH & START
// ═══════════════════════════════════════════════════════════════
app.get("/api/health", async (_req, res) => {
  try {
    await query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (e) {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

const PORT = parseInt(process.env.PORT || "3000");

async function start() {
  // Wait for DB to be ready (retry loop)
  let retries = 30;
  while (retries > 0) {
    try {
      await pool.query("SELECT 1");
      await ensureDeviceSshCredentialColumns();
      console.log("Database connected successfully");
      break;
    } catch (err) {
      retries--;
      console.log(`Waiting for database... (${30 - retries}/30)`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  if (retries === 0) {
    console.error("Could not connect to database after 30 attempts");
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`CRM Backend running on port ${PORT}`);
  });

  // Global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    server.close();
    await pool.end();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
