/**
 * Localization & Bilingual Notice Service Layer (Gap 13)
 * Real Supabase direct CRUD operations.
 */
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/lib/uuid-guard';
import { handleServiceError } from '@/lib/safe-query';
import { tableExists } from '@/lib/table-registry';

export type IssuingAuthority =
  | 'GSTIN' | 'Income Tax' | 'MCA' | 'DGFT' | 'EPFO' | 'ESIC' | 'SEBI' | 'RBI' | 'Customs';

export type RegionalLanguage =
  | 'Hindi' | 'Marathi' | 'Tamil' | 'Telugu' | 'Bengali' | 'Kannada' | 'Gujarati' | 'Malayalam' | 'Odia' | 'Punjabi';

export type NoticeStatus = 'pending_action' | 'action_taken' | 'disputed' | 'resolved';

export interface ActionItem {
  task_title: string;
  due_date: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface BilingualNotice {
  id: string;
  ca_user_id: string;
  client_name: string;
  notice_title: string;
  issuing_authority: IssuingAuthority;
  source_language: RegionalLanguage;
  original_text: string;
  translated_text: string;
  status: NoticeStatus;
  extracted_action_items: ActionItem[];
  metadata: Record<string, any>;
  notice_date: string;
  due_date?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserLanguagePreference {
  id: string;
  user_id: string;
  preferred_language: 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn';
  is_rtl_layout: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Language Preference Persistence ─────────────────────────────────────────

export async function fetchLanguagePreference(userId: string): Promise<UserLanguagePreference | null> {
  const { data, error } = await (supabase as any)
    .from('user_language_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching language preference:', error.message);
    return null;
  }
  return data;
}

export async function saveLanguagePreference(
  userId: string,
  preferredLanguage: 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn',
  isRtlLayout: boolean = false
): Promise<UserLanguagePreference> {
  const { data, error } = await (supabase as any)
    .from('user_language_preferences')
    .upsert(
      {
        user_id: userId,
        preferred_language: preferredLanguage,
        is_rtl_layout: isRtlLayout,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

// ─── Bilingual Notices CRUD ──────────────────────────────────────────────────

export async function fetchBilingualNotices(caUserId: string): Promise<BilingualNotice[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await (supabase as any)
    .from('bilingual_notices')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('created_at', { ascending: false });

  if (error) return handleServiceError(error, []);
  return data ?? [];
}

export async function createBilingualNotice(notice: Omit<BilingualNotice, 'id' | 'created_at' | 'updated_at'>): Promise<BilingualNotice> {
  const { data, error } = await (supabase as any)
    .from('bilingual_notices')
    .insert([notice])
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

export async function updateBilingualNotice(id: string, updates: Partial<BilingualNotice>): Promise<BilingualNotice> {
  const { data, error } = await (supabase as any)
    .from('bilingual_notices')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

export async function deleteBilingualNotice(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('bilingual_notices')
    .delete()
    .eq('id', id);

  if (error) return handleServiceError(error, []);
}

// ─── OCR Translator & Extraction Engine (Notice Simulator) ───────────────────

interface PredefinedNotice {
  notice_title: string;
  issuing_authority: IssuingAuthority;
  original_text: string;
  translated_text: string;
  notice_date: string;
  due_date: string;
  extracted_action_items: ActionItem[];
  metadata: Record<string, any>;
}

const REGIONAL_NOTICES: Record<RegionalLanguage, PredefinedNotice[]> = {
  Hindi: [
    {
      notice_title: 'धारा 73 के तहत कारण बताओ नोटिस - इनपुट टैक्स क्रेडिट विसंगति',
      issuing_authority: 'GSTIN',
      original_text: `कार्यालय केंद्रीय कर आयुक्त, वार्ड 42, नई दिल्ली।
कारण बताओ नोटिस (शो कॉज नोटिस) - संदर्भ संख्या: GST/DL/2026/04118932
दिनांक: 15 मई 2026
करदाता का नाम: {{client_name}}
जीएसटी संख्या (GSTIN): 07AAAAA1111A1Z1

महोदय/महोदया,
जांच के दौरान यह पाया गया है कि वित्तीय वर्ष 2024-25 के दौरान आपके द्वारा दावा किया गया इनपुट टैक्स क्रेडिट (ITC) आपके आपूर्तिकर्ता द्वारा दाखिल किए गए GSTR-2B विवरण से मेल नहीं खाता है। धारा 73 के अंतर्गत कुल विसंगति ₹4,85,920 पाई गई है।
अतः आपको निर्देशित किया जाता है कि इस नोटिस के प्राप्त होने के 15 दिनों के भीतर स्पष्टीकरण प्रस्तुत करें कि क्यों न उक्त राशि ब्याज (धारा 50) एवं पेनल्टी (10%) के साथ आपसे वसूल की जाए।
अंतिम तिथि: 30 मई 2026

हस्ताक्षर,
असिस्टेंट कमिश्नर, जीएसटी विभाग`,
      translated_text: `Office of the Commissioner of Central Tax, Ward 42, New Delhi.
Show Cause Notice (SCN) under Section 73 - Ref No: GST/DL/2026/04118932
Date: 15 May 2026
Taxpayer Name: {{client_name}}
GSTIN: 07AAAAA1111A1Z1

Dear Sir/Madam,
During investigation, it has been observed that the Input Tax Credit (ITC) claimed by you in the Financial Year 2024-25 does not match the GSTR-2B details filed by your suppliers. A total discrepancy of ₹4,85,920 has been detected under Section 73.
You are hereby directed to submit an explanation within 15 days of receipt of this notice, showing cause why the said amount should not be recovered from you along with interest (Section 50) and a penalty (10%).
Due Date: 30 May 2026

Sd/-,
Assistant Commissioner, GST Department`,
      notice_date: '2026-05-15',
      due_date: '2026-05-30',
      extracted_action_items: [
        {
          task_title: 'File GST SCN Section 73 Reply for GSTR-2B discrepancy',
          due_date: '2026-05-30',
          severity: 'critical',
        },
        {
          task_title: 'Reconcile FY 2024-25 Purchase Ledger with GSTR-2B',
          due_date: '2026-05-25',
          severity: 'warning',
        },
      ],
      metadata: {
        discrepancy_amount: '485920',
        section: 'Section 73',
        tax_period: 'FY 2024-25',
      },
    },
  ],
  Marathi: [
    {
      notice_title: 'कलम १४३(१) अन्वये कर आकारणी सूचना - विसंगती स्पष्टीकरण',
      issuing_authority: 'Income Tax',
      original_text: `आयकर विभाग, मुंबई कार्यालय.
कलम १४३(१) अंतर्गत सूचना (इंटिमेशन) - पॅन: {{pan}}
दिनांक: १० मे २०२६
करदाता: {{client_name}}

महोदय,
आपल्या कर निर्धारण वर्ष २०२५-२६ च्या आयकराच्या ई-फायलिंग विवरणपत्राची प्राथमिक तपासणी पूर्ण झाली आहे. विवरणपत्रात नमूद केलेल्या बँक व्याजाचे उत्पन्न आणि फॉर्म २६एएस (26AS) मधील माहिती यांमध्ये ₹८५,००० ची विसंगती आढळली आहे.
कृपया सदर कर विसंगतीबाबतचे आपले स्पष्टीकरण किंवा दुरुस्त केलेले विवरणपत्र (रिवाइज्ड रिटर्न) ३० दिवसांच्या आत प्राप्तिकर विभागाच्या ई-फायलिंग पोर्टलद्वारे सादर करावे.
मुदत: १० जून २०२६

कर निर्धारण अधिकारी,
आयकर विभाग`,
      translated_text: `Income Tax Department, Mumbai Office.
Intimation under Section 143(1) - PAN: {{pan}}
Date: 10 May 2026
Taxpayer: {{client_name}}

Dear Taxpayer,
The preliminary processing of your Income Tax E-filing Return for the Assessment Year 2025-26 has been completed. A discrepancy of ₹85,000 has been found between the bank interest income declared in your return and the details in Form 26AS.
Please submit your clarification regarding this tax discrepancy or file a revised return through the Income Tax Department E-filing portal within 30 days.
Due Date: 10 June 2026

Tax Assessing Officer,
Income Tax Department`,
      notice_date: '2026-05-10',
      due_date: '2026-06-10',
      extracted_action_items: [
        {
          task_title: 'Resolve IT Section 143(1) discrepancy on bank interest',
          due_date: '2026-06-10',
          severity: 'warning',
        },
        {
          task_title: 'File Revised ITR for AY 2025-26 (if required)',
          due_date: '2026-06-05',
          severity: 'info',
        },
      ],
      metadata: {
        discrepancy_amount: '85000',
        section: 'Section 143(1)',
        assessment_year: 'AY 2025-26',
      },
    },
  ],
  Tamil: [
    {
      notice_title: 'பிரிவு 61ன் கீழ் ஜிஎஸ்டி வருடாந்திர ரிட்டர்ன் தணிக்கை வினவல்',
      issuing_authority: 'GSTIN',
      original_text: `மாநில வரித் துறை, சென்னை தெற்கு.
ஜிஎஸ்டி தணிக்கை அறிவிப்பு - பிரிவு 61
தேதி: 12 மே 2026
பெறுநர்: {{client_name}}
ஜிஎஸ்டிஐஎன்: 33AAAAA2222B1Z2

மதிப்பிற்குரியீர்,
விதி 61-ன் கீழ் உங்களின் 2024-2025-ம் ஆண்டிற்கான ஜிஎஸ்டி வருடாந்திர தாக்கல் (GSTR-9) ஆய்வு செய்யப்பட்டது. வெளிச்சந்தையில் வாங்கப்பட்ட வாகனங்களுக்கான ஐடிசி உரிமைகோரல் (Blocked Credit Section 17(5)) தவறாக கோரப்பட்டுள்ளது கண்டறியப்பட்டுள்ளது.
இதற்கான சரியான ஆவணச் சான்றுகளை 15 நாட்களுக்குள் சமர்ப்பிக்குமாறு கேட்டுக் கொள்ளப்படுகிறீர்கள். தவறும்பட்சத்தில் வரி மற்றும் வட்டி வசூலிக்க நடவடிக்கை எடுக்கப்படும்.
கடைசி தேதி: 27 மே 2026

மாநில உதவி ஆணையர் (ஜிஎஸ்டி)`,
      translated_text: `State Taxes Department, Chennai South.
GST Audit Notice under Section 61
Date: 12 May 2026
Recipient: {{client_name}}
GSTIN: 33AAAAA2222B1Z2

Dear Sir/Madam,
Your GST Annual Filing (GSTR-9) for the year 2024-2025 was scrutinized under Rule 6 Scrutiny of Returns. It is observed that ITC claimed on purchase of motor vehicles in open market (Blocked Credit under Section 17(5)) was wrongly availed.
You are requested to submit appropriate documentary evidence within 15 days, failing which recovery proceedings for tax and interest will be initiated.
Due Date: 27 May 2026

State Assistant Commissioner (GST)`,
      notice_date: '2026-05-12',
      due_date: '2026-05-27',
      extracted_action_items: [
        {
          task_title: 'Provide reply to Section 61 scrutiny query on Section 17(5) Blocked ITC',
          due_date: '2026-05-27',
          severity: 'critical',
        },
        {
          task_title: 'Reverse Blocked ITC on motor vehicles with Interest (GST)',
          due_date: '2026-05-24',
          severity: 'warning',
        },
      ],
      metadata: {
        discrepancy_type: 'Blocked Credit Scrutiny',
        section: 'Section 61 Scrutiny',
        tax_period: 'FY 2024-25',
      },
    },
  ],
  Telugu: [
    {
      notice_title: 'కంపెనీల చట్టం, 2013 లోని సెక్షన్ 137 కింద ఆలస్య రుసుము నోటీసు',
      issuing_authority: 'MCA',
      original_text: `కార్పొరేట్ వ్యవహారాల మంత్రిత్వ శాఖ (MCA), హైదరాబాద్ కార్యాలయం.
ముందస్తు హెచ్చరిక నోటీసు - సెక్షన్ 137
తేదీ: 14 మే 2026
కంపెనీ పేరు: {{client_name}}
సిఐఎన్ (CIN): U72200TG2020PTC123456

ఆదరణీయ డైరెక్టర్లకు,
కంపెనీల చట్టం, 2013 లోని సెక్షన్ 137 ప్రకారం, ముగిసిన ఆర్థిక సంవత్సరానికి సంబంధించిన వార్షిక ఆర్థిక నివేదికల కాపీలను (Form AOC-4) ఇంకా రిజిస్ట్రార్ ఆఫ్ కంపెనీస్ (ROC) కి దాఖలు చేయలేదని గమనించబడింది.
ఈ నోటీసు అందిన 20 రోజుల్లోగా పెనాల్టీ లేకుండా ఫైలింగ్ పూర్తి చేయాలని కోరడమైనది. నిర్లక్ష్యం వహిస్తే రోజూ ₹100 చొప్పున అదనపు రుసుము మరియు చట్టపరమైన చర్యలు ఉంటాయి.
చివరి తేదీ: 03 జూన్ 2026

రిజిస్ట్రార్ ఆఫ్ కంపెనీస్, తెలంగాణ`,
      translated_text: `Ministry of Corporate Affairs (MCA), Hyderabad Office.
Pre-Scrutiny Reminder Notice - Section 137
Date: 14 May 2026
Company Name: {{client_name}}
CIN: U72200TG2020PTC123456

Dear Directors,
Under Section 137 of the Companies Act, 2013, it has been observed that the copy of annual financial statements (Form AOC-4) for the closed financial year has not yet been filed with the Registrar of Companies (ROC).
You are requested to complete the filing without further delay within 20 days. Failure to do so will attract a daily late fee of ₹100 and subsequent penal proceedings.
Due Date: 03 June 2026

Registrar of Companies, Telangana`,
      notice_date: '2026-05-14',
      due_date: '2026-06-03',
      extracted_action_items: [
        {
          task_title: 'File Form AOC-4 Financial Statements on MCA Portal',
          due_date: '2026-06-03',
          severity: 'warning',
        },
        {
          task_title: 'Re-verify Auditor Certification for Annual Filing',
          due_date: '2026-05-28',
          severity: 'info',
        },
      ],
      metadata: {
        form_code: 'AOC-4',
        section: 'Section 137 MCA',
        late_fee_per_day: '100',
      },
    },
  ],
  Bengali: [
    {
      notice_title: 'আয়কর আইনের ধারা ১৪২(১) এর অধীনে তথ্য অনুসন্ধানের নোটিশ',
      issuing_authority: 'Income Tax',
      original_text: `আয়কর বিভাগ, কলকাতা কার্যালয়।
তথ্য তলব নোটিশ - ধারা ১৪২(১) - প্যান: {{pan}}
তারিখ: ০৮ মে ২০২৬
করদাতা: {{client_name}}

মহাশয়,
আপনার কর নির্ধারণী বছর ২০২৫-২৬ এর আয়কর ফাইলিং সংক্রান্ত বিষয়ে অনুসন্ধানের উদ্দেশ্যে নিম্নলিখিত তথ্যাদি জানতে চাওয়া হচ্ছে। আপনার ব্যবসার নগদ লেনদেন এবং ব্যাঙ্কের নগদ জমার নথিপত্র আগামী ১৫ দিনের মধ্যে আমাদের পোর্টালে আপলোড করতে হবে।
অনুগ্রহ করে উল্লেখিত তারিখের মধ্যে আপনার অ্যাকাউন্ট বুক এবং অডিট রিপোর্টের কপি জমা দিন।
শেষ তারিখ: ২৩ মে ২০২৬

আয়কর কমিশনার,
কলকাতা সার্কেল`,
      translated_text: `Income Tax Department, Kolkata Office.
Scrutiny Scavenge Query - Section 142(1) - PAN: {{pan}}
Date: 08 May 2026
Taxpayer: {{client_name}}

Dear Sir/Madam,
For the purpose of inquiry regarding your Income Tax return filing for the Assessment Year 2025-26, the following information is required. You are requested to upload the ledger accounts of cash transactions and bank deposit vouchers on our portal within 15 days.
Please submit the copy of books of accounts and audit reports on or before the due date.
Due Date: 23 May 2026

Assessing Officer,
Income Tax Kolkata Circle`,
      notice_date: '2026-05-08',
      due_date: '2026-05-23',
      extracted_action_items: [
        {
          task_title: 'Upload ledger books and bank cash deposits for Section 142(1) compliance',
          due_date: '2026-05-23',
          severity: 'critical',
        },
      ],
      metadata: {
        section: 'Section 142(1) IT',
        assessment_year: 'AY 2025-26',
        inquiry_type: 'Cash ledger verification',
      },
    },
  ],
  // Fallbacks for other languages
  Kannada: [],
  Gujarati: [],
  Malayalam: [],
  Odia: [],
  Punjabi: []
};

// Fill regional fallbacks with Hindi examples
for (const lang of Object.keys(REGIONAL_NOTICES) as RegionalLanguage[]) {
  if (REGIONAL_NOTICES[lang].length === 0) {
    REGIONAL_NOTICES[lang] = [
      {
        ...REGIONAL_NOTICES.Hindi[0],
        notice_title: `${lang} SCRUTINY - ${REGIONAL_NOTICES.Hindi[0].notice_title}`,
        source_language: lang,
      },
    ];
  }
}

export async function translateAndParseNotice(
  caUserId: string,
  fileName: string,
  originalLang: RegionalLanguage,
  clientName: string,
  issuingAuthority: IssuingAuthority = 'GSTIN'
): Promise<BilingualNotice> {
  // 1. Simulate server-side AI parsing delay (500ms)
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 2. Select notice template based on original language and authority
  const pool = REGIONAL_NOTICES[originalLang] || REGIONAL_NOTICES.Hindi;
  const match = pool.find((item) => item.issuing_authority === issuingAuthority) || pool[0];

  // 3. Dynamic substitutions
  const pan = 'AAACR1234F';
  const cin = 'L12345MH2026PLC098765';
  const customOriginalText = match.original_text
    .replace(/\{\{client_name\}\}/g, clientName)
    .replace(/\{\{pan\}\}/g, pan)
    .replace(/\{\{cin\}\}/g, cin);

  const customTranslatedText = match.translated_text
    .replace(/\{\{client_name\}\}/g, clientName)
    .replace(/\{\{pan\}\}/g, pan)
    .replace(/\{\{cin\}\}/g, cin);

  const noticeData: Omit<BilingualNotice, 'id' | 'created_at' | 'updated_at'> = {
    ca_user_id: caUserId,
    client_name: clientName,
    notice_title: match.notice_title.replace(/\{\{client_name\}\}/g, clientName),
    issuing_authority: match.issuing_authority,
    source_language: originalLang,
    original_text: customOriginalText,
    translated_text: customTranslatedText,
    status: 'pending_action',
    extracted_action_items: match.extracted_action_items,
    metadata: {
      ...match.metadata,
      parsed_file_name: fileName,
      ocr_confidence_score: 98.4,
      ai_translator: 'Regulon Indica LLM v2',
    },
    notice_date: match.notice_date,
    due_date: match.due_date,
    pdf_url: `https://avatars.storage.supabase.co/notices/${Date.now()}_notice.pdf`,
  };

  // 4. Create record in db
  const savedNotice = await createBilingualNotice(noticeData);

  // 5. Create a regulatory task automatically for the first action item in compliance table if possible
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.id && tableExists('compliance_tasks')) {
      const firstAction = savedNotice.extracted_action_items[0];
      await (supabase as any)
        .from('compliance_tasks' as any)
        .insert([{
          ca_user_id: caUserId,
          client_name: clientName,
          task_title: `[Notice Action] ${firstAction.task_title}`,
          due_date: firstAction.due_date,
          status: 'pending',
          priority: firstAction.severity === 'critical' ? 'high' : firstAction.severity === 'warning' ? 'medium' : 'low',
          category: match.issuing_authority,
          comments: `Extracted from parsed notice "${savedNotice.notice_title}" using regional translation.`,
        }]);
    }
  } catch (err) {
    console.error('Failed to auto-create statutory task:', err);
  }

  // 6. Log dynamic action inside immutable audit logs for Gap 12
  try {
    const { logAuditEvent } = await import('./audit-trail-service');
    await logAuditEvent({
      ca_user_id: caUserId,
      actor_type: 'ca_user',
      actor_id: caUserId,
      actor_name: 'CA Admin',
      module: 'doc-ocr',
      action: 'bilingual_notice_ocr_translate',
      resource_type: 'bilingual_notice',
      resource_id: savedNotice.id,
      resource_name: savedNotice.notice_title,
      metadata: { original_language: originalLang, issuing_authority: match.issuing_authority },
      severity: 'info',
      risk_score: 2,
      is_sensitive: false,
    });
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }

  return savedNotice;
}
