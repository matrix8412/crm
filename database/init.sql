CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM VALUES (replaces in-memory enumerations)
-- ============================================
CREATE TABLE enum_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    color VARCHAR(7),
    ssid BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, label)
);

CREATE INDEX idx_enum_values_category ON enum_values(category);

-- ============================================
-- ADDRESSES
-- ============================================
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    street VARCHAR(255),
    descriptive_number VARCHAR(50),
    reference_number VARCHAR(50),
    city VARCHAR(255),
    zip_code VARCHAR(20),
    state VARCHAR(255),
    gps_lat DECIMAL(10,7),
    gps_lon DECIMAL(10,7),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SITES
-- ============================================
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    description TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sites_address ON sites(address_id);

-- ============================================
-- RACKS
-- ============================================
CREATE TABLE racks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    u_height INTEGER NOT NULL DEFAULT 42,
    description TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_racks_site ON racks(site_id);

-- ============================================
-- CUSTOMERS
-- ============================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_number VARCHAR(50) UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    company_name VARCHAR(255),
    ico VARCHAR(50),
    dic VARCHAR(50),
    ic_dph VARCHAR(50),
    personal_id VARCHAR(50),
    id_card_number VARCHAR(50),
    date_of_birth DATE,
    address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    correspondence_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    legal_form_id UUID REFERENCES enum_values(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_address ON customers(address_id);
CREATE INDEX idx_customers_legal_form ON customers(legal_form_id);

-- ============================================
-- USER GROUPS
-- ============================================
CREATE TABLE user_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    surname VARCHAR(255),
    email VARCHAR(255),
    group_id UUID REFERENCES user_groups(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_group ON users(group_id);

-- ============================================
-- DEVICES
-- ============================================
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    vendor_id UUID REFERENCES enum_values(id) ON DELETE SET NULL,
    device_group_id UUID REFERENCES enum_values(id) ON DELETE SET NULL,
    address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    gps_lat DECIMAL(10,7),
    gps_lon DECIMAL(10,7),
    parent_device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    device_type_id UUID REFERENCES enum_values(id) ON DELETE SET NULL,
    ssid VARCHAR(255),
    ssh_enabled BOOLEAN DEFAULT FALSE,
    ssh_port INTEGER,
    ssh_user VARCHAR(255),
    ssh_password VARCHAR(255),
    http_enabled BOOLEAN DEFAULT FALSE,
    http_port INTEGER,
    https_enabled BOOLEAN DEFAULT FALSE,
    https_port INTEGER,
    api_enabled BOOLEAN DEFAULT FALSE,
    api_port INTEGER,
    api_user VARCHAR(255),
    api_password VARCHAR(255),
    rack_id UUID REFERENCES racks(id) ON DELETE SET NULL,
    rack_position INTEGER,
    rack_height INTEGER DEFAULT 1,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_devices_vendor ON devices(vendor_id);
CREATE INDEX idx_devices_parent ON devices(parent_device_id);
CREATE INDEX idx_devices_rack ON devices(rack_id);
CREATE INDEX idx_devices_type ON devices(device_type_id);

-- ============================================
-- PLANS
-- ============================================
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES enum_values(id) ON DELETE SET NULL,
    reporting_method_id UUID REFERENCES enum_values(id) ON DELETE SET NULL,
    priority_id UUID REFERENCES enum_values(id) ON DELETE SET NULL,
    description TEXT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    scheduled_from TIMESTAMPTZ,
    scheduled_to TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plans_customer ON plans(customer_id);
CREATE INDEX idx_plans_device ON plans(device_id);
CREATE INDEX idx_plans_category ON plans(category_id);
CREATE INDEX idx_plans_scheduled ON plans(scheduled_from, scheduled_to);

-- ============================================
-- COMMENTS
-- ============================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_plan ON comments(plan_id);
CREATE INDEX idx_comments_user ON comments(user_id);

-- ============================================
-- DEVICE TEMPLATES
-- ============================================
CREATE TABLE device_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    vendor_id UUID REFERENCES enum_values(id) ON DELETE SET NULL,
    front_image TEXT,
    back_image TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VLAN DOMAINS
-- ============================================
CREATE TABLE vlan_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_domain_id UUID REFERENCES vlan_domains(id) ON DELETE SET NULL,
    description TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VLANS
-- ============================================
CREATE TABLE vlans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vlan_id INTEGER NOT NULL CHECK (vlan_id >= 1 AND vlan_id <= 4094),
    name VARCHAR(255),
    domain_id UUID REFERENCES vlan_domains(id) ON DELETE SET NULL,
    role_id UUID REFERENCES enum_values(id) ON DELETE SET NULL,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PREFIXES
-- ============================================
CREATE TABLE prefixes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prefix VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','container','reserved')),
    role_id UUID REFERENCES enum_values(id) ON DELETE SET NULL,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    is_pool BOOLEAN DEFAULT FALSE,
    description TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- L2 VPNs
-- ============================================
CREATE TABLE l2_vpns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    vc_id VARCHAR(50),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    description TEXT,
    encapsulation_id UUID REFERENCES enum_values(id) ON DELETE SET NULL,
    mode_id UUID REFERENCES enum_values(id) ON DELETE SET NULL,
    signalization_id UUID REFERENCES enum_values(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- L3 VPNs
-- ============================================
CREATE TABLE l3_vpns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    route_distinguisher VARCHAR(50),
    import_target VARCHAR(255),
    export_target VARCHAR(255),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    description TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TAG JUNCTION TABLES
-- ============================================
CREATE TABLE prefix_tags (
    prefix_id UUID REFERENCES prefixes(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES enum_values(id) ON DELETE CASCADE,
    PRIMARY KEY (prefix_id, tag_id)
);

CREATE TABLE vlan_tags (
    vlan_id UUID REFERENCES vlans(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES enum_values(id) ON DELETE CASCADE,
    PRIMARY KEY (vlan_id, tag_id)
);

CREATE TABLE vlan_domain_tags (
    vlan_domain_id UUID REFERENCES vlan_domains(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES enum_values(id) ON DELETE CASCADE,
    PRIMARY KEY (vlan_domain_id, tag_id)
);

CREATE TABLE l2_vpn_tags (
    l2_vpn_id UUID REFERENCES l2_vpns(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES enum_values(id) ON DELETE CASCADE,
    PRIMARY KEY (l2_vpn_id, tag_id)
);

CREATE TABLE l3_vpn_tags (
    l3_vpn_id UUID REFERENCES l3_vpns(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES enum_values(id) ON DELETE CASCADE,
    PRIMARY KEY (l3_vpn_id, tag_id)
);

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    action VARCHAR(20) NOT NULL CHECK (action IN ('create','update','delete')),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    entity_name VARCHAR(255),
    details JSONB DEFAULT '[]'::jsonb,
    source VARCHAR(20) DEFAULT 'form' CHECK (source IN ('form','import','system'))
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT table_name FROM information_schema.columns
        WHERE column_name = 'updated_at' AND table_schema = 'public'
        AND table_name NOT IN ('settings', 'audit_logs')
    LOOP
        EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t);
    END LOOP;
END $$;

-- ============================================
-- SETTINGS (key-value)
-- ============================================
CREATE TABLE settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CURRENCIES & DENOMINATIONS
-- ============================================
CREATE TABLE currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    symbol VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE denominations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
    value DECIMAL(12,2) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('coin','banknote')),
    label VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_denominations_currency ON denominations(currency_id);

-- ============================================
-- SEED DEFAULT ENUM VALUES
-- ============================================

-- Vendors
INSERT INTO enum_values (category, label) VALUES
('vendor', 'Cisco'), ('vendor', 'Juniper'), ('vendor', 'MikroTik');

-- Legal Forms
INSERT INTO enum_values (category, label) VALUES
('legalForm', 'Individual'), ('legalForm', 'Company'), ('legalForm', 'Sole Proprietor');

-- Device Groups
INSERT INTO enum_values (category, label) VALUES
('deviceGroup', 'Core'), ('deviceGroup', 'Distribution'), ('deviceGroup', 'Access');

-- Device Types
INSERT INTO enum_values (category, label, ssid) VALUES
('deviceType', 'Router', false), ('deviceType', 'Switch', false),
('deviceType', 'Access Point', true), ('deviceType', 'Other', false);

-- Plan Categories
INSERT INTO enum_values (category, label, color) VALUES
('planCategory', 'Installation', '#2ecc71'),
('planCategory', 'Maintenance', '#3498db'),
('planCategory', 'Troubleshooting', '#e74c3c');

-- Reporting Methods
INSERT INTO enum_values (category, label) VALUES
('reportingMethod', 'Phone'), ('reportingMethod', 'Email'), ('reportingMethod', 'System');

-- Plan Priorities
INSERT INTO enum_values (category, label, color) VALUES
('planPriority', 'Urgent', '#e74c3c'),
('planPriority', 'Standard', '#f39c12'),
('planPriority', 'Low Priority', '#3498db');

-- IPAM Roles
INSERT INTO enum_values (category, label, color) VALUES
('ipamRoles', 'Corporate', '#3498db'), ('ipamRoles', 'Guest', '#2ecc71'),
('ipamRoles', 'IoT', '#9b59b6'), ('ipamRoles', 'Management', '#e67e22'),
('ipamRoles', 'Voice', '#1abc9c'), ('ipamRoles', 'Video Surveillance', '#e74c3c');

-- Tags
INSERT INTO enum_values (category, label, color) VALUES
('tags', 'Critical', '#e74c3c'), ('tags', 'Legacy', '#95a5a6'), ('tags', 'Temporary', '#f39c12');

-- L2 VPN Encapsulation
INSERT INTO enum_values (category, label) VALUES
('l2VpnEncapsulation', 'Raw'), ('l2VpnEncapsulation', 'Tagged');

-- L2 VPN Mode
INSERT INTO enum_values (category, label) VALUES
('l2VpnMode', 'VPLS'), ('l2VpnMode', 'VPWS');

-- L2 VPN Signalization
INSERT INTO enum_values (category, label) VALUES
('l2VpnSignalization', 'LDP'), ('l2VpnSignalization', 'BGP-AD');

-- ============================================
-- SEED DEFAULT SETTINGS
-- ============================================
INSERT INTO settings (key, value) VALUES
('appName', '"CRM Application"'),
('theme', '"light"'),
('sidebarAutohide', 'false'),
('toastOpacity', '1'),
('toastPosition', '"top-right"'),
('toastTextColor', '"#ffffff"'),
('glossyMode', 'false'),
('rowsPerPage', '25'),
('showTableHeaderFilters', 'true'),
('minRecordsForFilters', '5'),
('defaultPlanDuration', '1'),
('moduleVisibility', '{"customers":true,"devices":true,"ipam":true,"planning":true,"invoicing":true,"warehouse":true,"tools":true}'),
('zabbixSettings', '{"enabled":false,"url":"","apiKey":""}');

-- ============================================
-- SEED DEFAULT ADDRESS
-- ============================================
INSERT INTO addresses (street, descriptive_number, city, zip_code, state, gps_lat, gps_lon)
VALUES ('Main Street', '123', 'Anytown', '12345', 'Default State', 40.7128000, -74.0060000);

-- ============================================
-- SEED CURRENCIES
-- ============================================

INSERT INTO currencies (code, symbol) VALUES ('EUR', '€'), ('CZK', 'Kč'), ('USD', '$');

-- EUR denominations
INSERT INTO denominations (currency_id, value, type, label)
SELECT c.id, v.value, v.type, v.label FROM currencies c,
(VALUES
  (500, 'banknote', '€500'), (200, 'banknote', '€200'), (100, 'banknote', '€100'),
  (50, 'banknote', '€50'), (20, 'banknote', '€20'), (10, 'banknote', '€10'), (5, 'banknote', '€5'),
  (2, 'coin', '€2'), (1, 'coin', '€1'), (0.50, 'coin', '50 Cent'), (0.20, 'coin', '20 Cent'),
  (0.10, 'coin', '10 Cent'), (0.05, 'coin', '5 Cent'), (0.02, 'coin', '2 Cent'), (0.01, 'coin', '1 Cent')
) AS v(value, type, label) WHERE c.code = 'EUR';

-- CZK denominations
INSERT INTO denominations (currency_id, value, type, label)
SELECT c.id, v.value, v.type, v.label FROM currencies c,
(VALUES
  (5000, 'banknote', '5000 Kč'), (2000, 'banknote', '2000 Kč'), (1000, 'banknote', '1000 Kč'),
  (500, 'banknote', '500 Kč'), (200, 'banknote', '200 Kč'), (100, 'banknote', '100 Kč'),
  (50, 'coin', '50 Kč'), (20, 'coin', '20 Kč'), (10, 'coin', '10 Kč'),
  (5, 'coin', '5 Kč'), (2, 'coin', '2 Kč'), (1, 'coin', '1 Kč')
) AS v(value, type, label) WHERE c.code = 'CZK';

-- USD denominations
INSERT INTO denominations (currency_id, value, type, label)
SELECT c.id, v.value, v.type, v.label FROM currencies c,
(VALUES
  (100, 'banknote', '$100'), (50, 'banknote', '$50'), (20, 'banknote', '$20'),
  (10, 'banknote', '$10'), (5, 'banknote', '$5'), (2, 'banknote', '$2'), (1, 'banknote', '$1'),
  (1, 'coin', '$1 Coin'), (0.50, 'coin', '50¢ Coin'), (0.25, 'coin', '25¢ Coin'),
  (0.10, 'coin', '10¢ Coin'), (0.05, 'coin', '5¢ Coin'), (0.01, 'coin', '1¢ Coin')
) AS v(value, type, label) WHERE c.code = 'USD';
