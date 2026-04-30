/**
 * SANNIDH Advanced Regulatory Data Agents
 * Automated agents that fetch data from Government of India portals and news media
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import winston from 'winston';
import cron from 'node-cron';

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/regulatory-agents.log' }),
    new winston.transports.Console()
  ]
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Government Portal Configurations
const GOV_PORTALS = {
  GSTN: {
    name: 'GSTN',
    url: 'https://www.gstn.org/newsandupdates',
    selector: '.news-item',
    authority: 'Goods and Services Tax Network',
    category: 'GST'
  },
  CBIC: {
    name: 'CBIC',
    url: 'https://www.cbic.gov.in/circulars-notices',
    selector: '.notification-item',
    authority: 'Central Board of Indirect Taxes and Customs',
    category: 'Customs & Excise'
  },
  INCOMETAX: {
    name: 'Income Tax India',
    url: 'https://www.incometaxindia.gov.in/iec/foportal/latest-news',
    selector: '.latest-news-item',
    authority: 'Income Tax Department',
    category: 'Income Tax'
  },
  MCA: {
    name: 'MCA',
    url: 'https://www.mca.gov.in/content/mca/global/en/notifications-tenders.html',
    selector: '.notification',
    authority: 'Ministry of Corporate Affairs',
    category: 'Corporate Affairs'
  },
  SEBI: {
    name: 'SEBI',
    url: 'https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=1&ssid=7&smid=0',
    selector: '.circular-item',
    authority: 'Securities and Exchange Board of India',
    category: 'Securities'
  },
  RBI: {
    name: 'RBI',
    url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx',
    selector: '.notification-row',
    authority: 'Reserve Bank of India',
    category: 'Banking & Finance'
  },
  EGAZETTE: {
    name: 'eGazette',
    url: 'https://egazette.nic.in/',
    selector: '.gazette-entry',
    authority: 'Government of India',
    category: 'Official Gazette'
  }
};

// News Media Sources
const NEWS_SOURCES = {
  BUSINESS_STANDARD: {
    name: 'Business Standard',
    url: 'https://www.business-standard.com/topic/regulatory-updates',
    selector: '.story-card',
    category: 'Business News'
  },
  ECONOMIC_TIMES: {
    name: 'Economic Times',
    url: 'https://economictimes.indiatimes.com/news/economy/policy',
    selector: '.story-box',
    category: 'Economic Policy'
  },
  LIVEMINT: {
    name: 'LiveMint',
    url: 'https://www.livemint.com/policy',
    selector: '.listingNew',
    category: 'Policy Updates'
  },
  FINANCIAL_EXPRESS: {
    name: 'Financial Express',
    url: 'https://www.financialexpress.com/policy/',
    selector: '.article-box',
    category: 'Financial Policy'
  }
};

// Export for API use
export { GOV_PORTALS, NEWS_SOURCES };

// Impact Assessment AI
class ImpactAssessmentEngine {
  static assessImpact(title, content, source) {
    const highImpactKeywords = [
      'mandatory', 'compliance', 'penalty', 'fine', 'suspension', 'cancellation',
      'immediate effect', 'urgent', 'deadline', 'filing', 'registration', 'amendment'
    ];
    
    const mediumImpactKeywords = [
      'notification', 'circular', 'clarification', 'guideline', 'procedure',
      'format', 'form', 'process', 'requirement', 'submission'
    ];

    const text = `${title} ${content}`.toLowerCase();
    
    let score = 0;
    let exposure = 'low';
    
    highImpactKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 3;
    });
    
    mediumImpactKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 1;
    });
    
    if (score >= 6) exposure = 'high';
    else if (score >= 3) exposure = 'medium';
    
    return { score, exposure };
  }

  static extractDeadline(text) {
    const deadlinePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g,
      /(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/gi,
      /by\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
      /before\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi
    ];

    for (const pattern of deadlinePatterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  }
}

// Main Regulatory Agent Class
class RegulatoryAgent {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.isActive = false;
    this.lastFetch = null;
    this.errorCount = 0;
    this.maxRetries = 3;
  }

  async fetchData() {
    if (this.isActive) {
      logger.warn(`Agent ${this.name} is already active, skipping fetch`);
      return [];
    }

    this.isActive = true;
    logger.info(`Starting data fetch for ${this.name}`);

    try {
      const response = await axios.get(this.config.url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const updates = [];

      $(this.config.selector).each((index, element) => {
        try {
          const update = this.parseElement($, element);
          if (update) updates.push(update);
        } catch (error) {
          logger.error(`Error parsing element for ${this.name}:`, error);
        }
      });

      this.lastFetch = new Date();
      this.errorCount = 0;
      
      logger.info(`Successfully fetched ${updates.length} updates from ${this.name}`);
      
      // Store in database
      await this.saveUpdates(updates);
      
      return updates;

    } catch (error) {
      this.errorCount++;
      logger.error(`Error fetching data from ${this.name} (attempt ${this.errorCount}):`, error.message);
      
      if (this.errorCount >= this.maxRetries) {
        logger.error(`Max retries reached for ${this.name}, disabling agent`);
        await this.recordError(error);
      }
      
      return [];
    } finally {
      this.isActive = false;
    }
  }

  parseElement($, element) {
    const $el = $(element);
    
    // Extract basic information
    const title = $el.find('a, h3, h4, .title').first().text().trim();
    const link = $el.find('a').first().attr('href');
    const date = this.extractDate($el);
    const summary = $el.find('.summary, .description, p').first().text().trim();

    if (!title) return null;

    // Generate unique ID
    const id = `${this.name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Assess impact
    const { score, exposure } = ImpactAssessmentEngine.assessImpact(title, summary, this.name);
    const deadline = ImpactAssessmentEngine.extractDeadline(`${title} ${summary}`);

    return {
      id,
      source: this.name.toLowerCase().replace(/\s+/g, '_'),
      source_label: this.config.name,
      title,
      summary: summary || null,
      category: this.config.category,
      announced_by: this.config.authority,
      source_url: link ? (link.startsWith('http') ? link : `${new URL(this.config.url).origin}${link}`) : null,
      announced_on: date || new Date().toISOString(),
      published_date: date,
      detected_at: new Date().toISOString(),
      effective_date: null, // Could be parsed from content
      action_deadline: deadline,
      impact_score: score,
      company_exposure: exposure,
      action_owner: 'Compliance Team',
      original_url: this.config.url,
      source_verified: true,
      raw_content: $el.html()
    };
  }

  extractDate($el) {
    const dateSelectors = ['.date', '.published', '.timestamp', 'time', '[datetime]'];
    
    for (const selector of dateSelectors) {
      const dateEl = $el.find(selector).first();
      if (dateEl.length) {
        const dateText = dateEl.attr('datetime') || dateEl.text().trim();
        const date = new Date(dateText);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }
    
    return new Date().toISOString();
  }

  async saveUpdates(updates) {
    if (updates.length === 0) return;

    try {
      // Insert into regulatory_alerts table
      const { data, error } = await supabase
        .from('regulatory_alerts')
        .upsert(updates, { onConflict: 'id' });

      if (error) {
        logger.error(`Error saving updates for ${this.name}:`, error);
        return;
      }

      logger.info(`Saved ${updates.length} updates for ${this.name} to database`);

      // Update source status
      await supabase
        .from('agent_status')
        .upsert({
          agent_name: this.name,
          source: this.name.toLowerCase().replace(/\s+/g, '_'),
          status: 'active',
          last_fetch: this.lastFetch.toISOString(),
          updates_count: updates.length,
          error_count: this.errorCount,
          latest_update: updates[0]?.title || null
        }, { onConflict: 'agent_name' });

    } catch (error) {
      logger.error(`Database error for ${this.name}:`, error);
    }
  }

  async recordError(error) {
    try {
      await supabase
        .from('agent_status')
        .upsert({
          agent_name: this.name,
          source: this.name.toLowerCase().replace(/\s+/g, '_'),
          status: 'error',
          last_fetch: this.lastFetch?.toISOString() || null,
          error_count: this.errorCount,
          last_error: error.message,
          error_timestamp: new Date().toISOString()
        }, { onConflict: 'agent_name' });
    } catch (dbError) {
      logger.error(`Failed to record error for ${this.name}:`, dbError);
    }
  }
}

// News Media Agent
class NewsMediaAgent extends RegulatoryAgent {
  parseElement($, element) {
    const $el = $(element);
    
    const title = $el.find('a, h2, h3, .headline').first().text().trim();
    const link = $el.find('a').first().attr('href');
    const summary = $el.find('.summary, .excerpt, p').first().text().trim();
    const date = this.extractDate($el);

    if (!title) return null;

    const id = `news_${this.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { score, exposure } = ImpactAssessmentEngine.assessImpact(title, summary, this.name);

    return {
      id,
      source: `news_${this.name.toLowerCase().replace(/\s+/g, '_')}`,
      source_label: this.config.name,
      title,
      summary: summary || null,
      category: 'News Update',
      announced_by: this.config.name,
      source_url: link ? (link.startsWith('http') ? link : `${new URL(this.config.url).origin}${link}`) : null,
      announced_on: date || new Date().toISOString(),
      published_date: date,
      detected_at: new Date().toISOString(),
      effective_date: null,
      action_deadline: null,
      impact_score: Math.max(1, score), // News always has at least some impact
      company_exposure: exposure,
      action_owner: 'Business Intelligence Team',
      original_url: this.config.url,
      source_verified: true,
      raw_content: $el.html()
    };
  }
}

// Agent Manager
class RegulatoryAgentManager {
  constructor() {
    this.agents = [];
    this.newsAgents = [];
    this.isRunning = false;
    this.initializeAgents();
  }

  initializeAgents() {
    // Government portal agents
    Object.entries(GOV_PORTALS).forEach(([key, config]) => {
      this.agents.push(new RegulatoryAgent(key, config));
    });

    // News media agents
    Object.entries(NEWS_SOURCES).forEach(([key, config]) => {
      this.newsAgents.push(new NewsMediaAgent(key, config));
    });

    logger.info(`Initialized ${this.agents.length} government portal agents and ${this.newsAgents.length} news media agents`);
  }

  async runAllAgents() {
    if (this.isRunning) {
      logger.warn('Agent manager is already running, skipping this cycle');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    logger.info('Starting regulatory data fetch cycle');

    try {
      // Run government portal agents
      const govPromises = this.agents.map(agent => agent.fetchData());
      const govResults = await Promise.allSettled(govPromises);

      // Run news media agents
      const newsPromises = this.newsAgents.map(agent => agent.fetchData());
      const newsResults = await Promise.allSettled(newsPromises);

      // Log results
      const totalUpdates = [
        ...govResults.map(r => r.status === 'fulfilled' ? r.value.length : 0),
        ...newsResults.map(r => r.status === 'fulfilled' ? r.value.length : 0)
      ].reduce((sum, count) => sum + count, 0);

      const duration = (Date.now() - startTime) / 1000;
      
      logger.info(`Fetch cycle completed in ${duration}s, collected ${totalUpdates} total updates`);

      // Update system status
      await this.updateSystemStatus(totalUpdates, duration);

    } catch (error) {
      logger.error('Error in agent manager run cycle:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async updateSystemStatus(totalUpdates, duration) {
    try {
      await supabase
        .from('system_status')
        .upsert({
          service: 'regulatory_agents',
          status: 'active',
          last_run: new Date().toISOString(),
          total_updates: totalUpdates,
          run_duration: duration,
          active_agents: this.agents.filter(a => a.errorCount < a.maxRetries).length + 
                        this.newsAgents.filter(a => a.errorCount < a.maxRetries).length,
          total_agents: this.agents.length + this.newsAgents.length
        }, { onConflict: 'service' });
    } catch (error) {
      logger.error('Error updating system status:', error);
    }
  }

  startScheduler() {
    // Run every 30 minutes for government portals
    cron.schedule('*/30 * * * *', () => {
      this.runAllAgents();
    });

    // Run every 2 hours for news
    cron.schedule('0 */2 * * *', () => {
      Promise.all(this.newsAgents.map(agent => agent.fetchData()));
    });

    logger.info('Regulatory agent scheduler started - Government portals: every 30 minutes, News: every 2 hours');
  }

  async getStatus() {
    const govStatus = this.agents.map(agent => ({
      name: agent.name,
      isActive: agent.isActive,
      lastFetch: agent.lastFetch,
      errorCount: agent.errorCount,
      status: agent.errorCount >= agent.maxRetries ? 'error' : 'active'
    }));

    const newsStatus = this.newsAgents.map(agent => ({
      name: agent.name,
      isActive: agent.isActive,
      lastFetch: agent.lastFetch,
      errorCount: agent.errorCount,
      status: agent.errorCount >= agent.maxRetries ? 'error' : 'active'
    }));

    return {
      government_agents: govStatus,
      news_agents: newsStatus,
      total_agents: this.agents.length + this.newsAgents.length,
      active_agents: [...this.agents, ...this.newsAgents].filter(a => a.errorCount < a.maxRetries).length,
      system_running: this.isRunning
    };
  }
}

// Export singleton instance
export const regulatoryAgentManager = new RegulatoryAgentManager();

// API endpoints
export const startAgents = () => {
  regulatoryAgentManager.startScheduler();
  return { message: 'Regulatory agents started successfully' };
};

export const runAgentsNow = async () => {
  await regulatoryAgentManager.runAllAgents();
  return { message: 'Agent run cycle completed' };
};

export const getAgentStatus = async () => {
  return await regulatoryAgentManager.getStatus();
};

// Auto-start on import
if (process.env.NODE_ENV === 'production' || process.env.AUTO_START_AGENTS === 'true') {
  regulatoryAgentManager.startScheduler();
  logger.info('Regulatory agents auto-started');
}