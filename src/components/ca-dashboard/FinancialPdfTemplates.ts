/**
 * High-fidelity real-world style financial and statutory compliance PDF generators.
 * Generates structured, compliant Markdown documents that represent official corporate reports.
 */

export function getAuditSignatures(companyName: string, seed: number) {
  const dir1Names = ['Ajay Kumar Singhal', 'Vikram Malhotra', 'Siddharth Reddy', 'Anand Krishnan', 'Rajesh Goenka'];
  const dir2Names = ['Priya Singhal', 'Anjali Malhotra', 'Sunita Reddy', 'Kavitha Krishnan', 'Neeta Goenka'];
  const caNames = ['C.A. Rohan Agrawal', 'C.A. Neha Sharma', 'C.A. Sandeep Joshi', 'C.A. Amit Verma', 'C.A. Deepa Kamath'];
  const caMNos = ['514309', '409281', '398241', '502914', '482019'];
  const frns = ['010482N', '012948S', '029481W', '038291E', '020381C'];
  const caFirms = ['SANNIDH & Associates', 'R. Agrawal & Co.', 'Joshi & Sharma', 'Verma & Associates', 'Kamath & Co.'];

  const idx = seed % 5;
  const dir1 = dir1Names[idx];
  const dir2 = dir2Names[idx];
  const caName = caNames[idx];
  const caMNo = caMNos[idx];
  const frn = frns[idx];
  const caFirm = caFirms[idx];
  
  const din1 = `0${8000000 + (seed % 1999999)}`;
  const din2 = `0${9000000 + (seed % 999999)}`;
  
  // UDIN format: 25[MNo]ABFD[Hash]
  const udinHash = (seed * 17) % 100000000;
  const udin = `25${caMNo}ABFD${udinHash}`;

  return { dir1, dir2, caName, caMNo, frn, caFirm, din1, din2, udin };
}

export function getSupplierList(seed: number) {
  const supplierPool = [
    { gstin: '27AAACN3091H2Z1', name: 'Nexa Technologies Pvt Ltd' },
    { gstin: '07AAACG9281A1ZS', name: 'Delta Logistics India Ltd' },
    { gstin: '29AAACP1193K3Z5', name: 'Prime Spaces & Infrastructure' },
    { gstin: '33AAACT4829J1Z4', name: 'Apex Global Enterprises' },
    { gstin: '06AAACW9012K2Z9', name: 'Sterling Systems India' },
    { gstin: '24AAACS4810H3Z2', name: 'Matrix Logistics LLP' },
    { gstin: '36AAACP0291D1Z0', name: 'Zenith Tech Solutions' },
    { gstin: '19AAACG0924F1Z8', name: 'Blue Ridge Infra Group' },
    { gstin: '27AAACB0981G2Z3', name: 'Quantum Software Services' },
    { gstin: '07AAACS1824J1Z6', name: 'Vanguard Industrial Corp' }
  ];
  
  const idx1 = seed % supplierPool.length;
  const idx2 = (seed + 3) % supplierPool.length;
  const idx3 = (seed + 7) % supplierPool.length;

  return [
    supplierPool[idx1],
    supplierPool[idx2],
    supplierPool[idx3]
  ];
}

export function getEmployeeList(seed: number) {
  const employeePool = [
    { pan: 'ARYPD1092G', name: 'Santosh Kumar Sharma' },
    { pan: 'BKDPK4910H', name: 'Meera Rajan' },
    { pan: 'CMLPM9832A', name: 'Vikrant Sen' },
    { pan: 'DFKPS4021K', name: 'Anjali Sharma' },
    { pan: 'EJKPV8910L', name: 'Amit Verma' },
    { pan: 'FLKPT4921M', name: 'Divya Nair' },
    { pan: 'GLKPM0928N', name: 'Sanjay Deshmukh' },
    { pan: 'HLKPR0291P', name: 'Rohan Mehta' },
    { pan: 'ILKPD9021Q', name: 'Sneha Rao' },
    { pan: 'JLKPK4820R', name: 'Karthik Subramanian' }
  ];

  const idx1 = seed % employeePool.length;
  const idx2 = (seed + 3) % employeePool.length;
  const idx3 = (seed + 7) % employeePool.length;

  return [
    employeePool[idx1],
    employeePool[idx2],
    employeePool[idx3]
  ];
}

export function getDebtorsList(seed: number) {
  const debtorsPool = [
    'Zenith Global Trade',
    'Landmark Retail Corp',
    'Vertex Services Ltd',
    'Horizon Distributers',
    'Nova Enterprises LLP',
    'Omni Solutions Inc',
    'Pinnacle Traders',
    'Vanguard Auto Corp',
    'Infinity Media Pvt Ltd',
    'Falcon Logistics'
  ];

  const idx1 = seed % debtorsPool.length;
  const idx2 = (seed + 2) % debtorsPool.length;
  const idx3 = (seed + 4) % debtorsPool.length;
  const idx4 = (seed + 6) % debtorsPool.length;

  return [
    debtorsPool[idx1],
    debtorsPool[idx2],
    debtorsPool[idx3],
    debtorsPool[idx4]
  ];
}

// Helper to generate deterministic company metadata from name/seed
export function getCompanyMeta(companyName: string, seed: number) {
  const states = ['MH', 'DL', 'KA', 'TN', 'HR', 'GJ', 'TS', 'WB'];
  const cities = ['Mumbai', 'New Delhi', 'Bengaluru', 'Chennai', 'Gurugram', 'Ahmedabad', 'Hyderabad', 'Kolkata'];
  const selectedStateIdx = seed % states.length;
  
  const state = states[selectedStateIdx];
  const city = cities[selectedStateIdx];
  
  // CIN format: L17110MH2015PLC268712
  const listing = seed % 3 === 0 ? 'L' : 'U';
  const activity = 10000 + (seed % 90000);
  const year = 2010 + (seed % 14);
  const regNo = 100000 + (seed % 900000);
  const cin = `${listing}${activity}${state}${year}PTC${regNo}`;
  
  // PAN format: ABCDE1234F (C = Company)
  const panPrefix = 'AAB';
  const typeChar = 'C';
  const companyChar = companyName.trim().replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase() || 'X';
  const panNum = 1000 + (seed % 9000);
  const panSuf = 'G';
  const pan = `${panPrefix}${typeChar}${companyChar}${panNum}${panSuf}`;
  
  // GSTIN: 27ABCDE1234F1Z5
  const stateCode = ['27', '07', '29', '33', '06', '24', '36', '19'][selectedStateIdx];
  const gstin = `${stateCode}${pan}1Z${seed % 9}`;
  
  // TAN: MNDA01234B
  const tanPrefix = city.slice(0, 3).toUpperCase();
  const tanChar = companyChar;
  const tanNum = 1000 + (seed % 9000);
  const tan = `${tanPrefix}${tanChar}${tanNum}E`;
  
  const address = `Plot No. ${42 + (seed % 150)}, Financial District, Phase II, Sector ${seed % 15}, ${city}, ${state} - ${400001 + (seed % 9000)}`;

  return { cin, pan, gstin, tan, address, city, state };
}

