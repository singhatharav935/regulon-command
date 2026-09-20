// Live synchronization for Index page
// Fetches live regulatory data every 1 minute

import { fetchLiveRegulatoryNews, fetchLiveRegulatoryRules } from './live-regulatory-data';

export async function getLiveRegulatedAnnouncements() {
  try {
    // Fetch both news and rules
    const [newsItems, ruleItems] = await Promise.all([
      fetchLiveRegulatoryNews(),
      fetchLiveRegulatoryRules(),
    ]);

    // Convert news items to announcement format
    const announcements = [
      // Rules first (higher priority)
      ...ruleItems.map((rule, idx) => ({
        ...rule,
        id: rule.id || `rule-${idx}`,
      })),
      // Then news items
      ...newsItems.map((news, idx) => ({
        id: news.id || `news-${idx}`,
        source: news.category.toLowerCase().replace(/\s+/g, '-'),
        source_label: news.authority,
        title: news.title,
        summary: news.summary || null,
        category: news.regulatoryArea,
        announced_by: news.authority,
        source_url: news.sourceUrl,
        announced_on: new Date(news.date).toISOString().split('T')[0],
        published_date: new Date(news.date).toISOString().split('T')[0],
        detected_at: new Date().toISOString(),
        effective_date: null,
        action_deadline: null,
        impact_score: news.severity === 'high' ? 9 : news.severity === 'medium' ? 6 : 3,
        company_exposure: (news.severity === 'high' ? 'high' : news.severity === 'medium' ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        action_owner: 'Compliance Operations',
        original_url: news.sourceUrl,
        source_verified: true,
      })),
    ];

    return {
      announcements,
      last_synced_at: new Date().toISOString(),
      monitored_portals: 7,
      sync_status: announcements.length > 0 ? 'agent_active' as const : 'awaiting_first_sync' as const,
      source_status: [
        { source: 'gstn', source_label: 'GSTN', status: 'active' as const, latest_notice_at: null, latest_notice_title: null },
        { source: 'rbi', source_label: 'RBI', status: 'active' as const, latest_notice_at: null, latest_notice_title: null },
        { source: 'incometax', source_label: 'Income Tax', status: 'active' as const, latest_notice_at: null, latest_notice_title: null },
        { source: 'mca', source_label: 'MCA', status: 'active' as const, latest_notice_at: null, latest_notice_title: null },
        { source: 'sebi', source_label: 'SEBI', status: 'active' as const, latest_notice_at: null, latest_notice_title: null },
        { source: 'cbic', source_label: 'CBIC', status: 'active' as const, latest_notice_at: null, latest_notice_title: null },
        { source: 'egazette', source_label: 'eGazette', status: 'active' as const, latest_notice_at: null, latest_notice_title: null },
      ],
    };
  } catch (error) {
    console.error('Error fetching live announcements:', error);
    throw error;
  }
}
