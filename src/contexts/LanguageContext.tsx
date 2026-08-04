/**
 * LanguageContext & Translation Dictionary (Gap 13)
 * Supports English, Hindi, Marathi, Tamil, Telugu, and Bengali.
 * Integrates RTL-aware directionality controls.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchLanguagePreference, saveLanguagePreference } from '@/services/localization-service';
import { toast } from 'sonner';

export type Language = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn';

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

const DICTIONARY: Record<Language, TranslationDictionary> = {
  en: {
    common: {
      save: 'Save Changes',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      actions: 'Actions',
      status: 'Status',
      overview: 'Overview',
      loading: 'Loading...',
      search: 'Search...',
      filter: 'Filter',
      all: 'All',
      submit: 'Submit',
      export: 'Export Report',
      download: 'Download PDF',
      close: 'Close',
      refresh: 'Refresh',
    },
    nav: {
      overview: 'Overview',
      multiEntity: 'Multi-Entity',
      eFiling: 'E-Filing',
      payments: 'Payments',
      clientVault: 'Client Vault',
      firmOperations: 'Firm Operations',
      regulatoryNews: 'Regulatory News',
      calculators: 'Calculators',
      apiWebhooks: 'API & Webhooks',
      erpIntegration: 'ERP Integration',
      docsOcr: 'Docs & OCR',
      teamRbac: 'Team & RBAC',
      notifications: 'Notifications',
      auditTrail: 'Audit Trail',
      languageHub: 'Language Hub',
    },
    kpis: {
      activeClients: 'Active Corporate Clients',
      healthScore: 'Ecosystem Health Score',
      pendingFilings: 'Pending Returns Sc scrutinized',
      overdueFilings: 'Critical Overdue Filings',
      openNotices: 'Active Scrutiny Notices',
      monthlyRevenue: 'Practice Billing Monthly',
      auditThreats: 'Security Threats Flagged',
      totalAuditLogs: 'Immutable Audit Trail Size',
    },
    headings: {
      dashboardTitle: 'CA Control Tower Console',
      dashboardSubtitle: 'Real-time corporate compliance governance, autonomous AI agents, and centralized regulatory reporting.',
      activeClientMatrix: 'Active Client Portfolio Scrutiny',
      recentAuditEvents: 'Immutable Blockchain-hashed Event Stream',
      noticeOCRTitle: 'Indica AI Multi-Language Scrutiny Notice Translator',
    },
  },
  hi: {
    common: {
      save: 'बदलाव सुरक्षित करें',
      cancel: 'रद्द करें',
      edit: 'संपादित करें',
      delete: 'हटाएं',
      actions: 'कार्रवाई',
      status: 'स्थिति',
      overview: 'अवलोकन',
      loading: 'लोड हो रहा है...',
      search: 'खोजें...',
      filter: 'फ़िल्टर',
      all: 'सभी',
      submit: 'जमा करें',
      export: 'रिपोर्ट निर्यात करें',
      download: 'पीडीएफ डाउनलोड करें',
      close: 'बंद करें',
      refresh: 'रीफ्रेश करें',
    },
    nav: {
      overview: 'अवलोकन',
      multiEntity: 'बहु-इकाई',
      eFiling: 'ई-फाइलिंग',
      payments: 'भुगतान',
      clientVault: 'ग्राहक वॉल्ट',
      firmOperations: 'फर्म संचालन',
      regulatoryNews: 'नियामक समाचार',
      calculators: 'कैलकुलेटर',
      apiWebhooks: 'एपीआई और वेबहुक्स',
      erpIntegration: 'ईआरपी एकीकरण',
      docsOcr: 'दस्तावेज़ और ओसीआर',
      teamRbac: 'टीम और आरबीएसी',
      notifications: 'सूचनाएं',
      auditTrail: 'ऑडिट ट्रेल',
      languageHub: 'भाषा हब',
    },
    kpis: {
      activeClients: 'सक्रिय कॉर्पोरेट ग्राहक',
      healthScore: 'पारिस्थितिकी तंत्र स्वास्थ्य स्कोर',
      pendingFilings: 'लंबित रिटर्न समीक्षा',
      overdueFilings: 'गंभीर अतिदेय फाइलिंग',
      openNotices: 'सक्रिय जांच नोटिस',
      monthlyRevenue: 'फर्म मासिक बिलिंग',
      auditThreats: 'सुरक्षा खतरे ध्वजांकित',
      totalAuditLogs: 'अपरिवर्तनीय ऑडिट लॉग आकार',
    },
    headings: {
      dashboardTitle: 'सीए कंट्रोल टॉवर कंसोल',
      dashboardSubtitle: 'वास्तविक समय में कॉर्पोरेट अनुपालन शासन, स्वायत्त एआई एजेंट और केंद्रीकृत नियामक रिपोर्टिंग।',
      activeClientMatrix: 'सक्रिय ग्राहक पोर्टफोलियो जांच',
      recentAuditEvents: 'अपरिवर्तनीय ब्लॉकचेन-हैशेड इवेंट स्ट्रीम',
      noticeOCRTitle: 'इंडिका एआई बहुभाषी जांच नोटिस अनुवादक',
    },
  },
  mr: {
    common: {
      save: 'बदल जतन करा',
      cancel: 'रद्द करा',
      edit: 'संपादित करा',
      delete: 'हटवा',
      actions: 'कृती',
      status: 'स्थिती',
      overview: 'आढावा',
      loading: 'लोड होत आहे...',
      search: 'शोधा...',
      filter: 'फिल्टर',
      all: 'सर्व',
      submit: 'सादर करा',
      export: 'अहवाल निर्यात करा',
      download: 'पीडीएफ डाउनलोड करा',
      close: 'बंद करा',
      refresh: 'रीफ्रेश करा',
    },
    nav: {
      overview: 'आढावा',
      multiEntity: 'बहु-संस्था',
      eFiling: 'ई-फायलिंग',
      payments: 'पेमेंट्स',
      clientVault: 'क्लायंट वॉल्ट',
      firmOperations: 'फर्म ऑपरेशन्स',
      regulatoryNews: 'नियामक बातम्या',
      calculators: 'कॅल्क्युलेटर',
      apiWebhooks: 'एपीआय आणि वेबहुक्स',
      erpIntegration: 'ईआरपी एकत्रीकरण',
      docsOcr: 'कागदपत्रे आणि ओसीआर',
      teamRbac: 'टीम आणि आरबीएसी',
      notifications: 'सूचना',
      auditTrail: 'ऑडिट ट्रेल',
      languageHub: 'भाषा हब',
    },
    kpis: {
      activeClients: 'सक्रिय कॉर्पोरेट ग्राहक',
      healthScore: 'पर्यावरण प्रणाली आरोग्य स्कोअर',
      pendingFilings: 'प्रलंबित परतावा तपासणी',
      overdueFilings: 'गंभीर थकीत फायलिंग',
      openNotices: 'सक्रिय चौकशी नोटीस',
      monthlyRevenue: 'फर्म मासिक बिलिंग',
      auditThreats: 'सुरक्षा धोके चिन्हांकित',
      totalAuditLogs: 'अपरिवर्तनीय ऑडिट लॉग आकार',
    },
    headings: {
      dashboardTitle: 'सीए कंट्रोल टॉवर कन्सोल',
      dashboardSubtitle: 'रिअल-टाइम कॉर्पोरेट अनुपालन प्रशासन, स्वायत्त एआय एजंट आणि केंद्रीकृत नियामक अहवाल.',
      activeClientMatrix: 'सक्रिय ग्राहक पोर्टफोलिओ तपासणी',
      recentAuditEvents: 'अपरिवर्तनीय ब्लॉकचेन-हॅश इव्हेंट प्रवाह',
      noticeOCRTitle: 'इंडिका एआय बहुभाषिक चौकशी नोटीस अनुवादक',
    },
  },
  ta: {
    common: {
      save: 'மாற்றங்களைச் சேமி',
      cancel: 'ரத்துசெய்',
      edit: 'திருத்து',
      delete: 'நீக்கு',
      actions: 'செயல்கள்',
      status: 'நிலை',
      overview: 'கண்ணோட்டம்',
      loading: 'ஏற்றப்படுகிறது...',
      search: 'தேடு...',
      filter: 'வடிகட்டி',
      all: 'அனைத்தும்',
      submit: 'சமர்ப்பி',
      export: 'அறிக்கையை ஏற்றுமதி செய்',
      download: 'PDF பதிவிறக்கு',
      close: 'மூடு',
      refresh: 'புதுப்பி',
    },
    nav: {
      overview: 'கண்ணோட்டம்',
      multiEntity: 'பல-நிறுவனம்',
      eFiling: 'இ-ஃபைலிங்',
      payments: 'கொடுப்பனவுகள்',
      clientVault: 'வாடிக்கையாளர் காப்பகம்',
      firmOperations: 'நிறுவன செயல்பாடுகள்',
      regulatoryNews: 'ஒழுங்குமுறை செய்திகள்',
      calculators: 'கணக்கீடுகள்',
      apiWebhooks: 'API & வெப்ஹூக்ஸ்',
      erpIntegration: 'ERP ஒருங்கிணைப்பு',
      docsOcr: 'ஆவணங்கள் & OCR',
      teamRbac: 'குழு & RBAC',
      notifications: 'அறிவிப்புகள்',
      auditTrail: 'தணிக்கை தடங்கள்',
      languageHub: 'மொழி மையம்',
    },
    kpis: {
      activeClients: 'செயலில் உள்ள கார்ப்பரேட் வாடிக்கையாளர்கள்',
      healthScore: 'சுற்றுச்சூழல் சுகாதார மதிப்பெண்',
      pendingFilings: 'நிலுவையில் உள்ள தாக்கல்கள் ஆய்வு',
      overdueFilings: 'முக்கியமான காலாவதியான தாக்கல்கள்',
      openNotices: 'செயலில் உள்ள விசாரணை அறிவிப்புகள்',
      monthlyRevenue: 'நிறுவன மாதாந்திர பில்லிங்',
      auditThreats: 'பாதுகாப்பு அச்சுறுத்தல்கள் குறிக்கப்பட்டன',
      totalAuditLogs: 'மாற்ற முடியாத தணிக்கை பதிவுகள் அளவு',
    },
    headings: {
      dashboardTitle: 'சிஏ கட்டுப்பாட்டு கோபுரம் கன்சோல்',
      dashboardSubtitle: 'நிகழ்நேர கார்ப்பரேட் இணக்க ஆளுமை, தன்னாட்சி AI முகவர்கள் மற்றும் மையப்படுத்தப்பட்ட ஒழுங்குமுறை அறிக்கை.',
      activeClientMatrix: 'செயலில் உள்ள வாடிக்கையாளர் போர்ட்ஃபோலியோ ஆய்வு',
      recentAuditEvents: 'மாற்ற முடியாத பிளாக்செயின்-ஹாஷ் நிகழ்வு ஸ்ட்ரீம்',
      noticeOCRTitle: 'இண்டிகா AI பன்மொழி விசாரணை அறிவிப்பு மொழிபெயர்ப்பாளர்',
    },
  },
  te: {
    common: {
      save: 'మార్పులను సేవ్ చేయి',
      cancel: 'రద్దు చేయి',
      edit: 'సవరించు',
      delete: 'తొలగించు',
      actions: 'చర్యలు',
      status: 'స్థితి',
      overview: 'అవలోకనం',
      loading: 'లోడ్ అవుతోంది...',
      search: 'వెతకండి...',
      filter: 'ఫిల్టర్',
      all: 'అన్నీ',
      submit: 'సమర్పించు',
      export: 'నివేదికను ఎగుమతి చేయి',
      download: 'PDF డౌన్‌లోడ్ చేయి',
      close: 'మూసివేయి',
      refresh: 'రిఫ్రెష్ చేయి',
    },
    nav: {
      overview: 'అవలోకనం',
      multiEntity: 'బహుళ-సంస్థ',
      eFiling: 'ఈ-ఫైలింగ్',
      payments: 'చెల్లింపులు',
      clientVault: 'క్లయింట్ వాల్ట్',
      firmOperations: 'కార్యకలాపాలు',
      regulatoryNews: 'రెగ్యులేటరీ వార్తలు',
      calculators: 'క్యాలిక్యులేటర్లు',
      apiWebhooks: 'API & వెబ్‌హుక్స్',
      erpIntegration: 'ERP ఇంటిగ్రేషన్',
      docsOcr: 'డాక్యుమెంట్స్ & OCR',
      teamRbac: 'టీమ్ & RBAC',
      notifications: 'నోటిఫికేషన్లు',
      auditTrail: 'ఆడిట్ ట్రైల్',
      languageHub: 'భాషా హబ్',
    },
    kpis: {
      activeClients: 'క్రియాశీల కార్పొరేట్ క్లయింట్లు',
      healthScore: 'పర్యావరణ వ్యవస్థ ఆరోగ్య స్కోరు',
      pendingFilings: 'పెండింగ్ ఫైలింగ్ల పరిశీలన',
      overdueFilings: 'క్లిష్టమైన ఆలస్య ఫైలింగ్లు',
      openNotices: 'క్రియాశీల నోటీసులు',
      monthlyRevenue: 'సంస్థ నెలవారీ బిల్లింగ్',
      auditThreats: 'భద్రతా ముప్పు హెచ్చరికలు',
      totalAuditLogs: 'మార్పులేని ఆడిట్ లాగ్ సైజు',
    },
    headings: {
      dashboardTitle: 'CA కంట్రోల్ టవర్ కన్సోల్',
      dashboardSubtitle: 'నిజ-సమయ కార్పొరేట్ సమ్మతి పాలన, స్వయంప్రతిపత్త AI ఏజెంట్లు మరియు కేంద్రీకృత నియంత్రణ నివేదిక.',
      activeClientMatrix: 'క్రియాశీల క్లయింట్ పోర్ట్‌ఫోలియో పరిశీలన',
      recentAuditEvents: 'మార్పులేని బ్లాక్‌చైన్-హాష్డ్ ఈవెంట్ స్ట్రీమ్',
      noticeOCRTitle: 'ఇండికా AI బహుభాషా విచారణ నోటీసు అనువాదకుడు',
    },
  },
  bn: {
    common: {
      save: 'পরিবর্তন সংরক্ষণ করুন',
      cancel: 'বাতিল করুন',
      edit: 'সম্পাদনা করুন',
      delete: 'মুছে ফেলুন',
      actions: 'পদক্ষেপ',
      status: 'অবস্থা',
      overview: 'পর্যালোচনা',
      loading: 'লোড হচ্ছে...',
      search: 'অনুসন্ধান...',
      filter: 'ফিল্টার',
      all: 'সমস্ত',
      submit: 'জমা দিন',
      export: 'রিপোর্ট রপ্তানি করুন',
      download: 'পিডিএফ ডাউনলোড করুন',
      close: 'বন্ধ করুন',
      refresh: 'রিফ্রেশ করুন',
    },
    nav: {
      overview: 'পর্যালোচনা',
      multiEntity: 'বহু-সংস্থা',
      eFiling: 'ই-ফাইলিং',
      payments: 'পেমেন্টস',
      clientVault: 'ক্লায়েন্ট ভল্ট',
      firmOperations: 'ফার্ম অপারেশন',
      regulatoryNews: 'নিয়ন্ত্রক সংবাদ',
      calculators: 'ক্যালকুলেটর',
      apiWebhooks: 'এপিআই ও ওয়েবহুক',
      erpIntegration: 'ইআরপি ইন্টিগ্রেশন',
      docsOcr: 'নথি এবং ওসিআর',
      teamRbac: 'টিম এবং আরবিএসি',
      notifications: 'বিজ্ঞপ্তি',
      auditTrail: 'অডিট ট্রেইল',
      languageHub: 'ভাষা হাব',
    },
    kpis: {
      activeClients: 'সক্রিয় কর্পোরেট ক্লায়েন্ট',
      healthScore: 'বাস্তুতন্ত্র স্বাস্থ্য স্কোর',
      pendingFilings: 'মুলতুবি রিটার্ন স্ক্রুটিনি',
      overdueFilings: 'গুরুতর ওভারডিউ ফাইলিং',
      openNotices: 'সক্রিয় স্ক্রুটিনি নোটিশ',
      monthlyRevenue: 'ফার্মের মাসিক বিলিং',
      auditThreats: 'নিরাপত্তা হুমকি চিহ্নিত',
      totalAuditLogs: 'অপরিবর্তনীয় অডিট লগ আকার',
    },
    headings: {
      dashboardTitle: 'সিএ কন্ট্রোল টাওয়ার কনসোল',
      dashboardSubtitle: 'রিয়েল-টাইম কর্পোরেট সম্মতি শাসন, স্বায়ত্তশাসিত এআই এজেন্ট এবং কেন্দ্রীভূত নিয়ন্ত্রক রিপোর্টিং।',
      activeClientMatrix: 'সক্রিয় ক্লায়েন্ট পোর্টফোলিও স্ক্রুটিনি',
      recentAuditEvents: 'অপরিবর্তনীয় ব্লকচেইন-হ্যাশড ইভেন্ট প্রবাহ',
      noticeOCRTitle: 'ইন্ডিকা এআই বহুভাষিক স্ক্রুটিনি নোটিশ অনুবাদক',
    },
  },
};

// LANGUAGE_LABELS is exported from ./language-labels.ts to keep this file
// component/hook-only (required by Vite SWC Fast Refresh).
export { LANGUAGE_LABELS } from './language-labels';


interface LanguageContextProps {
  language: Language;
  direction: 'ltr' | 'rtl';
  isRtlLayout: boolean;
  t: (key: string, variables?: Record<string, string>) => string;
  setLanguagePreference: (lang: Language, rtl?: boolean) => Promise<void>;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [isRtlLayout, setIsRtlLayout] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Load preferred language on auth resolution
  useEffect(() => {
    async function loadPref() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          const pref = await fetchLanguagePreference(userData.user.id);
          if (pref) {
            // Validate that the stored language is actually supported
            const lang = pref.preferred_language;
            if (lang && LANGUAGE_LABELS[lang as Language]) {
              setLanguage(lang as Language);
            }
            setIsRtlLayout(pref.is_rtl_layout);
          }
        }
      } catch (err) {
        console.error('Failed to load language preferences:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPref();
  }, []);

  const setLanguagePreference = async (lang: Language, rtl: boolean = false) => {
    setLanguage(lang);
    setIsRtlLayout(rtl);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        await saveLanguagePreference(userData.user.id, lang, rtl);
        toast.success(`Language set to ${LANGUAGE_LABELS[lang]?.label ?? lang}`);
      } else {
        localStorage.setItem('ca_preferred_lang', lang);
        localStorage.setItem('ca_is_rtl', String(rtl));
        toast.success(`Language updated locally to ${LANGUAGE_LABELS[lang]?.label ?? lang}`);
      }
    } catch (err: any) {
      toast.error(`Error saving preferences: ${err.message}`);
    }
  };

  // Resolve localized strings from key dot notation e.g., 'common.save'
  const t = (key: string, variables?: Record<string, string>): string => {
    const parts = key.split('.');
    let dict: any = DICTIONARY[language] || DICTIONARY.en;
    
    for (const part of parts) {
      if (dict && dict[part] !== undefined) {
        dict = dict[part];
      } else {
        // Fallback to English dictionary
        let fallbackDict: any = DICTIONARY.en;
        for (const fbPart of parts) {
          if (fallbackDict && fallbackDict[fbPart] !== undefined) {
            fallbackDict = fallbackDict[fbPart];
          } else {
            return key; // return key as final fallback
          }
        }
        dict = fallbackDict;
        break;
      }
    }

    if (typeof dict === 'string') {
      let resolved = dict;
      if (variables) {
        for (const [vKey, vVal] of Object.entries(variables)) {
          resolved = resolved.replace(new RegExp(`\\{\\{${vKey}\\}\\}`, 'g'), vVal);
        }
      }
      return resolved;
    }

    return key;
  };

  const direction = isRtlLayout ? 'rtl' : 'ltr';

  // Inject HTML attributes for RTL/LTR layout transitions globally
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);

  return (
    <LanguageContext.Provider value={{ language, direction, isRtlLayout, t, setLanguagePreference, loading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