// Generate Schedule III Balance Sheet (Multi-page separated by \n---\n)
export function generateBalanceSheetPdf(companyName: string, financialYear: string, seed: number, assets: number): string {
  const meta = getCompanyMeta(companyName, seed);
  const sigs = getAuditSignatures(companyName, seed);
  const prevFY = `${Number(financialYear.split('-')[0]) - 1}-${financialYear.split('-')[0].slice(-2)}`;
  
  // Calculate balanced values
  const shareCapital = Math.floor(assets * 0.15);
  const longTermBorrowings = Math.floor(assets * 0.22);
  const deferredTaxLiab = Math.floor(assets * 0.025);
  const shortTermBorrowings = Math.floor(assets * 0.12);
  const tradePayables = Math.floor(assets * 0.14);
  const shortTermProvs = Math.floor(assets * 0.035);
  // Reserves & Surplus as plug to balance liabilities
  const reservesSurplus = assets - (shareCapital + longTermBorrowings + deferredTaxLiab + shortTermBorrowings + tradePayables + shortTermProvs);

  // Asset breakdown
  const ppe = Math.floor(assets * 0.42);
  const intangibles = Math.floor(assets * 0.04);
  const nonCurrentInv = Math.floor(assets * 0.075);
  const longTermLoans = Math.floor(assets * 0.03);
  const inventories = Math.floor(assets * 0.16);
  const tradeReceivables = Math.floor(assets * 0.125);
  const shortTermLoans = Math.floor(assets * 0.03);
  // Cash & Equivalents as plug to balance assets
  const cashEquiv = assets - (ppe + intangibles + nonCurrentInv + longTermLoans + inventories + tradeReceivables + shortTermLoans);

  const fmt = (val: number) => `₹ ${val.toLocaleString('en-IN')}`;

  // Page 1: Auditor's Report
  const page1 = `## INDEPENDENT AUDITOR'S REPORT
To the Members of **${companyName}**,

### Report on the Standalone Financial Statements
We have audited the accompanying Standalone Financial Statements of **${companyName}** ("the Company"), which comprise the Balance Sheet as at March 31, 2025, the Statement of Profit and Loss, and notes to the financial statements, including a summary of significant accounting policies and other explanatory information.

### Management's Responsibility for the Standalone Financial Statements
The Company's Board of Directors is responsible for the matters stated in Section 134(5) of the Companies Act, 2013 ("the Act") with respect to the preparation of these standalone financial statements that give a true and fair view of the financial position and financial performance of the Company in accordance with the accounting principles generally accepted in India, including the Accounting Standards specified under Section 133 of the Act.

### Auditor's Responsibility
Our responsibility is to express an opinion on these standalone financial statements based on our audit. We have taken into account the provisions of the Act, the accounting and auditing standards and matters which are required to be included in the audit report under the provisions of the Act and the Rules made thereunder. We conducted our audit in accordance with the Standards on Auditing specified under Section 143(10) of the Act.

### Opinion
In our opinion and to the best of our information and according to the explanations given to us, the aforesaid standalone financial statements give the information required by the Act in the manner so required and give a true and fair view in conformity with the accounting principles generally accepted in India, of the state of affairs of the Company as at March 31, 2025.`;

  // Page 2: Standalone Balance Sheet
  const page2 = `# STANDALONE BALANCE SHEET AS AT MARCH 31, 2025
**CIN:** ${meta.cin} | **GSTIN:** ${meta.gstin}

| Particulars | Note No. | As at 31.03.2025 (Current Year) | As at 31.03.2024 (Previous Year) |
| :--- | :---: | ---: | ---: |
| **I. EQUITY AND LIABILITIES** | | | |
| **1. Shareholders' Funds** | | | |
| (a) Share Capital | 1 | ${fmt(shareCapital)} | ${fmt(Math.floor(shareCapital * 0.9))} |
| (b) Reserves and Surplus | 2 | ${fmt(reservesSurplus)} | ${fmt(Math.floor(reservesSurplus * 0.85))} |
| **2. Non-Current Liabilities** | | | |
| (a) Long-term Borrowings | 3 | ${fmt(longTermBorrowings)} | ${fmt(Math.floor(longTermBorrowings * 1.05))} |
| (b) Deferred Tax Liabilities (Net) | 4 | ${fmt(deferredTaxLiab)} | ${fmt(Math.floor(deferredTaxLiab * 0.95))} |
| **3. Current Liabilities** | | | |
| (a) Short-term Borrowings | 5 | ${fmt(shortTermBorrowings)} | ${fmt(Math.floor(shortTermBorrowings * 0.8))} |
| (b) Trade Payables | 6 | ${fmt(tradePayables)} | ${fmt(Math.floor(tradePayables * 0.95))} |
| (c) Short-term Provisions | 7 | ${fmt(shortTermProvs)} | ${fmt(Math.floor(shortTermProvs * 0.9))} |
| **TOTAL EQUITY AND LIABILITIES** | | **${fmt(assets)}** | **${fmt(Math.floor(assets * 0.92))}** |
| | | | |
| **II. ASSETS** | | | |
| **1. Non-Current Assets** | | | |
| (a) Property, Plant and Equipment and Intangible Assets | | | |
| (i) Property, Plant and Equipment | 8 | ${fmt(ppe)} | ${fmt(Math.floor(ppe * 1.02))} |
| (ii) Intangible Assets | 9 | ${fmt(intangibles)} | ${fmt(Math.floor(intangibles * 0.95))} |
| (b) Non-current Investments | 10 | ${fmt(nonCurrentInv)} | ${fmt(Math.floor(nonCurrentInv * 0.85))} |
| (c) Long-term Loans and Advances | 11 | ${fmt(longTermLoans)} | ${fmt(Math.floor(longTermLoans * 1.1))} |
| **2. Current Assets** | | | |
| (a) Inventories | 12 | ${fmt(inventories)} | ${fmt(Math.floor(inventories * 0.95))} |
| (b) Trade Receivables | 13 | ${fmt(tradeReceivables)} | ${fmt(Math.floor(tradeReceivables * 0.88))} |
| (c) Cash and Cash Equivalents | 14 | ${fmt(cashEquiv)} | ${fmt(Math.floor(cashEquiv * 0.75))} |
| (d) Short-term Loans and Advances | 15 | ${fmt(shortTermLoans)} | ${fmt(Math.floor(shortTermLoans * 0.9))} |
| **TOTAL ASSETS** | | **${fmt(assets)}** | **${fmt(Math.floor(assets * 0.92))}** |`;

  // Page 3: Notes 1 to 7
  const page3 = `## NOTES TO STANDALONE FINANCIAL STATEMENTS
Detailed breakdowns of equity and liabilities:

### Note 1: Share Capital
* **Authorized Share Capital**: 5,000,000 Equity Shares of ₹10/- each (Total ₹ 50,000,000)
* **Issued, Subscribed, and Paid-up Capital**: Shares fully paid-up as shown. No shares are held under options or contracts.

### Note 2: Reserves and Surplus
* Securities Premium: ${fmt(Math.floor(reservesSurplus * 0.4))}
* General Reserve: ${fmt(Math.floor(reservesSurplus * 0.2))}
* Surplus (Balance in Statement of Profit & Loss): ${fmt(reservesSurplus - Math.floor(reservesSurplus * 0.6))}

### Note 3: Long-term Borrowings
* Secured Term Loans from HDFC Bank (Hypothecated against fixed assets): ${fmt(Math.floor(longTermBorrowings * 0.8))}
* Unsecured loans from Directors: ${fmt(longTermBorrowings - Math.floor(longTermBorrowings * 0.8))}

### Note 6: Trade Payables Aging Schedule
* Dues of Micro, Small, and Medium Enterprises (MSMEs): ${fmt(Math.floor(tradePayables * 0.25))}
* Dues of creditors other than MSMEs: ${fmt(tradePayables - Math.floor(tradePayables * 0.25))}

| Creditor Classification | < 1 Year | 1 - 2 Years | 2 - 3 Years | > 3 Years | Total |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Undisputed MSME | ${fmt(Math.floor(tradePayables * 0.2))} | ${fmt(Math.floor(tradePayables * 0.05))} | ₹ 0 | ₹ 0 | ${fmt(Math.floor(tradePayables * 0.25))} |
| Undisputed Others | ${fmt(Math.floor(tradePayables * 0.6))} | ${fmt(Math.floor(tradePayables * 0.1))} | ${fmt(Math.floor(tradePayables * 0.05))} | ₹ 0 | ${fmt(tradePayables - Math.floor(tradePayables * 0.25))} |`;

  // Page 4: Fixed Asset Schedule (PPE)
  const page4 = `# SCHEDULE 8: PROPERTY, PLANT AND EQUIPMENT (PPE)
Tangible asset valuation and depreciation schedule as of March 31, 2025:

| Asset Description | Dep. Rate | Gross Block (01.04.24) | Additions | Deductions | Gross Block (31.03.25) | Dep. Up to 31.03.25 | Net Block (31.03.25) | Net Block (31.03.24) |
| :--- | :---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Freehold Land | 0% | ${fmt(Math.floor(ppe * 0.3))} | ₹ 0 | ₹ 0 | ${fmt(Math.floor(ppe * 0.3))} | ₹ 0 | ${fmt(Math.floor(ppe * 0.3))} | ${fmt(Math.floor(ppe * 0.3))} |
| Commercial Buildings | 5% | ${fmt(Math.floor(ppe * 0.4))} | ${fmt(Math.floor(ppe * 0.05))} | ₹ 0 | ${fmt(Math.floor(ppe * 0.45))} | ${fmt(Math.floor(ppe * 0.05))} | ${fmt(Math.floor(ppe * 0.40))} | ${fmt(Math.floor(ppe * 0.38))} |
| Plant & Machinery | 15% | ${fmt(Math.floor(ppe * 0.2))} | ₹ 0 | ₹ 0 | ${fmt(Math.floor(ppe * 0.2))} | ${fmt(Math.floor(ppe * 0.04))} | ${fmt(Math.floor(ppe * 0.16))} | ${fmt(Math.floor(ppe * 0.18))} |
| Office Equipment | 10% | ${fmt(Math.floor(ppe * 0.06))} | ${fmt(Math.floor(ppe * 0.01))} | ₹ 0 | ${fmt(Math.floor(ppe * 0.07))} | ${fmt(Math.floor(ppe * 0.015))} | ${fmt(Math.floor(ppe * 0.055))} | ${fmt(Math.floor(ppe * 0.05))} |
| IT Systems & Computers | 40% | ${fmt(Math.floor(ppe * 0.04))} | ${fmt(Math.floor(ppe * 0.02))} | ₹ 0 | ${fmt(Math.floor(ppe * 0.06))} | ${fmt(Math.floor(ppe * 0.035))} | ${fmt(Math.floor(ppe * 0.025))} | ${fmt(Math.floor(ppe * 0.02))} |
| **TOTAL PROPERTY** | | **${fmt(Math.floor(ppe * 1.0))}** | **${fmt(Math.floor(ppe * 0.08))}** | **₹ 0** | **${fmt(Math.floor(ppe * 1.08))}** | **${fmt(Math.floor(ppe * 0.14))}** | **${fmt(ppe)}** | **${fmt(Math.floor(ppe * 0.93))}** |

### Significant Disclosure Notes
1. No revaluation of Property, Plant and Equipment has been carried out during the current financial year.
2. Title deeds of all immovable properties (other than properties where the company is the lessee and the lease agreements are executed in favor of the lessee) are held in the name of the company.`;

  // Page 5: Receivables aging & audit sign-off
  const page5 = `## NOTE 13: TRADE RECEIVABLES AGING SCHEDULE
Trade Receivables aging summary details:

| Outstanding Period | Less than 6 Months | 6 Months - 1 Year | 1 - 2 Years | 2 - 3 Years | More than 3 Years | Total |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| Undisputed Good | ${fmt(Math.floor(tradeReceivables * 0.7))} | ${fmt(Math.floor(tradeReceivables * 0.15))} | ${fmt(Math.floor(tradeReceivables * 0.1))} | ${fmt(Math.floor(tradeReceivables * 0.05))} | ₹ 0 | ${fmt(tradeReceivables)} |
| Undisputed Doubtful | ₹ 0 | ₹ 0 | ${fmt(Math.floor(tradeReceivables * 0.03))} | ${fmt(Math.floor(tradeReceivables * 0.02))} | ₹ 0 | ${fmt(Math.floor(tradeReceivables * 0.05))} |

---

### SIGN-OFF BLOCK & DISCLOSURE

| Signed on behalf of the Board of Directors | In terms of our report attached |
| :--- | :--- |
| **For ${companyName.toUpperCase()}** | **For ${sigs.caFirm}** |
| | *Chartered Accountants* (FRN: ${sigs.frn}) |
| | |
| *${sigs.dir1}* | *${sigs.caName}* |
| Managing Director (DIN: ${sigs.din1}) | Partner (M. No. ${sigs.caMNo}) |
| | |
| *${sigs.dir2}* | **UDIN: ${sigs.udin}** |
| Director (DIN: ${sigs.din2}) | Date: May 18, 2025 |
| Place: ${meta.city} | Place: ${meta.city} |`;

  return [page1, page2, page3, page4, page5].join('\n---\n');
}

