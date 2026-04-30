-- Regulatory Data Backend Database Schema
-- Tables for storing regulatory updates and agent status

-- Main table for storing regulatory alerts/updates
CREATE TABLE IF NOT EXISTS regulatory_alerts (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  source_label TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  category TEXT,
  announced_by TEXT NOT NULL,
  source_url TEXT,
  announced_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_date TIMESTAMP,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  effective_date TIMESTAMP,
  action_deadline TIMESTAMP,
  impact_score INTEGER DEFAULT 0,
  company_exposure TEXT CHECK (company_exposure IN ('low', 'medium', 'high')) DEFAULT 'low',
  action_owner TEXT DEFAULT 'Compliance Team',
  original_url TEXT,
  source_verified BOOLEAN DEFAULT FALSE,
  raw_content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_regulatory_alerts_source (source),
  INDEX idx_regulatory_alerts_category (category),
  INDEX idx_regulatory_alerts_announced_on (announced_on),
  INDEX idx_regulatory_alerts_impact (impact_score, company_exposure),
  INDEX idx_regulatory_alerts_deadline (action_deadline)
);

-- Agent status tracking table
CREATE TABLE IF NOT EXISTS agent_status (
  agent_name TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'error', 'disabled')) DEFAULT 'active',
  last_fetch TIMESTAMP,
  updates_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  latest_update TEXT,
  last_error TEXT,
  error_timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_agent_status_source (source),
  INDEX idx_agent_status_status (status)
);

-- System status tracking
CREATE TABLE IF NOT EXISTS system_status (
  service TEXT PRIMARY KEY,
  status TEXT CHECK (status IN ('active', 'inactive', 'error')) DEFAULT 'active',
  last_run TIMESTAMP,
  total_updates INTEGER DEFAULT 0,
  run_duration REAL DEFAULT 0,
  active_agents INTEGER DEFAULT 0,
  total_agents INTEGER DEFAULT 0,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_system_status_service (service),
  INDEX idx_system_status_status (status)
);

-- Regulatory news table (for news media sources)
CREATE TABLE IF NOT EXISTS regulatory_news (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  authority TEXT NOT NULL,
  source_url TEXT,
  impact_type TEXT,
  affected_entities TEXT,
  implementation_status TEXT,
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high')) DEFAULT 'low',
  regulatory_area TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'low',
  previous_notices INTEGER DEFAULT 0,
  source_verified BOOLEAN DEFAULT FALSE,
  raw_content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_regulatory_news_category (category),
  INDEX idx_regulatory_news_authority (authority),
  INDEX idx_regulatory_news_date (date),
  INDEX idx_regulatory_news_urgency (urgency),
  INDEX idx_regulatory_news_severity (severity)
);

-- Source monitoring configuration
CREATE TABLE IF NOT EXISTS source_monitoring (
  source_id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('government', 'news', 'legal')) NOT NULL,
  url TEXT NOT NULL,
  selector TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  fetch_interval INTEGER DEFAULT 1800, -- seconds (30 minutes default)
  last_successful_fetch TIMESTAMP,
  consecutive_errors INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  priority INTEGER DEFAULT 1, -- 1=high, 2=medium, 3=low
  config JSON, -- Additional configuration as JSON
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_source_monitoring_type (source_type),
  INDEX idx_source_monitoring_active (is_active),
  INDEX idx_source_monitoring_priority (priority)
);

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_types JSON DEFAULT '["high_impact", "deadline_approaching"]',
  delivery_methods JSON DEFAULT '["email", "dashboard"]',
  frequency TEXT CHECK (frequency IN ('immediate', 'daily', 'weekly')) DEFAULT 'immediate',
  impact_threshold TEXT CHECK (impact_threshold IN ('low', 'medium', 'high')) DEFAULT 'medium',
  sources JSON DEFAULT '[]', -- Specific sources to monitor
  keywords JSON DEFAULT '[]', -- Keywords to watch for
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (user_id),
  INDEX idx_notification_prefs_active (is_active),
  INDEX idx_notification_prefs_threshold (impact_threshold)
);

-- Alert history and delivery tracking
CREATE TABLE IF NOT EXISTS alert_delivery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT NOT NULL REFERENCES regulatory_alerts(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  delivery_method TEXT NOT NULL,
  delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  status TEXT CHECK (status IN ('pending', 'delivered', 'read', 'acknowledged')) DEFAULT 'pending',
  
  INDEX idx_alert_delivery_alert (alert_id),
  INDEX idx_alert_delivery_user (user_id),
  INDEX idx_alert_delivery_status (status),
  INDEX idx_alert_delivery_delivered (delivered_at)
);

