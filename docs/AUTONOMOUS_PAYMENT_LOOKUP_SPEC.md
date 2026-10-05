# 📄 SANNIDH SPECIFICATION: Autonomous Payment Classification & Government Lookup Engine

> **Document Status:** Active Technical Architecture Specification  
> **Target Module:** Sannidh Payment Intelligence & Ingestion Engine  
> **Goal:** Achieve 99.9% automated transaction classification using NPCI VPA Lookup, Bank Penny-Drop, and Government GSTIN/MCA Directory APIs.

---

## 1. Executive Summary & Objective

In India, raw bank statements and PhonePe/Paytm CSVs do not specify payment categories (e.g., "Salary", "Vendor Purchase", "Rent"). They only contain raw UPI VPAs (e.g., `apexuniforms@icici`), UTR reference numbers, or Bank Account + IFSC details.

This engine automates payment categorization by performing real-time entity resolution:
1. **Identifies the Official Legal Entity** behind any UPI VPA or Bank Account.
2. **Determines if the entity is a Registered Business or an Individual.**
3. **Cross-references Business Entities against Government GST/MCA Directories** to extract the business nature (Vendor/Supplier).
4. **Cross-references Individual Entities against Sannidh's internal Employee/Payroll Registry** to identify Salaries.

---

## 2. Core API Architecture (The 2 Required APIs)

```
                       Raw Transaction Ingestion
                    (UPI VPA or Bank Account + IFSC)
                                   │
                                   ▼
 ┌──────────────────────────────────────────────────────────────────────────┐
 │ API 1: NPCI VPA / Bank Account Validation API (Penny-Drop / VPA Lookup)  │
 └─────────────────────────────────┬────────────────────────────────────────┘
                                   │
      ┌────────────────────────────┴────────────────────────────┐
      ▼                                                         ▼
[Business Account (isMerchant = true)]            [Personal Account (isMerchant = false)]
      │                                                         │
      ▼                                                         ▼
 ┌─────────────────────────────────────────┐       ┌─────────────────────────────────────────┐
 │ API 2: Government GSTIN & MCA Directory │       │ Internal Sannidh Employee & Guard Registry│
 └────────────────────┬────────────────────┘       └────────────────────┬────────────────────┘
                      │                                                 │
                      ▼                                                 ▼
        🏷️ 100% VENDOR PURCHASE                           🏷️ 100% GUARD / EMPLOYEE SALARY
        (Ledger 5001 - Creditors)                          (Ledger 5002 - Salary Payable)
```

### 🔹 API 1: NPCI VPA & Bank Account Validation API (Penny-Drop / VPA Lookup)
* **Recommended API Providers:** Cashfree Verification Suite, Decentro, Razorpay X, or Karza Technologies.
* **Input Parameters:** 
  - `vpa` (e.g., `apexuniforms@icici` or `9876543210@paytm`) OR
  - `account_number` + `ifsc` (for IMPS/NEFT/RTGS payments).
* **Returned Outputs:**
  - `registered_name` (e.g., *"Apex Uniforms Private Limited"* or *"Rajesh Kumar"*)
  - `isMerchant` (`true` for business accounts, `false` for personal accounts)
  - `mcc_code` (Merchant Category Code, e.g., `5691` Uniforms, `5411` Grocery, `5541` Fuel)
  - `bank_name` & `account_status` (`VALID`)

### 🔹 API 2: Government GSTIN & MCA Corporate Directory Search API
* **Recommended API Providers:** GSTN Portal Official API, Master India API, ClearTax API, or Setu API.
* **Input Parameters:**
  - `legal_name` OR `trade_name` OR `gstin` extracted from API 1.
* **Returned Outputs:**
  - `gstin` (e.g., `27AAACA1234F1Z5`)
  - `business_nature` (e.g., *"Manufacturer of Textile Products & Security Gear"*)
  - `filing_status` (`ACTIVE`)
  - `hsn_sac_codes` (e.g., `6203` Security Uniforms)

---

## 3. Step-by-Step Resolution Logic

```typescript
// Resolution Engine Algorithm Concept
async function resolvePaymentEntity(txn: BankTxn) {
  // Step 1: Query API 1 (VPA / Penny-Drop Lookup)
  const bankDetails = await lookupBankDetails({ vpa: txn.vpa, acc: txn.accNo, ifsc: txn.ifsc });
  
  if (bankDetails.isMerchant) {
    // Step 2A: Query API 2 (GST & MCA Directory for Business Entities)
    const gstData = await lookupGSTDirectory(bankDetails.registered_name);
    
    return {
      type: 'VENDOR_PAYMENT',
      ledgerCode: 5001, // Sundry Creditors
      vendorName: gstData.legal_name || bankDetails.registered_name,
      gstin: gstData.gstin,
      category: mapMCCToCategory(bankDetails.mcc_code) // e.g. Uniform Expense
    };
  } else {
    // Step 2B: Search Internal Company Payroll Database
    const employeeMatch = await matchInternalEmployeeRegistry(bankDetails.registered_name, txn.accNo);
    
    if (employeeMatch) {
      return {
        type: 'EMPLOYEE_SALARY',
        ledgerCode: 5002, // Salary Payable
        employeeId: employeeMatch.id,
        employeeName: employeeMatch.name,
        category: 'Salaries & Wages'
      };
    } else {
      return {
        type: 'PETTY_EXPENSE',
        ledgerCode: 3003, // General Expense
        category: mapMCCToCategory(bankDetails.mcc_code) || 'Unregistered Vendor'
      };
    }
  }
}
```

---

## 4. What We Need From Your Side (Prerequisites & Action Checklist)

To activate this autonomous lookup engine for real, we need the following credentials from your end:

### 📋 Checklist:

1. **Verification API Account (For API 1 - VPA & Bank Lookup):**
   - Create a developer account on **Cashfree Verification Suite** (`cashfree.com`) OR **Decentro** (`decentro.tech`).
   - Get the API Credentials:
     - `CASHFREE_CLIENT_ID`
     - `CASHFREE_CLIENT_SECRET`

2. **GST / Tax Lookup API Account (For API 2 - Government Directory Search):**
   - Create an account on **Master India API** (`masterindia.co`) OR **Setu API** (`setu.co`) OR **ClearTax Developer API**.
   - Get the API Credentials:
     - `GST_API_KEY`
     - `GST_API_SECRET`

3. **Provide API Keys to Agent:**
   - Once you get these keys, simply paste them here or add them to Supabase Edge Function Secrets (`npx supabase secrets set ...`), and the agent will code the backend integration immediately!

---

## 5. Next Implementation Steps for Developer Agent

1. Build `paymentLookupService.ts` in `src/services/` to handle API 1 and API 2 fallback queues.
2. Integrate `resolvePaymentEntity()` inside `DataIngestionModal.tsx` and `trialBalanceEngine.ts`.
3. Add a **"Verified by Govt Directory"** badge (🟢 GST Verified / 🔵 Employee Verified) on the Bank Transaction UI table.