// Generate Profit & Loss Statement (Multi-page separated by \n---\n)
export function generateProfitLossPdf(companyName: string, financialYear: string, seed: number, revenue: number, pat: number): string {
  const meta = getCompanyMeta(companyName, seed);
  const sigs = getAuditSignatures(companyName, seed);
  
  // Calculate intermediate values
  const assets = Math.floor(revenue * 0.8);
  const shareCapital = Math.floor(assets * 0.15);
  const otherIncome = Math.floor(revenue * 0.018);
  const totalRevenue = revenue + otherIncome;
  
  const taxExpense = Math.floor(pat * 0.33); // tax rate + cess approx
  const pbt = pat + taxExpense;
  const totalExpenses = totalRevenue - pbt;
  
  // Expense splitting
  const costOfMaterials = Math.floor(totalExpenses * 0.52);
  const employeeBenefits = Math.floor(totalExpenses * 0.16);
  const financeCosts = Math.floor(totalExpenses * 0.065);
  const depreciation = Math.floor(totalExpenses * 0.045);
  // Other expenses as plug
  const otherExpenses = totalExpenses - (costOfMaterials + employeeBenefits + financeCosts + depreciation);

  const fmt = (val: number) => `₹ ${val.toLocaleString('en-IN')}`;

  // Page 1: Auditor's Review Report
  const page1 = `## INDEPENDENT AUDITOR'S REVIEW REPORT
To the Board of Directors of **${companyName}**,

We have reviewed the accompanying Statement of Standalone Profit and Loss of **${companyName}** ("the Company") for the year ended March 31, 2025. This statement is the responsibility of the Company's Management and has been approved by the Board of Directors. Our responsibility is to issue a report on these financial statements based on our review.

We conducted our review of the Statement in accordance with the Standard on Review Engagements (SRE) 2410, "Review of Interim Financial Information Performed by the Independent Auditor of the Entity", issued by the Institute of Chartered Accountants of India (ICAI). This standard requires that we plan and perform the review to obtain moderate assurance as to whether the financial statements are free of material misstatement.

A review is limited primarily to inquiries of company personnel and analytical procedures applied to financial data and thus provides less assurance than an audit. We have not performed an audit and accordingly, we do not express an audit opinion.`;

  // Page 2: Standalone Statement of Profit and Loss
  const page2 = `# STANDALONE PROFIT & LOSS STATEMENT (FY 2024-25)
**CIN:** ${meta.cin} | **GSTIN:** ${meta.gstin}

| Particulars | Note No. | Year Ended 31.03.2025 (Current Year) | Year Ended 31.03.2024 (Previous Year) |
| :--- | :---: | ---: | ---: |
| **I. Revenue from Operations** | 16 | ${fmt(revenue)} | ${fmt(Math.floor(revenue * 0.88))} |
| **II. Other Income** | 17 | ${fmt(otherIncome)} | ${fmt(Math.floor(otherIncome * 0.9))} |
| **III. Total Revenue (I + II)** | | **${fmt(totalRevenue)}** | **${fmt(Math.floor(totalRevenue * 0.88))}** |
| | | | |
| **IV. Expenses** | | | |
| (a) Cost of Materials Consumed | 18 | ${fmt(costOfMaterials)} | ${fmt(Math.floor(costOfMaterials * 0.85))} |
| (b) Employee Benefits Expense | 19 | ${fmt(employeeBenefits)} | ${fmt(Math.floor(employeeBenefits * 0.9))} |
| (c) Finance Costs | 20 | ${fmt(financeCosts)} | ${fmt(Math.floor(financeCosts * 1.1))} |
| (d) Depreciation and Amortization | 8,9 | ${fmt(depreciation)} | ${fmt(Math.floor(depreciation * 1.02))} |
| (e) Other Expenses | 21 | ${fmt(otherExpenses)} | ${fmt(Math.floor(otherExpenses * 0.85))} |
| **Total Expenses (IV)** | | **${fmt(totalExpenses)}** | **${fmt(Math.floor(totalExpenses * 0.87))}** |
| | | | |
| **V. Profit Before Exceptional Items and Tax (III - IV)** | | **${fmt(pbt)}** | **${fmt(Math.floor(pbt * 0.94))}** |
| (a) Exceptional Items | | ₹ 0 | ₹ 0 |
| **VI. Profit Before Tax (PBT)** | | **${fmt(pbt)}** | **${fmt(Math.floor(pbt * 0.94))}** |
| | | | |
| **VII. Tax Expense** | | | |
| (a) Current Tax | | ${fmt(Math.floor(taxExpense * 0.85))} | ${fmt(Math.floor(taxExpense * 0.82))} |
| (b) Deferred Tax (Credit/Charge) | | ${fmt(taxExpense - Math.floor(taxExpense * 0.85))} | ${fmt(Math.floor((taxExpense - Math.floor(taxExpense * 0.85)) * 0.9))} |
| **VIII. Profit for the Year (PAT) (VI - VII)** | | **${fmt(pat)}** | **${fmt(Math.floor(pat * 0.95))}** |
| | | | |
| **IX. Earnings Per Equity Share (EPS)** | | | |
| (a) Basic (Face value ₹ 10/-) | | ₹ ${(pat / (shareCapital / 10)).toFixed(2)} | ₹ ${((pat * 0.95) / ((shareCapital / 10) * 0.9)).toFixed(2)} |
| (b) Diluted (Face value ₹ 10/-) | | ₹ ${(pat / (shareCapital / 10)).toFixed(2)} | ₹ ${((pat * 0.95) / ((shareCapital / 10) * 0.9)).toFixed(2)} |`;

  // Page 3: Notes to P&L
  const page3 = `## NOTES TO PROFIT AND LOSS STATEMENTS
Operating and expense details:

### Note 16: Revenue from Operations
* Domestics Corporate Consultancy Services: ${fmt(Math.floor(revenue * 0.72))}
* Off-shore Project Support & IT advisory: ${fmt(revenue - Math.floor(revenue * 0.72))}

### Note 17: Other Income
* Interest received on Fixed Deposits: ${fmt(Math.floor(otherIncome * 0.65))}
* Net gain on foreign currency exchange: ${fmt(otherIncome - Math.floor(otherIncome * 0.65))}

### Note 19: Employee Benefits Expense
* Wages, Salaries, and Incentives: ${fmt(Math.floor(employeeBenefits * 0.88))}
* Employer Contribution to Provident Funds (EPF): ${fmt(Math.floor(employeeBenefits * 0.08))}
* Staff Welfare and medical insurance: ${fmt(employeeBenefits - Math.floor(employeeBenefits * 0.96))}

### Note 20: Finance Costs
* Interest paid on Secured Bank Term Loans: ${fmt(Math.floor(financeCosts * 0.85))}
* Processing charges and bank credit commissions: ${fmt(financeCosts - Math.floor(financeCosts * 0.85))}`;

  // Page 4: Other Expenses & Accounting Policies
  const page4 = `## NOTE 21: OTHER EXPENSES & POLICIES
Detailed list of operational overhead costs:

### Other Expenses Breakdowns
* Power & Fuel: ${fmt(Math.floor(otherExpenses * 0.15))}
* Rent (Corporate Office Facilities): ${fmt(Math.floor(otherExpenses * 0.28))}
* Repairs to Office Equipment: ${fmt(Math.floor(otherExpenses * 0.05))}
* Legal & Professional Fees: ${fmt(Math.floor(otherExpenses * 0.24))}
* Office Stationery & Communication Costs: ${fmt(Math.floor(otherExpenses * 0.08))}
* Auditors Remuneration (Statutory Audit Fee): ${fmt(Math.floor(otherExpenses * 0.03))}
* General Marketing & Travelling Expenses: ${fmt(otherExpenses - Math.floor(otherExpenses * 0.83))}

---

### SIGNIFICANT ACCOUNTING POLICIES
1. **Property, Plant and Equipment**: PPE are stated at cost, net of accumulated depreciation and accumulated impairment losses, if any. Cost includes purchase price, taxes and directly attributable costs of bringing the asset to its working condition.
2. **Depreciation Methods**: Depreciation on Property, Plant and Equipment is provided on the Written Down Value (WDV) method over the useful lives of the assets as prescribed in Schedule II of the Companies Act, 2013.`;

  // Page 5: Sign-off block
  const page5 = `## DISCLOSURES & SIGN-OFFS

### Note 22: Auditors Remuneration details
* For Statutory Audit: ₹ 1,50,000
* For Tax Audit: ₹ 50,000
* For Reimbursement of out-of-pocket expenses: ₹ 15,000

---

| Signed on behalf of the Board of Directors | In terms of our report attached |
| :--- | :--- |
| **For ${companyName.toUpperCase()}** | **For ${sigs.caFirm}** |
| | *Chartered Accountants* (FRN: ${sigs.frn}) |
| | |
| *${sigs.dir1}* | *${sigs.caName}* |
| Managing Director (DIN: ${sigs.din1}) | Partner (M. No. ${sigs.caMNo}) |
| | |
| *${sigs.dir2}* | **UDIN: ${sigs.udin}** |
| Director (DIN: ${sigs.din2}) | Date: May 18, 2025 |
| Place: ${meta.city} | Place: ${meta.city} |`;

  return [page1, page2, page3, page4, page5].join('\n---\n');
}