-- Initial data for source monitoring
INSERT OR IGNORE INTO source_monitoring (source_id, source_name, source_type, url, selector, priority, config) VALUES
-- Government portals
('gstn', 'GSTN', 'government', 'https://www.gstn.org/newsandupdates', '.news-item', 1, '{"authority": "Goods and Services Tax Network", "category": "GST"}'),
('cbic', 'CBIC', 'government', 'https://www.cbic.gov.in/circulars-notices', '.notification-item', 1, '{"authority": "Central Board of Indirect Taxes and Customs", "category": "Customs & Excise"}'),
('incometax', 'Income Tax India', 'government', 'https://www.incometaxindia.gov.in/iec/foportal/latest-news', '.latest-news-item', 1, '{"authority": "Income Tax Department", "category": "Income Tax"}'),
('mca', 'MCA', 'government', 'https://www.mca.gov.in/content/mca/global/en/notifications-tenders.html', '.notification', 1, '{"authority": "Ministry of Corporate Affairs", "category": "Corporate Affairs"}'),
('sebi', 'SEBI', 'government', 'https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=1&ssid=7&smid=0', '.circular-item', 1, '{"authority": "Securities and Exchange Board of India", "category": "Securities"}'),
('rbi', 'RBI', 'government', 'https://www.rbi.org.in/Scripts/NotificationUser.aspx', '.notification-row', 1, '{"authority": "Reserve Bank of India", "category": "Banking & Finance"}'),
('egazette', 'eGazette', 'government', 'https://egazette.nic.in/', '.gazette-entry', 2, '{"authority": "Government of India", "category": "Official Gazette"}'),

-- News sources
('business_standard', 'Business Standard', 'news', 'https://www.business-standard.com/topic/regulatory-updates', '.story-card', 2, '{"category": "Business News"}'),
('economic_times', 'Economic Times', 'news', 'https://economictimes.indiatimes.com/news/economy/policy', '.story-box', 2, '{"category": "Economic Policy"}'),
('livemint', 'LiveMint', 'news', 'https://www.livemint.com/policy', '.listingNew', 2, '{"category": "Policy Updates"}'),
('financial_express', 'Financial Express', 'news', 'https://www.financialexpress.com/policy/', '.article-box', 2, '{"category": "Financial Policy"}');

-- Initialize system status
INSERT OR IGNORE INTO system_status (service, status) VALUES
('regulatory_agents', 'inactive');

-- Views for easier querying

-- Recent alerts view
CREATE OR REPLACE VIEW recent_regulatory_alerts AS
SELECT 
  ra.*,
  sm.source_name,
  sm.source_type,
  (CASE 
    WHEN ra.action_deadline IS NOT NULL AND ra.action_deadline <= datetime('now', '+7 days') THEN 'urgent'
    WHEN ra.impact_score >= 6 THEN 'high_priority'
    WHEN ra.company_exposure = 'high' THEN 'high_exposure'
    ELSE 'normal'
  END) as alert_priority
FROM regulatory_alerts ra
LEFT JOIN source_monitoring sm ON ra.source = sm.source_id
WHERE ra.announced_on >= datetime('now', '-30 days')
ORDER BY ra.announced_on DESC, ra.impact_score DESC;

-- Agent performance view
CREATE OR REPLACE VIEW agent_performance AS
SELECT 
  ast.*,
  sm.source_name,
  sm.source_type,
  sm.is_active as source_enabled,
  (CASE 
    WHEN ast.error_count = 0 THEN 'healthy'
    WHEN ast.error_count < 3 THEN 'warning'
    ELSE 'critical'
  END) as health_status,
  (julianday('now') - julianday(ast.last_fetch)) * 24 as hours_since_last_fetch
FROM agent_status ast
LEFT JOIN source_monitoring sm ON ast.source = sm.source_id
ORDER BY ast.status, ast.error_count DESC;

-- Dashboard summary view
CREATE OR REPLACE VIEW regulatory_dashboard_summary AS
SELECT 
  COUNT(*) as total_alerts,
  COUNT(CASE WHEN announced_on >= datetime('now', '-24 hours') THEN 1 END) as alerts_24h,
  COUNT(CASE WHEN announced_on >= datetime('now', '-7 days') THEN 1 END) as alerts_7d,
  COUNT(CASE WHEN company_exposure = 'high' THEN 1 END) as high_exposure_alerts,
  COUNT(CASE WHEN action_deadline IS NOT NULL AND action_deadline <= datetime('now', '+7 days') THEN 1 END) as urgent_deadlines,
  AVG(impact_score) as avg_impact_score,
  (SELECT COUNT(*) FROM agent_status WHERE status = 'active') as active_agents,
  (SELECT COUNT(*) FROM agent_status WHERE status = 'error') as error_agents
FROM regulatory_alerts
WHERE announced_on >= datetime('now', '-30 days');

-- Triggers for updating timestamps
CREATE TRIGGER IF NOT EXISTS update_regulatory_alerts_timestamp 
  AFTER UPDATE ON regulatory_alerts
BEGIN
  UPDATE regulatory_alerts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_agent_status_timestamp 
  AFTER UPDATE ON agent_status
BEGIN
  UPDATE agent_status SET updated_at = CURRENT_TIMESTAMP WHERE agent_name = NEW.agent_name;
END;

CREATE TRIGGER IF NOT EXISTS update_system_status_timestamp 
  AFTER UPDATE ON system_status
BEGIN
  UPDATE system_status SET updated_at = CURRENT_TIMESTAMP WHERE service = NEW.service;
END;