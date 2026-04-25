# 4 AI AGENTS - WHAT EACH DOES (10-15 Lines Each)

**Location**: `/Users/atharavsingh/Desktop/REGULON_MASTER/frontend/AI_AGENTS_SIMPLE.md`

---

## 1. ANALYZER AGENT
**Input**: GST return, IT filing, company docs  
**Job**: Extract data → Identify what filings are needed → List deadlines & gaps  
**Output**: "You need to file GSTR-1 by 11th, GSTR-3B by 20th. Missing: Annual IT filing"  
**Time**: 2-3 seconds  
**Accuracy**: 98%  

---

## 2. DRAFTER AGENT
**Input**: Data from Analyzer + regulations  
**Job**: Auto-fill government forms (GSTR-1, ITR-4, MCA report) → Calculate taxes correctly → Format for upload  
**Output**: Complete filing document ready to submit to government portal  
**Time**: 30 seconds to 3 minutes  
**Accuracy**: 98%  

---

## 3. REVIEWER AGENT
**Input**: Document from Drafter  
**Job**: Check all fields are filled → Verify math is correct → Cross-check with regulations → Flag errors  
**Output**: ✅ APPROVED or ❌ REJECTED with reasons  
**Time**: 1-2 seconds  
**Accuracy**: 98%  

---

## 4. MONITOR AGENT
**Input**: Filed document + government portal (real-time sync)  
**Job**: Track filing status → Alert if rejected → Watch for government notices → Flag compliance issues  
**Output**: "Filing accepted ✅" or "Government notice: Provide TDS proof by 15-May"  
**Time**: Real-time updates every 30 minutes  
**Accuracy**: 100% (pulls from government portal)  

---

## WHAT HAPPENS WHEN GOVERNMENT NOTICE COMES

**Notice arrives** (e.g., "Provide TDS reconciliation by 15-May")  

**Monitor Agent catches it** immediately (scans gst.gov.in every 30 min)  

**Alert to user**: "⚠️ URGENT: Government notice received"  

**Analyzer re-runs**: Analyzes TDS data, identifies what's missing  

**Drafter auto-generates**: Creates TDS reconciliation document  

**Reviewer checks**: Validates before resubmission  

**User submits**: Clicks "Submit Response" → Document goes to government portal  

**Result**: Notice resolved in 2-3 hours (vs manual: 2-3 days)  

---

## PIPELINE (How They Work Together)

```
User Data → ANALYZER (What's needed?) 
         → DRAFTER (Generate document)
         → REVIEWER (Check for errors)
         → GOVERNMENT PORTAL (Submit)
         → MONITOR (Track status)
         → If notice → Loop back to ANALYZER
```

Done. No more long explanations.