// Generate specific PDF for 26 Modules (Multi-page separated by \n---\n)
export function generateModulePdf(moduleLabel: string, companyName: string, financialYear: string, seed: number, revenue: number, pat: number, assets: number): string {
  const meta = getCompanyMeta(companyName, seed);
  const sigs = getAuditSignatures(companyName, seed);
  const fmt = (val: number) => `₹ ${val.toLocaleString('en-IN')}`;

  const cleanLabel = moduleLabel.toLowerCase();
  
  if (cleanLabel.includes('gst reconciliation') || cleanLabel.includes('gstr-2b')) {
    // GST Reconciliation
    const totalITC = Math.floor(revenue * 0.12);
    const booksITC = totalITC;
    const gstr2bITC = Math.floor(totalITC * 0.985);
    const diff = booksITC - gstr2bITC;
    const suppliers = getSupplierList(seed);

    const page1 = `# INPUT TAX CREDIT RECONCILIATION AUDIT (GSTR-2B VS BOOKS)
**CLIENT:** ${companyName} | **GSTIN:** ${meta.gstin}
**PERIOD:** Fiscal Year ${financialYear}

---

## 1. EXECUTIVE SUMMARY
This statutory reconciliation audit statement evaluates the eligible Input Tax Credit (ITC) as declared in the purchase registers (Books of Accounts) of **${companyName}** against the dynamic invoices auto-drafted and populated on the government portal in **Form GSTR-2B** by corresponding suppliers.

A mismatch of **${((diff / booksITC) * 100).toFixed(2)}%** is observed, which falls within standard transactional timing thresholds but requires active vendor follow-up for the unresolved components.

---

## 2. ITC COMPILATION AND AGGREGATIONS

| Component Code | Particulars | ITC per Books (A) | ITC per GSTR-2B (B) | Variance (A - B) | Actionable Status |
| :---: | :--- | ---: | ---: | ---: | :---: |
| **01** | CGST (Central Tax) | ${fmt(Math.floor(booksITC * 0.25))} | ${fmt(Math.floor(gstr2bITC * 0.25))} | ${fmt(Math.floor(diff * 0.25))} | Reconciliation Pending |
| **02** | SGST (State Tax) | ${fmt(Math.floor(booksITC * 0.25))} | ${fmt(Math.floor(gstr2bITC * 0.25))} | ${fmt(Math.floor(diff * 0.25))} | Reconciliation Pending |
| **03** | IGST (Integrated Tax) | ${fmt(Math.floor(booksITC * 0.5))} | ${fmt(Math.floor(gstr2bITC * 0.5))} | ${fmt(Math.floor(diff * 0.5))} | Immediate Vendor Action |
| **04** | Compensation Cess | ₹ 0 | ₹ 0 | ₹ 0 | Fully Reconciled |
| | **TOTAL TAX ELIGIBILITY** | **${fmt(booksITC)}** | **${fmt(gstr2bITC)}** | **${fmt(diff)}** | **Net Variance** |`;

    const page2 = `## SUPPLIER-WISE VARIANCE DETAILS (TOP TRANSACTIONS)
The following invoices are captured in the books of accounts of **${companyName}** but are missing or discrepant in GSTR-2B:

| Supplier GSTIN | Trade Name of Supplier | Invoice Number | Invoice Date | Tax Type | Invoice Value | ITC Variance | Reason Code / Status |
| :---: | :--- | :---: | :---: | :---: | ---: | ---: | :--- |
| ${suppliers[0].gstin} | ${suppliers[0].name} | NT/24-25/1192 | 12-Nov-2024 | IGST | ₹ 1,250,000 | ₹ 225,000 | Invoices not uploaded by Vendor |
| ${suppliers[1].gstin} | ${suppliers[1].name} | DL/24/49108 | 24-Dec-2024 | CGST+SGST | ₹ 380,000 | ₹ 68,400 | Vendor filed late after GSTR-2B lock |
| ${suppliers[2].gstin} | ${suppliers[2].name} | PSI/25/082 | 08-Jan-2025 | IGST | ₹ 450,000 | ₹ 81,000 | GSTIN suspended on portal |

---

### Reason Code Definitions:
1. **Invoices not uploaded by Vendor**: Invoices recorded in company books but supplier failed to file their respective GSTR-1 for the month. Action: Supplier notice to be issued automatically.
2. **Vendor filed late**: Supplier failed to file after the 11th of the succeeding month; ITC will be deferred to the subsequent month's GSTR-2B.
3. **GSTIN suspended**: Supply registers blocked due to tax non-compliance. Tax must be reversed or withheld.`;

    const page3 = `## AUDITOR RECOMMENDATIONS & STATUTORY OPINION

Based on the reconciliation, the following statutory steps are recommended to safeguard Input Tax Credit under CGST Rules:

* **Rule 37A Compliance**: Instruct the procurement department to withhold payments amounting to **${fmt(Math.floor(diff * 1.5))}** for suppliers defaulting on tax filings.
* **Auto Notice Dispatch**: Draft response notices to default suppliers demanding upload of invoices.
* **GSTR-9 Reporting**: Unreconciled ITC must be flagged in Table 8 of GSTR-9 annual returns.

---

**Auditing Lead Firm:** M/s ${sigs.caFirm}, Chartered Accountants  
**Verification Stamp:** DIGITAL SECURE LOCK GENERATED  
**Audit Supervisor:** Swarm Compliance Bot #${seed % 9}`;

    return [page1, page2, page3].join('\n---\n');
  }
  
  if (cleanLabel.includes('income tax calculation') || cleanLabel.includes('tax calculation')) {
    // Income Tax Calculation
    const taxPayable = Math.floor(pat * 0.25);
    const bookProfit = pat + Math.floor(pat * 0.33);

    const page1 = `# INCOME TAX COMPUTATION SHEET (A.Y. 2025-26)
**CLIENT:** ${companyName} | **PAN:** ${meta.pan}  
**ASSESSMENT YEAR:** 2025-26 (Financial Year 2024-25)

---

## 1. STATEMENT OF COMPUTATION OF TOTAL INCOME & TAX LIABILITY

| Particulars | Schedule | Amount (Normal Tax Scheme) | Amount (New Regime Sec 115BAA) |
| :--- | :---: | ---: | ---: |
| **Profit Before Tax (as per P&L)** | A | ${fmt(bookProfit)} | ${fmt(bookProfit)} |
| *Add: Disallowances under Sec 37 / 43B* | | | |
| (a) Provision for Bad & Doubtful Debts | | ${fmt(Math.floor(pat * 0.05))} | ${fmt(Math.floor(pat * 0.05))} |
| (b) Depreciation as per Books | B | ${fmt(Math.floor(pat * 0.12))} | ${fmt(Math.floor(pat * 0.12))} |
| (c) Unpaid Bonus/Gratuity (outstanding) | | ${fmt(Math.floor(pat * 0.03))} | ${fmt(Math.floor(pat * 0.03))} |
| *Less: Allowable Deductions / Incentives* | | | |
| (a) Depreciation as per Income Tax Rules | B | -${fmt(Math.floor(pat * 0.15))} | -${fmt(Math.floor(pat * 0.15))} |
| (b) Deduction under Sec 80JJAA (New Employees) | C | -${fmt(Math.floor(pat * 0.04))} | ₹ 0 (Disallowed in 115BAA) |
| **Gross Total Income (GTI)** | | **${fmt(bookProfit + Math.floor(pat * 0.01))}** | **${fmt(bookProfit + Math.floor(pat * 0.05))}** |
| *Less: Chapter VI-A Deductions (80G, etc.)* | | -${fmt(Math.floor(pat * 0.02))} | ₹ 0 (Disallowed in 115BAA) |
| **Total Taxable Income** | | **${fmt(bookProfit - Math.floor(pat * 0.01))}** | **${fmt(bookProfit + Math.floor(pat * 0.05))}** |`;

    const page2 = `## 2. DETAIL STATEMENT OF DEPRECIATION AND MAT CALCULATIONS
Comparing depreciation schedules under Companies Act vs Income Tax Act, 1961:

* **Depreciation as per IT Act (Section 32)**: Provided on block of assets at accelerated rates (e.g., computers at 40%, plant machinery at 15%). Total allowable deduction matches the computed amount.
* **Section 115JB (Minimum Alternate Tax)**: 
  * Book Profit under MAT: ${fmt(bookProfit)}
  * MAT Rate: 15% plus surcharge & cess.
  * MAT Tax Payable: ${fmt(Math.floor(bookProfit * 0.156))}
  
### Alternative Tax Regime Comparison:
* Under Normal Tax Regime (inclusive of MAT liability and credit): Effective tax rate is 29.12%.
* Under Section 115BAA (Concessional Scheme): Effective tax rate is 25.17% flat. MAT is completely exempted, reducing regulatory friction.`;

    const page3 = `## 3. FINAL TAX LIABILITY AND STATUTORY SIGN-OFF
Concessional Tax computation details:

| Particulars | Normal Scheme | Sec 115BAA (Opted) |
| :--- | ---: | ---: |
| **Tax on Total Income** | ${fmt(Math.floor(bookProfit * 0.25))} | ${fmt(Math.floor((bookProfit + Math.floor(pat * 0.05)) * 0.22))} |
| Add: Surcharge (7% / 10%) | ${fmt(Math.floor(bookProfit * 0.25 * 0.07))} | ${fmt(Math.floor((bookProfit + Math.floor(pat * 0.05)) * 0.22 * 0.1))} |
| Add: Health & Education Cess (4%) | ${fmt(Math.floor(bookProfit * 0.25 * 1.07 * 0.04))} | ${fmt(Math.floor((bookProfit + Math.floor(pat * 0.05)) * 0.22 * 1.1 * 0.04))} |
| **TOTAL TAX PAYABLE** | **${fmt(Math.floor(bookProfit * 0.25 * 1.07 * 1.04))}** | **${fmt(taxPayable)}** |

---

**For ${sigs.caFirm}**  
*${sigs.caName}* (Partner)  
Membership No: ${sigs.caMNo}  
**UDIN: ${sigs.udin}**`;

    return [page1, page2, page3].join('\n---\n');
  }

  if (cleanLabel.includes('mca') || cleanLabel.includes('form 20-b')) {
    // MCA Form 20-B Extract
    const cap = Math.floor(assets * 0.15);
    const page1 = `# MCA FORM 20-B: REGISTRY ANNUAL RETURN DETAILS
**COMPANY NAME:** ${companyName} | **CIN:** ${meta.cin}

---

## 1. CAPITAL STRUCTURE & REGISTRATION
* **Authorized Share Capital**: 5,000,000 Equity Shares of ₹10/- each (Total ₹ 50,000,000)
* **Issued & Paid-Up Capital**: ${(cap / 10).toLocaleString('en-IN')} Equity Shares of ₹10/- each (Total ${fmt(cap)})
* **Paid-Up Equity Ratio**: 100% Fully Paid

### Detailed Shareholding Registry

| Shareholder Category | Number of Shares | Nominal Value | Percentage Holding |
| :--- | ---: | ---: | ---: |
| Promoters & Promoter Group | ${(cap * 0.72 / 10).toLocaleString('en-IN')} | ${fmt(Math.floor(cap * 0.72))} | 72.00% |
| Domestic Corporate Bodies | ${(cap * 0.18 / 10).toLocaleString('en-IN')} | ${fmt(Math.floor(cap * 0.18))} | 18.00% |
| Retail Public Shareholders | ${(cap * 0.10 / 10).toLocaleString('en-IN')} | ${fmt(Math.floor(cap * 0.10))} | 10.00% |
| **TOTAL** | **${(cap / 10).toLocaleString('en-IN')}** | **${fmt(cap)}** | **100.00%** |`;

    const page2 = `## 2. DETAILS OF CORPORATE INDEBTEDNESS
Statement of secured and unsecured credit facilities as of March 31, 2025:

* **Secured Loans (excluding deposits)**: ${fmt(Math.floor(assets * 0.15))} (Hypothecated against Land, Building & Machinery assets)
* **Unsecured Loans (from Promoters/Directors)**: ${fmt(Math.floor(assets * 0.07))}
* **Short-Term Cash Credits & Overdrafts**: ${fmt(Math.floor(assets * 0.05))}
* **Total Outstanding Indebtedness**: **${fmt(Math.floor(assets * 0.27))}**

---

### Charge Registry Mapping (Registrar of Companies)
1. **Charge ID: 10082491**: Registered on 14-Aug-2018 in favor of HDFC Bank for secured term credit. Status: Open.
2. **Charge ID: 10098201**: Registered on 12-Nov-2022 in favor of ICICI Bank for working capital cash credit limit. Status: Open.`;

    const page3 = `## 3. DIRECTORS & KEY MANAGERIAL PERSONNEL (KMP) REGISTER

| DIN | Name of Director | Designation | Appointment Date | DIR-3 KYC Status |
| :---: | :--- | :---: | :---: | :---: |
| ${sigs.din1} | ${sigs.dir1} | Managing Director | 12-Jun-2015 | Verified / Compliant |
| ${sigs.din2} | ${sigs.dir2} | Executive Director | 01-Sep-2018 | Verified / Compliant |
| 09432810 | ${sigs.caName} | Independent Director | 15-Mar-2021 | Verified / Compliant |

---

**MCA Compliance Officer Stamp:** e-Form 20-B compiled under G2C compliance pipeline.  
**Verification Stamp:** RoC-${meta.city} filed.`;

    return [page1, page2, page3].join('\n---\n');
  }

  if (cleanLabel.includes('payroll tds') || cleanLabel.includes('24q')) {
    // Payroll TDS (Form 24Q)
    const employees = 10 + (seed % 150);
    const totalSalary = Math.floor(revenue * 0.12);
    const tdsDeducted = Math.floor(totalSalary * 0.085);

    const page1 = `# FORM 24Q: QUARTERLY SALARY TDS AUDIT DOCK
**EMPLOYER:** ${companyName} | **TAN:** ${meta.tan}
**PERIOD:** Q4 (Quarter Ended March 31, 2025)

---

## 1. DEDUCTOR SUMMARY
* **Total Employees on Roll**: ${employees}
* **Employees subject to Tax Deduction (Sec 192)**: ${Math.floor(employees * 0.35)}
* **Gross Salary Disbursed for the Quarter**: ${fmt(Math.floor(totalSalary / 4))}
* **Total TDS Deducted & Deposited**: **${fmt(Math.floor(tdsDeducted / 4))}**

---

## 2. QUARTERLY TDS CHALLAN MAPPING

| Challan Date | Serial No | BSR Code | Challan Identification No (CIN) | Amount Paid | Interest/Fees | Status |
| :---: | :---: | :---: | :---: | ---: | ---: | :---: |
| 07-Jan-2025 | CH0012 | 0210243 | 02102430701254910 | ${fmt(Math.floor(tdsDeducted / 12))} | ₹ 0 | Cleared |
| 07-Feb-2025 | CH0013 | 0210243 | 02102430702251029 | ${fmt(Math.floor(tdsDeducted / 12))} | ₹ 0 | Cleared |
| 07-Mar-2025 | CH0014 | 0210243 | 02102430703259834 | ${fmt(Math.floor(tdsDeducted / 12))} | ₹ 0 | Cleared |
| 05-Apr-2025 | CH0015 | 0210243 | 02102430504251094 | ${fmt(Math.floor(tdsDeducted / 12))} | ₹ 0 | Cleared |`;

    const employeesList = getEmployeeList(seed);

    const page2 = `## 3. INDIVIDUAL DEDUCTION SUMMARY (SAMPLE EMPLOYEES)
Reconciliation of TDS deposited per employee PAN against Form 26AS:

| PAN | Name of Employee | Gross Salary (FY) | Deductions (Sec 80C) | Net Taxable Income | TDS Deducted (FY) |
| :---: | :--- | ---: | ---: | ---: | ---: |
| ${employeesList[0].pan} | ${employeesList[0].name} | ₹ 1,800,000 | ₹ 150,000 | ₹ 1,650,000 | ₹ 242,500 |
| ${employeesList[1].pan} | ${employeesList[1].name} | ₹ 1,450,000 | ₹ 150,000 | ₹ 1,300,000 | ₹ 134,200 |
| ${employeesList[2].pan} | ${employeesList[2].name} | ₹ 950,000 | ₹ 120,000 | ₹ 830,000 | ₹ 41,500 |

---

**Auditing Lead:** SANNIDH HR Tax Swarm Bot  
**CPC-TDS Verification Receipt:** CPC-24Q-Q4-SUCCESS`;

    return [page1, page2].join('\n---\n');
  }

  if (cleanLabel.includes('epf & esi') || cleanLabel.includes('epf')) {
    // EPF & ESI Auto-Calc
    const liability = 50000 + (seed % 100000);
    const epfShare = Math.floor(liability * 0.72);
    const esiShare = liability - epfShare;

    const page1 = `# STATUTORY CONTRIBUTIONS REPORT: EPF & ESI
**COMPANY:** ${companyName} | **EPF REGISTRATION NO:** ${meta.state}${meta.cin.slice(0, 3)}0012948000
**ESI CODE NUMBER:** ${meta.stateCode || '27'}001948200001001

---

## 1. COMPILATION OF CONTRIBUTION WAGES

* **Total Contribution Base Wages**: ${fmt(liability * 8)}
* **Employees Covered under EPF (Salary Limit <₹15,000)**: 45
* **Employees Covered under ESI (Salary Limit <₹21,000)**: 78
* **Total EPF Liability (Employer 12% + Employee 12% + Admin)**: **${fmt(epfShare)}**
* **Total ESI Liability (Employer 3.25% + Employee 0.75%)**: **${fmt(esiShare)}**

---

## 2. MONTHLY CONTRIBUTION & CHALLAN TRRN DATA

| Month | EPF Challan TRRN | EPF Paid Amount | ESI Receipt Number | ESI Paid Amount | Payment Date | Status |
| :---: | :--- | ---: | :---: | ---: | :---: | :---: |
| Jan 2025 | 2912401928340 | ${fmt(Math.floor(epfShare / 3))} | ESI-J25-10294 | ${fmt(Math.floor(esiShare / 3))} | 14-Feb-2025 | Success |
| Feb 2025 | 2912401959821 | ${fmt(Math.floor(epfShare / 3))} | ESI-F25-83241 | ${fmt(Math.floor(esiShare / 3))} | 15-Mar-2025 | Success |
| Mar 2025 | 2912401994820 | ${fmt(Math.floor(epfShare / 3))} | ESI-M25-09834 | ${fmt(Math.floor(esiShare / 3))} | 14-Apr-2025 | Success |`;

    const page2 = `## 3. AUDIT NOTES & STATUTORY LIABILITIES
Provident Fund and Employees' State Insurance audit compliance checks:

1. **Due Date Compliance**: All monthly deposits have been completed on or before the due date (15th of the succeeding month). No penal damages under Section 14B or interest under Section 7Q of the EPF Act are applicable.
2. **ECR Reconciliation**: Reconciliation indicates no discrepancy between payroll registers and PF electronic challan-cum-return (ECR).

---

**Auditing HR Lead:** SANNIDH HR Swarm Agent  
**Verification ID:** SECURE-EPF-ESI-SUCCESS`;

    return [page1, page2].join('\n---\n');
  }

  if (cleanLabel.includes('debtors aging') || cleanLabel.includes('debtors')) {
    // Debtors Aging
    const outstanding = Math.floor(revenue * 0.15);
    const current = Math.floor(outstanding * 0.45);
    const days30 = Math.floor(outstanding * 0.28);
    const days60 = Math.floor(outstanding * 0.15);
    const days90 = Math.floor(outstanding * 0.08);
    const days180 = outstanding - (current + days30 + days60 + days90);

    const debtors = getDebtorsList(seed);

    const page1 = `# TRADE RECEIVABLES AGING ANALYSIS (ECL PROVISIONING)
**CLIENT:** ${companyName} | **AS AT DATE:** March 31, 2025

---

## 1. AGING MATRIX BY DEBT TYPE (₹ IN RUPEES)

| Category / Debtor Name | Total Due | Not Due | 0 - 30 Days | 31 - 60 Days | 61 - 90 Days | 90 - 180 Days | >180 Days |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **A. Unsecured, Considered Good** | | | | | | | |
| ${debtors[0]} | ${fmt(Math.floor(outstanding * 0.35))} | ${fmt(Math.floor(current * 0.4))} | ${fmt(Math.floor(days30 * 0.3))} | ${fmt(Math.floor(days60 * 0.4))} | ${fmt(Math.floor(days90 * 0.3))} | ₹ 0 | ₹ 0 |
| ${debtors[1]} | ${fmt(Math.floor(outstanding * 0.28))} | ${fmt(Math.floor(current * 0.3))} | ${fmt(Math.floor(days30 * 0.4))} | ${fmt(Math.floor(days60 * 0.2))} | ${fmt(Math.floor(days90 * 0.4))} | ₹ 0 | ₹ 0 |
| ${debtors[2]} | ${fmt(Math.floor(outstanding * 0.22))} | ${fmt(Math.floor(current * 0.3))} | ${fmt(Math.floor(days30 * 0.2))} | ${fmt(Math.floor(days60 * 0.3))} | ${fmt(Math.floor(days90 * 0.2))} | ${fmt(Math.floor(days180 * 0.4))} | ₹ 0 |
| **B. Unsecured, Doubtful (ECL)** | | | | | | | |
| ${debtors[3]} | ${fmt(outstanding - Math.floor(outstanding * 0.85))} | ₹ 0 | ₹ 0 | ₹ 0 | ₹ 0 | ${fmt(Math.floor(days180 * 0.5))} | ${fmt(Math.floor(days180 * 0.5))} |
| **TOTAL TRADE RECEIVABLES** | **${fmt(outstanding)}** | **${fmt(current)}** | **${fmt(days30)}** | **${fmt(days60)}** | **${fmt(days90)}** | **${fmt(Math.floor(days180 * 0.5))}** | **${fmt(Math.floor(days180 * 0.5))}** |
| *ECL Provisioning (Rate)* | *₹ ${Math.floor(days180 * 0.2)}* | *0.00%* | *0.50%* | *1.50%* | *3.00%* | *10.00%* | *50.00%* |`;

    const page2 = `## 2. EXPECTED CREDIT LOSS (ECL) PROVISIONING POLICY
Detailed review of debtor collections and bad debt provisioning under Ind AS 109:

* **ECL Provisions Allocated**: ₹ ${Math.floor(days180 * 0.2).toLocaleString('en-IN')} (deducted in Balance Sheet asset total)
* **Average Collection Period (DSO)**: 45.2 Days
* **Auditor Recommendation**: ${debtors[3]} has defaulted on payment schedules. Send legal notice for recovering the outstanding ₹ ${Math.floor(days180 * 0.5).toLocaleString('en-IN')}.

---

**For ${sigs.caFirm}**  
*${sigs.caName}* (Partner)  
Membership No: ${sigs.caMNo}  
**UDIN: ${sigs.udin}**`;

    return [page1, page2].join('\n---\n');
  }

  if (cleanLabel.includes('capital gains')) {
    // Capital Gains Auto-Index
    const cost = 2500000 + (seed % 1000000);
    const sale = cost + 1500000 + (seed % 500000);
    const acquisitionCII = 137; // FY 2008-09
    const saleCII = 363; // FY 2024-25
    const indexedCost = Math.floor(cost * (saleCII / acquisitionCII));
    const ltcg = sale - indexedCost;

    const page1 = `# LONG-TERM CAPITAL GAINS COMP-SHEET (FY 2024-25)
**CLIENT:** ${companyName} | **PAN:** ${meta.pan}  
**ASSET CLASS:** Long-Term Capital Asset (Industrial Building & Land)

---

## 1. CALCULATION OF CAPITAL GAIN LIABILITY

| Particulars | Section | CII Reference | Calculations | Amount |
| :--- | :---: | :---: | :---: | ---: |
| **Full Value of Consideration (Sale Price)** | Sec 48 | | Registered Deed | ${fmt(sale)} |
| *Less: Transfer Brokerage Fees (1%)* | Sec 48 | | | -${fmt(Math.floor(sale * 0.01))} |
| **Net Sale Consideration** | | | | **${fmt(sale - Math.floor(sale * 0.01))}** |
| | | | | |
| *Less: Indexed Cost of Acquisition* | Sec 48 | | | |
| Purchase Cost Price (FY 2008-09) | | 137 | Actual purchase | ${fmt(cost)} |
| Cost Inflation Index (Sale FY 2024-25) | | 363 | Govt Table | |
| **Indexed Acquisition Cost** | | | **${cost.toLocaleString('en-IN')} × 363 ÷ 137** | **-${fmt(indexedCost)}** |
| **LONG-TERM CAPITAL GAIN (LTCG)** | **Sec 45** | | | **${fmt(ltcg)}** |
| **LTCG Tax Payable (at 20% flat)** | **Sec 112** | | | **${fmt(Math.floor(ltcg * 0.2))}** |`;

    const page2 = `## 2. TAX-REINVESTMENT STRATEGY & DISCLOSURES
Options for capital gains exemption under Section 54EC / 54F:

* **Section 54EC Reinvestment Option**: The company can reinvest the taxable capital gains (up to **₹ 5,000,000**) in NHAI or REC capital bonds within 6 months of the transfer date. This will reduce the tax liability of **${fmt(Math.floor(ltcg * 0.2))}** to zero.
* **Audit status**: Certified and indexation factors applied as per Central Board of Direct Taxes (CBDT) notifications.

---

**Auditing Lead:** SANNIDH Tax Swarm Bot  
**Verification Code:** LTCG-TAX-OK-2425`;

    return [page1, page2].join('\n---\n');
  }

  if (cleanLabel.includes('board resolution')) {
    // Board Resolution Repository
    const page1 = `# CERTIFIED TRUE COPY OF THE RESOLUTION PASSED AT THE BOARD MEETING OF ${companyName.toUpperCase()}
**HELD ON:** Thursday, April 18, 2025, at 11:00 AM  
**AT THE REGISTERED OFFICE:** ${meta.address}

---

### SUBJECT: APPROVAL OF STANDALONE AUDITED FINANCIAL STATEMENTS FOR FY 2024-25

**"RESOLVED THAT** the Draft Standalone Financial Statements of the Company for the financial year ended March 31, 2025, including the Balance Sheet as at March 31, 2025, the Profit and Loss Account, and the notes and schedules attached thereto, as placed before the meeting, be and are hereby approved and adopted."

**"RESOLVED FURTHER THAT** Mr. ${sigs.dir1}, Managing Director (DIN: ${sigs.din1}) and Mrs. ${sigs.dir2}, Director (DIN: ${sigs.din2}), be and are hereby authorized to sign the Standalone Financial Statements on behalf of the Board of Directors."

**"RESOLVED FURTHER THAT** the Auditor's Report issued by M/s ${sigs.caFirm}, Chartered Accountants, on the standalone financial statements for the year ended March 31, 2025, be and is hereby taken on record and noted."

**"RESOLVED FURTHER THAT** any Director of the Company or the Company Secretary be and is hereby authorized to file the necessary e-forms (specifically AOC-4 and MGT-7) with the Registrar of Companies (RoC)."

---

*Certified True Copy,*  
**For ${companyName.toUpperCase()}**  

*Signed,*  
**${sigs.dir1}**  
Chairman / Managing Director (DIN: ${sigs.din1})`;

    return [page1].join('\n---\n');
  }

  if (cleanLabel.includes('agm minutes') || cleanLabel.includes('agm')) {
    // AGM Minutes Tracking
    const page1 = `# MINUTES OF THE 10TH ANNUAL GENERAL MEETING OF SHAREHOLDERS OF ${companyName.toUpperCase()}
**DATE:** September 28, 2025 | **TIME:** 10:00 AM  
**VENUE:** Grand Plaza Ballroom, Financial District, ${meta.city}

---

## 1. PRESENT IN MEETING
* **Directors Present:**
  * Mr. ${sigs.dir1} (Managing Director - Chairman)
  * Mrs. ${sigs.dir2} (Executive Director)
  * ${sigs.caName} (Independent Director - Audit Committee Chair)
* **Auditors Present:**
  * ${sigs.caName} representing M/s ${sigs.caFirm}, Statutory Auditors
* **Members Present:**
  * 12 members holding a total of ${(Math.floor(assets * 0.15) * 0.9 / 10).toLocaleString('en-IN')} Equity Shares (Representing 90.0% of Paid-up Capital).

---

## 2. CONVENING OF THE MEETING
Mr. ${sigs.dir1} took the chair. Having confirmed that a valid quorum was present under Section 103 of the Companies Act, 2013, the Chairman declared the meeting open.

## 3. PROCEEDINGS & RESOLUTIONS PASSED

### Item No 1: Adoption of Audited Standalone Financial Statements
"RESOLVED THAT the audited standalone Balance Sheet as at March 31, 2025, and the Statement of Profit and Loss for the year ended on that date, together with the Board's Report and Auditor's Report, be and are hereby adopted."  
*Passed unanimously as an Ordinary Resolution.*

---

*Confirmed by,*  
**${sigs.dir1}**  
Chairman of the AGM`;

    return [page1].join('\n---\n');
  }

  if (cleanLabel.includes('din/tan') || cleanLabel.includes('din') || cleanLabel.includes('renewal')) {
    // DIN/TAN Renewal
    const page1 = `# COMPLIANCE REGISTER: DIRECTOR KYC AND TAN STATUS
**COMPANY:** ${companyName} | **TAN:** ${meta.tan}

---

## 1. DIN KYC (DIR-3 KYC) STATUTORY VERIFICATION

Under Section 154 of the Companies Act, 2013 read with Rule 12A of the Companies Rules, every director holding a DIN as of March 31st must file DIR-3 KYC by September 30th of the succeeding year.

| Director Name | DIN | KYC Filing Date | Government Acknowledgement SRN | Status |
| :--- | :---: | :---: | :---: | :---: |
| ${sigs.dir1} | ${sigs.din1} | 14-May-2025 | H291048201 | **ACTIVE / APPROVED** |
| ${sigs.dir2} | ${sigs.din2} | 14-May-2025 | H291048298 | **ACTIVE / APPROVED** |

---

## 2. TAN STATUS & GST DEPOSIT MAPPING
* **Tax Deduction Account Number (TAN)**: ${meta.tan} (Registered for Category: Corporate Deductor)
* **Assigned Jurisdictional Officer**: ITO TDS Ward 3(1), ${meta.city}
* **Traces Portal Linkage**: Established (Verification Token Active)
* **Form 26AS Real-Time Sync**: Successfully reconciled against vendor declarations.

---

**Filing Officer:** SANNIDH Sovereign Agent #1  
**Filing Stamp:** RO-KYC-TAN-CLEARED`;

    return [page1].join('\n---\n');
  }

  if (cleanLabel.includes('advance tax')) {
    // Advance Tax Predictor
    const totalTax = Math.floor(pat * 0.25);
    const page1 = `# ADVANCE TAX LIABILITY ESTIMATES AND STATUTORY PAYMENT SCHEDULE
**CLIENT:** ${companyName} | **PAN:** ${meta.pan}  
**ESTIMATED INCOME TAX LIABILITY:** ${fmt(totalTax)}

---

## 1. ADVANCE TAX STATUTORY INSTALMENT SCHEDULE (SEC 211)

Under Section 211 of the Income Tax Act, 1961, every corporate assessee is required to pay advance tax in four instalments during the financial year:

| Installment Due Date | Statutory Cumulative % | Target Tax Liability | Actual Amount Deposited | Challan BSR/Challan Serial | Payment Date | Status |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **June 15, 2024** | 15% | ${fmt(Math.floor(totalTax * 0.15))} | ${fmt(Math.floor(totalTax * 0.15))} | 0210204 / 00182 | 14-Jun-2024 | Paid |
| **Sep 15, 2024** | 45% | ${fmt(Math.floor(totalTax * 0.45))} | ${fmt(Math.floor(totalTax * 0.30))} | 0210204 / 00921 | 15-Sep-2024 | Paid |
| **Dec 15, 2024** | 75% | ${fmt(Math.floor(totalTax * 0.75))} | ${fmt(Math.floor(totalTax * 0.30))} | 0210204 / 01824 | 14-Dec-2024 | Paid |
| **March 15, 2025** | 100% | ${fmt(totalTax)} | ${fmt(Math.floor(totalTax * 0.25))} | 0210204 / 02941 | 15-Mar-2025 | Paid |

---

## 2. INTEREST ACCRUAL ASSESSMENT (SEC 234B & 234C)
* **Section 234C Interest**: ₹ 0 (All installments met the statutory percentages of 15%, 45%, 75%, and 100% respectively).
* **Section 234B Interest**: ₹ 0 (Over 90% of the total tax liability was deposited prior to March 31, 2025).

---

**Auditing Lead:** SANNIDH Tax Bot #2  
**E-Filing Verification Receipt:** IT-AT-2425-90124801`;

    return [page1].join('\n---\n');
  }

  if (cleanLabel.includes('deferred tax')) {
    // Deferred Tax Schedule
    const dta = 10000 + (seed % 20000);
    const page1 = `# STATUTORY COMPUTATION: DEFERRED TAX SCHEDULE (IND AS 12)
**CLIENT:** ${companyName} | **AS AT DATE:** March 31, 2025

---

## 1. STATEMENT OF DEFERRED TAX ASSET / (LIABILITY)

| Source of Timing Difference | Book Carrying Amount | Tax Base Base Value | Cumulative Timing Difference | Tax Effect (DTA / DTL) |
| :--- | :---: | :---: | :---: | ---: |
| **A. Property, Plant and Equipment (PPE)** | | | | |
| Depreciation difference (IT vs Books) | ${fmt(Math.floor(assets * 0.42))} | ${fmt(Math.floor(assets * 0.40))} | ₹ ${Math.floor(assets * 0.02).toLocaleString('en-IN')} (DTL) | -${fmt(Math.floor(assets * 0.02 * 0.25))} |
| | | | | |
| **B. Disallowances under Sec 43B / Provisions** | | | | |
| (a) Provision for Doubtful Debtors | ${fmt(Math.floor(assets * 0.02))} | ₹ 0 | ₹ ${Math.floor(assets * 0.02).toLocaleString('en-IN')} (DTA) | ${fmt(Math.floor(assets * 0.02 * 0.25))} |
| (b) Unpaid Employee Bonus / Gratuity | ${fmt(Math.floor(assets * 0.01))} | ₹ 0 | ₹ ${Math.floor(assets * 0.01).toLocaleString('en-IN')} (DTA) | ${fmt(Math.floor(assets * 0.01 * 0.25))} |
| (c) Preliminary Expenses (Sec 35D) | ${fmt(Math.floor(assets * 0.005))} | ₹ 0 | ₹ ${Math.floor(assets * 0.005).toLocaleString('en-IN')} (DTA) | ${fmt(dta)} |
| **NET DEFERRED TAX ASSET** | | | | **${fmt(dta)}** |

---

## 2. JOURNAL ENTRIES MAPPED IN BOOKS
\`\`\`text
Deferred Tax Asset A/c                     Dr.  ${fmt(dta)}
  To Statement of Profit and Loss (Credit)                 ${fmt(dta)}
(Being recognition of net deferred tax assets on timing differences for the fiscal year ended March 31, 2025)
\`\`\`

---

**For ${sigs.caFirm}**  
*${sigs.caName}* (Partner)  
Membership No. ${sigs.caMNo}  
**UDIN: ${sigs.udin}**`;

    return [page1].join('\n---\n');
  }

  // Fallback for other 26 modules
  const page1 = `# COMPLIANCE AUDIT STATEMENT: ${moduleLabel.toUpperCase()}
**CLIENT:** ${companyName} | **GSTIN:** ${meta.gstin} | **PAN:** ${meta.pan}  
**REPORT GENERATION DATE:** ${new Date().toLocaleDateString('en-IN')}

---

## 1. STATUTORY REPORT DETAILED ANALYSIS
This audited report serves as the official compliance proof for the module **${moduleLabel}** as of the financial period ending March 31, 2025. All transaction entries, ledger extracts, and portal declarations have been reconciled using automated digital consensus pipelines.

* **Audit Registry Token:** REG-MD-${seed}-${seed % 99}
* **Associated Authority:** Income Tax Department / Ministry of Corporate Affairs / CBIC India

---

## 2. DETAIL RECORD AND TRANS-PROOF

| Ledger Code | Particulars | Primary Balance | Mapped Portal Balance | Discrepancy | Status |
| :---: | :--- | ---: | ---: | ---: | :---: |
| REG-01 | Main Account Segment | ${fmt(Math.floor(revenue * 0.1))} | ${fmt(Math.floor(revenue * 0.1))} | ₹ 0 | Reconciled |
| REG-02 | Secondary Segment | ${fmt(Math.floor(revenue * 0.05))} | ${fmt(Math.floor(revenue * 0.05))} | ₹ 0 | Reconciled |
| REG-03 | Reserve Provisioning | ${fmt(Math.floor(revenue * 0.02))} | ${fmt(Math.floor(revenue * 0.02))} | ₹ 0 | Reconciled |

---

**Filing Authority Supervisor:** SANNIDH Swarm Audit Lead  
**Verification ID:** SECURE-CONSENSUS-T-${seed}`;

  return [page1].join('\n---\n');
}

export function generateTrialBalancePdf(companyName: string, financialYear: string, seed: number, assets: number): string {
  const meta = getCompanyMeta(companyName, seed);
  const sigs = getAuditSignatures(companyName, seed);
  const fmt = (val: number) => `₹ ${val.toLocaleString('en-IN')}`;

  const shareCapital = Math.floor(assets * 0.15);
  const longTermBorrowings = Math.floor(assets * 0.22);
  const reservesSurplus = Math.floor(assets * 0.20);
  const tradePayables = Math.floor(assets * 0.14);
  const otherLiabilities = assets - (shareCapital + longTermBorrowings + reservesSurplus + tradePayables);

  const ppe = Math.floor(assets * 0.42);
  const inventories = Math.floor(assets * 0.16);
  const tradeReceivables = Math.floor(assets * 0.125);
  const cashBank = assets - (ppe + inventories + tradeReceivables);

  const revenue = Math.floor(assets * 1.25);
  const purchases = Math.floor(revenue * 0.55);
  const employeeBenefits = Math.floor(revenue * 0.15);
  const financeCosts = Math.floor(revenue * 0.05);
  const otherExpenses = revenue - (purchases + employeeBenefits + financeCosts + Math.floor(revenue * 0.15));

  const totalCredits = shareCapital + longTermBorrowings + reservesSurplus + tradePayables + otherLiabilities + revenue;
  const totalDebits = ppe + inventories + tradeReceivables + cashBank + purchases + employeeBenefits + financeCosts + otherExpenses;

  const page1 = `# STANDALONE TRIAL BALANCE AS AT MARCH 31, 2025
**CLIENT:** ${companyName} | **PAN:** ${meta.pan}  
**REPORT LEVEL:** Consolidated Trial Balance (All Cost Centres)

---

## 1. ACCOUNT BALANCES SUMMARY

| Ledger Account Head | Account Code | Debit Balance (Dr) | Credit Balance (Cr) |
| :--- | :---: | ---: | ---: |
| **Share Capital** | L-1001 | | ${fmt(shareCapital)} |
| **Reserves & Surplus** | L-1002 | | ${fmt(reservesSurplus)} |
| **Long-Term Borrowings** | L-1003 | | ${fmt(longTermBorrowings)} |
| **Trade Payables** | L-2001 | | ${fmt(tradePayables)} |
| **Other Current Liabilities** | L-2002 | | ${fmt(otherLiabilities)} |
| **Property, Plant & Equipment (PPE)** | A-1001 | ${fmt(ppe)} | |
| **Inventories** | A-2001 | ${fmt(inventories)} | |
| **Trade Receivables** | A-2002 | ${fmt(tradeReceivables)} | |
| **Cash & Bank Balances** | A-2003 | ${fmt(cashBank)} | |
| **Revenue from Operations** | I-1001 | | ${fmt(revenue)} |
| **Cost of Purchases** | E-1001 | ${fmt(purchases)} | |
| **Employee Benefit Expenses** | E-1002 | ${fmt(employeeBenefits)} | |
| **Finance Costs** | E-1003 | ${fmt(financeCosts)} | |
| **Other Operating Expenses** | E-1004 | ${fmt(otherExpenses)} | |
| | **TOTAL** | **${fmt(totalDebits)}** | **${fmt(totalCredits)}** |

---

## 2. STATUTORY COMPLIANCE STATEMENT
* **Status**: **FULLY RECONCILED & BALANCED**
* **Audit Trail**: Verification of double-entry logic completed without any open reconciliation exceptions.
* **Signed off by**: M/s ${sigs.caFirm}, Chartered Accountants`;

  return [page1].join('\n---\n');
}

export function generateGeneralLedgerPdf(companyName: string, financialYear: string, seed: number, revenue: number, pat: number): string {
  const meta = getCompanyMeta(companyName, seed);
  const sigs = getAuditSignatures(companyName, seed);
  const fmt = (val: number) => `₹ ${val.toLocaleString('en-IN')}`;

  const rentAmount = 120000;
  const salaryAmount = Math.floor(revenue * 0.15 / 12);

  const page1 = `# STANDALONE GENERAL LEDGER EXTRACT (SELECTED ACCOUNT HEADS)
**CLIENT:** ${companyName} | **GSTIN:** ${meta.gstin}
**PERIOD:** 01-Apr-2024 to 31-Mar-2025

---

## 1. ACCOUNT HEAD: RENT EXPENSES (A/C CODE: E-1004)

| Posting Date | Voucher Type | Narration | Debit (Dr) | Credit (Cr) | Running Balance |
| :---: | :---: | :--- | ---: | ---: | ---: |
| **01-Apr-2024** | Opening Bal | Balance Brought Forward | ₹ 0 | | ₹ 0 |
| **05-Apr-2024** | Bank Payment | Apr-24 Rent paid to Landlord | ${fmt(rentAmount)} | | ${fmt(rentAmount)} |
| **05-May-2024** | Bank Payment | May-24 Rent paid to Landlord | ${fmt(rentAmount)} | | ${fmt(rentAmount * 2)} |
| **05-Jun-2024** | Bank Payment | Jun-24 Rent paid to Landlord | ${fmt(rentAmount)} | | ${fmt(rentAmount * 3)} |
| **05-Jul-2024** | Bank Payment | Jul-24 Rent paid to Landlord | ${fmt(rentAmount)} | | ${fmt(rentAmount * 4)} |
| **05-Aug-2024** | Bank Payment | Aug-24 Rent paid to Landlord | ${fmt(rentAmount)} | | ${fmt(rentAmount * 5)} |
| **05-Sep-2024** | Bank Payment | Sep-24 Rent paid to Landlord | ${fmt(rentAmount)} | | ${fmt(rentAmount * 6)} |
| **05-Oct-2024** | Bank Payment | Oct-24 Rent paid to Landlord | ${fmt(rentAmount)} | | ${fmt(rentAmount * 7)} |
| **05-Nov-2024** | Bank Payment | Nov-24 Rent paid to Landlord | ${fmt(rentAmount)} | | ${fmt(rentAmount * 8)} |
| **05-Dec-2024** | Bank Payment | Dec-24 Rent paid to Landlord | ${fmt(rentAmount)} | | ${fmt(rentAmount * 9)} |
| **05-Jan-2025** | Bank Payment | Jan-25 Rent paid to Landlord | ${fmt(rentAmount)} | | ${fmt(rentAmount * 10)} |
| **05-Feb-2025** | Bank Payment | Feb-25 Rent paid to Landlord | ${fmt(rentAmount)} | | ${fmt(rentAmount * 11)} |
| **05-Mar-2025** | Bank Payment | Mar-25 Rent paid to Landlord | ${fmt(rentAmount)} | | ${fmt(rentAmount * 12)} |
| **31-Mar-2025** | Closing Journal | Transfer to Statement of P&L | | ${fmt(rentAmount * 12)} | ₹ 0 |`;

  const page2 = `## 2. ACCOUNT HEAD: SALARY CONTROL ACCOUNT (A/C CODE: E-1002)

| Posting Date | Voucher Type | Narration | Debit (Dr) | Credit (Cr) | Running Balance |
| :---: | :---: | :--- | ---: | ---: | ---: |
| **01-Apr-2024** | Opening Bal | Balance Brought Forward | ₹ 0 | | ₹ 0 |
| **30-Apr-2024** | Journal Voucher | Apr-24 payroll provisions | ${fmt(salaryAmount)} | | ${fmt(salaryAmount)} |
| **07-May-2024** | Bank Payment | Apr-24 payroll disbursed | | ${fmt(salaryAmount)} | ₹ 0 |
| **31-May-2024** | Journal Voucher | May-24 payroll provisions | ${fmt(salaryAmount)} | | ${fmt(salaryAmount)} |
| **07-Jun-2024** | Bank Payment | May-24 payroll disbursed | | ${fmt(salaryAmount)} | ₹ 0 |
| **30-Jun-2024** | Journal Voucher | Jun-24 payroll provisions | ${fmt(salaryAmount)} | | ${fmt(salaryAmount)} |
| **07-Jul-2024** | Bank Payment | Jun-24 payroll disbursed | | ${fmt(salaryAmount)} | ₹ 0 |
| **31-Jul-2024** | Journal Voucher | Jul-24 payroll provisions | ${fmt(salaryAmount)} | | ${fmt(salaryAmount)} |
| **07-Aug-2024** | Bank Payment | Jul-24 payroll disbursed | | ${fmt(salaryAmount)} | ₹ 0 |
| **31-Aug-2024** | Journal Voucher | Aug-24 payroll provisions | ${fmt(salaryAmount)} | | ${fmt(salaryAmount)} |
| **07-Sep-2024** | Bank Payment | Aug-24 payroll disbursed | | ${fmt(salaryAmount)} | ₹ 0 |
| **30-Sep-2024** | Journal Voucher | Sep-24 payroll provisions | ${fmt(salaryAmount)} | | ${fmt(salaryAmount)} |
| **07-Oct-2024** | Bank Payment | Sep-24 payroll disbursed | | ${fmt(salaryAmount)} | ₹ 0 |
| **31-Oct-2024** | Journal Voucher | Oct-24 payroll provisions | ${fmt(salaryAmount)} | | ${fmt(salaryAmount)} |
| **07-Nov-2024** | Bank Payment | Oct-24 payroll disbursed | | ${fmt(salaryAmount)} | ₹ 0 |
| **30-Nov-2024** | Journal Voucher | Nov-24 payroll provisions | ${fmt(salaryAmount)} | | ${fmt(salaryAmount)} |
| **07-Dec-2024** | Bank Payment | Nov-24 payroll disbursed | | ${fmt(salaryAmount)} | ₹ 0 |
| **31-Dec-2024** | Journal Voucher | Dec-24 payroll provisions | ${fmt(salaryAmount)} | | ${fmt(salaryAmount)} |
| **07-Jan-2025** | Bank Payment | Dec-24 payroll disbursed | | ${fmt(salaryAmount)} | ₹ 0 |
| **31-Jan-2025** | Journal Voucher | Jan-25 payroll provisions | ${fmt(salaryAmount)} | | ${fmt(salaryAmount)} |
| **07-Feb-2025** | Bank Payment | Jan-25 payroll disbursed | | ${fmt(salaryAmount)} | ₹ 0 |
| **28-Feb-2025** | Journal Voucher | Feb-25 payroll provisions | ${fmt(salaryAmount)} | | ${fmt(salaryAmount)} |
| **07-Mar-2025** | Bank Payment | Feb-25 payroll disbursed | | ${fmt(salaryAmount)} | ₹ 0 |
| **31-Mar-2025** | Journal Voucher | Mar-25 payroll provisions | ${fmt(salaryAmount)} | | ${fmt(salaryAmount)} |
| **07-Apr-2025** | Bank Payment | Mar-25 payroll disbursed (FY26) | | ${fmt(salaryAmount)} | -${fmt(salaryAmount)} |`;

  return [page1, page2].join('\n---\n');
}

export function generateBankReconPdf(companyName: string, financialYear: string, seed: number, assets: number): string {
  const meta = getCompanyMeta(companyName, seed);
  const sigs = getAuditSignatures(companyName, seed);
  const fmt = (val: number) => `₹ ${val.toLocaleString('en-IN')}`;

  const ledgerBalance = Math.floor(assets * 0.15);
  const chequesIssuedNotPresented = Math.floor(ledgerBalance * 0.08);
  const chequesDepositedNotCleared = Math.floor(ledgerBalance * 0.05);
  const directBankCredits = Math.floor(ledgerBalance * 0.015);
  const bankChargesDebited = Math.floor(ledgerBalance * 0.002);
  
  const bankStatementBalance = ledgerBalance + chequesIssuedNotPresented - chequesDepositedNotCleared + directBankCredits - bankChargesDebited;

  const page1 = `# STATUTORY BANK RECONCILIATION STATEMENT (BRS)
**CLIENT:** ${companyName} | **AS AT DATE:** March 31, 2025
**PRIMARY BANK:** HDFC Bank Current A/c (No. XXXXXXXX9284)

---

## 1. RECONCILIATION STATEMENT

| Particulars | Note | Amount (Dr / Cr) |
| :--- | :---: | ---: |
| **Balance as per Books of Accounts (Bank Ledger)** | | **${fmt(ledgerBalance)}** |
| *Add: Cheques issued to vendors but not presented for payment* | | ${fmt(chequesIssuedNotPresented)} |
| *Add: Direct transfer by customers into Bank Account (Interest/Credits)* | | ${fmt(directBankCredits)} |
| *Less: Cheques deposited in Bank but not yet cleared/realised* | | -${fmt(chequesDepositedNotCleared)} |
| *Less: Bank charges debited by Bank not recorded in Books* | | -${fmt(bankChargesDebited)} |
| **Balance as per Bank Passbook (Bank Statement)** | | **${fmt(bankStatementBalance)}** |

---

## 2. PENDING CHEQUE DISCLOSURES (AS ON MARCH 31, 2025)

| Cheque Number | Date of Issue | Vendor / Drawer Name | Amount | Clearing Date | Status |
| :---: | :---: | :--- | ---: | :---: | :---: |
| 509182 | 26-Mar-2025 | Star Logistics Pvt Ltd | ${fmt(Math.floor(chequesIssuedNotPresented * 0.6))} | 03-Apr-2025 | Cleared in FY26 |
| 509204 | 28-Mar-2025 | Vertex Office Supplies | ${fmt(Math.floor(chequesIssuedNotPresented * 0.4))} | 05-Apr-2025 | Cleared in FY26 |
| 901824 | 30-Mar-2025 | Customer Deposit - Inbound | ${fmt(chequesDepositedNotCleared)} | 04-Apr-2025 | Cleared in FY26 |

---

## 3. AUDITOR NOTE ON INTERNAL CONTROLS
* **Verification**: Bank feeds synced via Sahamati Account Aggregator matched perfectly with the physical bank passbook statement.
* **Findings**: No stale cheques (> 3 months old) detected. Reconciliation is clean.
* **Signed off by**: M/s ${sigs.caFirm}, Chartered Accountants`;

  return [page1].join('\n---\n');
}

export function generateFixedAssetRegisterPdf(companyName: string, financialYear: string, seed: number, assets: number): string {
  const meta = getCompanyMeta(companyName, seed);
  const sigs = getAuditSignatures(companyName, seed);
  const fmt = (val: number) => `₹ ${val.toLocaleString('en-IN')}`;

  const totalFARValue = Math.floor(assets * 0.42);
  
  const computers = Math.floor(totalFARValue * 0.15);
  const officeEquipment = Math.floor(totalFARValue * 0.20);
  const machinery = Math.floor(totalFARValue * 0.45);
  const furniture = totalFARValue - (computers + officeEquipment + machinery);

  const depCompBooks = Math.floor(computers * 0.162);
  const depCompIT = Math.floor(computers * 0.40);

  const depMachBooks = Math.floor(machinery * 0.075);
  const depMachIT = Math.floor(machinery * 0.15);

  const page1 = `# STATUTORY FIXED ASSET REGISTER (AS PER COMPANIES ACT & INCOME TAX ACT)
**CLIENT:** ${companyName} | **AS AT DATE:** March 31, 2025

---

## 1. REGISTER SUMMARY (COMPANIES ACT DEPRECIATION)

| Asset Category | Opening Cost (01.04.24) | Additions | Deletions | Closing Cost (31.03.25) | Dep. Rate | Dep. for Year | Net WDV (31.03.25) |
| :--- | ---: | ---: | ---: | ---: | :---: | ---: | ---: |
| **Plant & Machinery** | ${fmt(machinery)} | ₹ 0 | ₹ 0 | ${fmt(machinery)} | 7.50% | ${fmt(depMachBooks)} | ${fmt(machinery - depMachBooks)} |
| **Office Equipment** | ${fmt(officeEquipment)} | ₹ 0 | ₹ 0 | ${fmt(officeEquipment)} | 10.0% | ${fmt(Math.floor(officeEquipment * 0.1))} | ${fmt(Math.floor(officeEquipment * 0.9))} |
| **Furniture & Fixtures** | ${fmt(furniture)} | ₹ 0 | ₹ 0 | ${fmt(furniture)} | 9.50% | ${fmt(Math.floor(furniture * 0.095))} | ${fmt(Math.floor(furniture * 0.905))} |
| **Computer Systems** | ${fmt(computers)} | ₹ 0 | ₹ 0 | ${fmt(computers)} | 16.2% | ${fmt(depCompBooks)} | ${fmt(computers - depCompBooks)} |
| **TOTALS** | **${fmt(totalFARValue)}** | **₹ 0** | **₹ 0** | **${fmt(totalFARValue)}** | | **${fmt(depMachBooks + Math.floor(officeEquipment * 0.1) + Math.floor(furniture * 0.095) + depCompBooks)}** | **${fmt(totalFARValue - (depMachBooks + Math.floor(officeEquipment * 0.1) + Math.floor(furniture * 0.095) + depCompBooks))}** |

---

## 2. DEPRECIATION BLOCK STATEMENT (INCOME TAX ACT, 1961)

| Block Name & Dep. Rate | Opening WDV | Additions | Deletions | Total Value | Dep. for Year (IT) | Closing WDV (IT) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| **Block 1: Machinery (15%)** | ${fmt(machinery)} | ₹ 0 | ₹ 0 | ${fmt(machinery)} | ${fmt(depMachIT)} | ${fmt(machinery - depMachIT)} |
| **Block 2: Office & Furn (10%)** | ${fmt(officeEquipment + furniture)} | ₹ 0 | ₹ 0 | ${fmt(officeEquipment + furniture)} | ${fmt(Math.floor((officeEquipment + furniture) * 0.1))} | ${fmt(Math.floor((officeEquipment + furniture) * 0.9))} |
| **Block 3: Computers (40%)** | ${fmt(computers)} | ₹ 0 | ₹ 0 | ${fmt(computers)} | ${fmt(depCompIT)} | ${fmt(computers - depCompIT)} |
| **TOTALS** | **${fmt(totalFARValue)}** | **₹ 0** | **₹ 0** | **${fmt(totalFARValue)}** | **${fmt(depMachIT + Math.floor((officeEquipment + furniture) * 0.1) + depCompIT)}** | **${fmt(totalFARValue - (depMachIT + Math.floor((officeEquipment + furniture) * 0.1) + depCompIT))}** |

---

## 3. AUDITOR PHYSICAL VERIFICATION NOTE
* **Physical Audit Verification**: Asset tags checked on machinery and computers. Fixed Asset Register matches physical verification sheet.
* **Property Titles**: Immovable property title deeds checked and verified.
* **Signed off by**: M/s ${sigs.caFirm}, Chartered Accountants`;

  return [page1].join('\n---\n');
}
