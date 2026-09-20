export const GST_TEMPLATE = (notice: any) => `BEFORE THE CENTRAL GOODS AND SERVICES TAX OFFICERS, DIVISION-I, JURISDICTIONAL COMMISSIONERATE

IN THE MATTER OF:
M/s ${notice.client}
GSTIN/UIN: 27AABCG5678K2ZQ
Address: 402, Business Park, Phase-1, Industrial Area

SUBJECT: COMPREHENSIVE LEGAL REPLY TO SHOW CAUSE NOTICE REF NO: ${notice.refNumber} DATED ${notice.issueDate}

MOST RESPECTFULLY SHOWETH:

1. PRELIMINARY OBJECTIONS ON JURISDICTION AND VALIDITY
1.1 The Assessee, M/s ${notice.client}, most respectfully submits that the impugned Show Cause Notice (SCN) proposing a demand of Input Tax Credit (ITC) mismatch under GSTR-2B versus GSTR-3B is legally untenable, devoid of merits, and contrary to established circulars and jurisprudence under the CGST Act, 2017.
1.2 It is submitted that the notice has been issued mechanically without independent application of mind, relying solely on automated system mismatches.

2. DETAILED RECONCILIATION OF INPUT TAX CREDIT (ITC)
2.1 The alleged variance of ${notice.mismatchAmount || '₹2,40,000'} has been thoroughly reconciled down to the invoice-level by our statutory audit team.
2.2 The Assessee wishes to place on record the following factual matrix:
    a) All procurements were backed by valid tax invoices as per Section 16(2)(a) of the CGST Act.
    b) The goods and services were actually received by the Assessee in the ordinary course of business [Section 16(2)(b)].
    c) Payments for all disputed invoices, including the tax component, have been remitted to the suppliers within 180 days via legitimate banking channels, satisfying the proviso to Section 16(2).
    d) M/s Supplier A (GSTIN: 27AAAPQ9012A1Z3) filed GSTR-1 with a delay due to technical glitches on the GSTN portal. However, the ITC was correctly claimed under GSTR-3B in the respective month after verification of payments.

3. DEFENSE UNDER SECTION 16(4) AND RELIANCE ON JUDICIAL PRECEDENTS
3.1 The Assessee places heavy reliance on the CBIC Circular No. 183/15/2022-GST dated 27.12.2022, which categorically clarifies that bona fide clerical errors or delays by suppliers in reporting in GSTR-1 should not lead to the denial of legitimate ITC to the genuine purchaser, subject to producing CA certificates or supplier declarations.
3.2 The Assessee also relies on the landmark judgment of the Hon'ble Supreme Court in the case of Eicher Motors Ltd vs Union of India, which established that ITC is a vested right and cannot be denied for procedural lapses of third parties.
3.3 Furthermore, as held by the Hon'ble Madras High Court in M/s D.Y. Beathel Enterprises, recovery cannot be initiated against the purchaser without first exhausting remedies against the defaulting supplier.

4. ANNEXURES AND EVIDENCES SUBMITTED
The Assessee encloses the following evidentiary documents:
- Annexure A: Certified GSTR-2A and 2B Reconciliation Statement.
- Annexure B: Copies of Tax Invoices in dispute.
- Annexure C: Bank Account Statements highlighting supplier payments.
- Annexure D: Certificate from Chartered Accountant verifying compliance with Section 16(2)(c).

5. PRAYER
In view of the above submissions, factual matrices, and judicial precedents, it is most respectfully prayed that:
(a) The proposed demand of ${notice.mismatchAmount || '₹2,40,000'} along with the proposed interest under Section 50 and penalty under Section 122 be entirely dropped.
(b) The proceedings initiated under the impugned Show Cause Notice be dropped unconditionally.
(c) The Assessee be granted an opportunity for a Personal Hearing through authorized representatives before any adverse order is passed.
(d) Any other relief deemed fit in the interest of natural justice.

For and on behalf of M/s ${notice.client}

___________________________
Authorized Signatory
(Drafted by SANNIDH & CO., Chartered Accountants)
`;

export const MCA_TEMPLATE = (notice: any) => `BEFORE THE REGISTRAR OF COMPANIES (ROC), MINISTRY OF CORPORATE AFFAIRS

IN THE MATTER OF:
M/s ${notice.client}
CIN: L65191KA2015PLC082931
Registered Office: Tech Park, Block C, Electronic City

SUBJECT: DETAILED RESPONSE TO REGULATORY INTIMATION REF NO: ${notice.refNumber} DATED ${notice.issueDate}

MOST RESPECTFULLY SHOWETH:

1. PRELIMINARY CONTEXT AND CORPORATE STANDING
1.1 The Assessee Company, M/s ${notice.client}, is a fully compliant corporate entity, regularly adhering to the statutory filing requirements mandated under the Companies Act, 2013 and rules made thereunder.
1.2 The present response is directed against the notice regarding the alleged delay and non-compliance in filing DIR-3 KYC for the company's directors.

2. FACTUAL MATRIX AND EXPLANATION FOR PROCEDURAL DELAY
2.1 It is submitted that the KYC documents and necessary board resolutions were formulated and processed well within the prescribed timelines.
2.2 Specifically, on 12th May 2026, the company's authorized professionals attempted to file the e-Form DIR-3 KYC. However, the MCA-21 V3 portal encountered severe server timeouts and payment gateway synchronization failures.
2.3 The Director Identification Number (DIN) status of the concerned directors remains active, and there was no willful default or negligence on the part of the company or its directors.
2.4 We have attached server error logs (Annexure I) and helpdesk ticket references (Annexure II) generated during the failed filing attempts as proof of our bona fide intent.

3. LEGAL DEFENSE AND WAIVER OF PENALTY
3.1 Section 460 of the Companies Act, 2013 empowers the Central Government/ROC to condone delays in filing if the delay was due to circumstances beyond the control of the company.
3.2 The delay in the present case is purely attributable to systemic technical anomalies of the MCA portal, a fact widely acknowledged by various professional bodies (ICAI, ICSI) during the relevant period.

4. PRAYER
In light of the documentary evidence demonstrating our timely attempts to comply, it is respectfully requested that:
(a) The DIR-3 KYC forms be accepted on record without levying additional late filing fees or penalties.
(b) The compliance status of the directors' DINs be maintained as "Active".
(c) No penal action be initiated under Section 450 of the Companies Act, 2013.

For and on behalf of M/s ${notice.client}

___________________________
Director / Company Secretary
`;

export const IT_TEMPLATE = (notice: any) => `BEFORE THE DEPUTY COMMISSIONER OF INCOME TAX, CIRCLE-1(1), JURISDICTIONAL WARD

IN THE MATTER OF:
M/s ${notice.client}
PAN: AAACA1234Z
Assessment Year: 2025-26

SUBJECT: COMPREHENSIVE RESPONSE TO SCRUTINY NOTICE UNDER SECTION 143(2) REF NO: ${notice.refNumber}

MOST RESPECTFULLY SHOWETH:

1. INTRODUCTION AND COMPLIANCE STATUS
1.1 The Assessee, M/s ${notice.client}, filed its Return of Income for AY 2025-26 on the due date, declaring a total income computed strictly in accordance with the provisions of the Income Tax Act, 1961 and Income Computation and Disclosure Standards (ICDS).
1.2 The Assessee is in receipt of the notice under Section 143(2) seeking explanations on specific high-value transactions and ledger variations.

2. EXPLANATION OF PROFESSIONAL FEES AND TDS COMPLIANCE
2.1 The notice raises a query regarding the discrepancy of ${notice.mismatchAmount || '₹4,50,000'} classified under "Legal and Professional Expenses".
2.2 We submit that this amount was paid to specialized consultants for system integration services. The entire amount was subjected to Tax Deducted at Source (TDS) under Section 194J at the applicable rate of 10%.
2.3 The TDS has been deposited into the Government Treasury within the stipulated time, and the corresponding Form 16A has been issued.
2.4 Enclosed herewith (Annexure A) is the ledger account of Professional Fees, cross-linked with the TDS Quarterly Returns (Form 26Q) and corresponding challans.

3. EXPLANATION REGARDING SECTION 40(A)(3) - CASH PAYMENTS
3.1 Regarding the query on cash transactions, it is categorically stated that no cash payments exceeding ₹10,000 were made to any single party in a day. All operational expenses have been incurred via NEFT/RTGS banking channels.

4. PRAYER
It is respectfully prayed that:
(a) The explanations and documents placed on record be deemed satisfactory.
(b) The scrutiny assessment proceedings be concluded and the returned income be accepted without any ad-hoc additions.
(c) The Assessee be provided an opportunity to present its case virtually before any adverse inference is drawn.

For and on behalf of M/s ${notice.client}

___________________________
Authorized Signatory
`;

export const SEBI_TEMPLATE = (notice: any) => `BEFORE THE SECURITIES AND EXCHANGE BOARD OF INDIA (SEBI), CORPORATION FINANCE DEPARTMENT

IN THE MATTER OF:
M/s ${notice.client}
Listed Entity Code: 532XXX
ISIN: INE123A01012

SUBJECT: REPLY TO SHOW CAUSE NOTICE / CLARIFICATION SOUGHT REF NO: ${notice.refNumber}

MOST RESPECTFULLY SHOWETH:

1. PRELIMINARY SUBMISSION
1.1 M/s ${notice.client} (hereinafter referred to as "the Company") acknowledges receipt of the clarification sought regarding alleged violations of SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 [LODR].
1.2 The Company is a law-abiding corporate citizen with the highest standards of corporate governance, transparency, and timely disclosures to the stock exchanges (BSE/NSE).

2. FACTUAL CLARIFICATION REGARDING DISCLOSURE DELAY
2.1 The notice highlights a delay in disclosing a material event (acquisition of subsidiary) under Regulation 30 of LODR.
2.2 We submit that the negotiation regarding the acquisition was in an exploratory, non-binding phase. The definitive binding agreement was signed by the Board only on the evening of 18th May 2026.
2.3 Immediately upon the execution of the binding agreement, the disclosure was made to the exchanges within the mandated 12-hour window.
2.4 There was no asymmetry of information in the market, nor did any insider trading occur, as evidenced by the trading volume data enclosed (Annexure I).

3. DEFENSE UNDER SEBI GUIDELINES
3.1 As per SEBI's materiality guidelines, premature disclosure of incomplete negotiations can mislead investors. The Company exercised prudent judgment to prevent speculative market volatility.

4. PRAYER
We respectfully pray that SEBI takes the aforesaid facts on record and drops any proposed adjudication proceedings, recognizing the Company's bona fide adherence to the spirit of the LODR regulations.

For and on behalf of M/s ${notice.client}

___________________________
Company Secretary & Compliance Officer
`;

export const RBI_TEMPLATE = (notice: any) => `BEFORE THE RESERVE BANK OF INDIA (RBI), FOREIGN EXCHANGE DEPARTMENT

IN THE MATTER OF:
M/s ${notice.client}
FEMA Registration / AD Code: 78945612

SUBJECT: REPLY TO NOTICE REGARDING FEMA COMPLIANCE REF NO: ${notice.refNumber}

MOST RESPECTFULLY SHOWETH:

1. PRELIMINARY SUBMISSION
1.1 M/s ${notice.client} ("the Company") acknowledges the receipt of the communication from the RBI regarding discrepancies in the filing of Annual Return on Foreign Liabilities and Assets (FLA) and related ODI/FDI compliance under the Foreign Exchange Management Act (FEMA), 1999.

2. FACTUAL RECONCILIATION OF FOREIGN REMITTANCES
2.1 The discrepancy of ${notice.mismatchAmount || 'USD 50,000'} highlighted in the notice corresponds to an outward remittance made for import of software licenses.
2.2 The corresponding Form 15CA and 15CB were generated, and the Authorised Dealer (AD) Bank processed the remittance under the correct purpose code (P0802).
2.3 The delay in filing the FLA return for FY 2025-26 was solely due to a delay in receiving the audited financial statements from our wholly-owned subsidiary in Singapore.
2.4 The FLA return has since been successfully filed on the FIRMS portal, and the acknowledgment receipt is enclosed herewith.

3. PRAYER FOR CONDONATION
In light of the fact that the substantive transaction was fully compliant and the procedural delay was beyond our immediate control, we request the compounding authority to:
(a) Condone the delay in filing the FLA return.
(b) Drop any penal action or Late Submission Fees (LSF) considering this is the first such instance in the Company's history.

For and on behalf of M/s ${notice.client}

___________________________
Authorized Signatory / CFO
`;

export const CUSTOMS_TEMPLATE = (notice: any) => `BEFORE THE COMMISSIONER OF CUSTOMS, INLAND CONTAINER DEPOT (ICD)

IN THE MATTER OF:
M/s ${notice.client}
IEC Code: 0500123456

SUBJECT: REPLY TO QUERY MEMO / SCN REF NO: ${notice.refNumber} DATED ${notice.issueDate}

MOST RESPECTFULLY SHOWETH:

1. PRELIMINARY SUBMISSION
1.1 The Importer, M/s ${notice.client}, submits that the query raised by the Customs Appraising Officer regarding the classification and valuation of imported capital goods under Bill of Entry (BOE) No. 902812 is based on a misunderstanding of the technical specifications.

2. JUSTIFICATION OF HSN CLASSIFICATION
2.1 The goods imported are specialized industrial automation sensors. The assessing officer proposes to classify them under CTH 8536 (electrical apparatus), levying a higher Basic Customs Duty (BCD).
2.2 We submit that the correct classification is CTH 9031 (Measuring or checking instruments), as the primary function of the machinery is precision measurement and not merely electrical switching.
2.3 We rely on the explanatory notes to the Harmonized System of Nomenclature (HSN) and the World Customs Organization (WCO) rulings, copies of which are annexed.
2.4 A technical certificate from a Chartered Engineer detailing the working principle of the goods is enclosed as Annexure A.

3. VALUATION DEFENSE
3.1 The transaction value declared under Rule 3 of the Customs Valuation Rules, 2007 is genuine. The supplier is unrelated, and the invoice value represents the true commercial price paid.

4. PRAYER
It is requested that:
(a) The Bill of Entry be assessed and cleared under the declared CTH 9031.
(b) The goods be released immediately to avoid demurrage charges, or alternatively, released under a provisional assessment bond.

For and on behalf of M/s ${notice.client}

___________________________
Authorized Signatory
`;

export const LEGAL_TEMPLATE = (notice: any) => `BEFORE THE ARBITRATION TRIBUNAL / COMMERCIAL COURT

IN THE MATTER OF:
M/s ${notice.client} (Respondent)
vs.
Supplier/Vendor (Claimant)

SUBJECT: REPLY TO LEGAL NOTICE / DEMAND REF NO: ${notice.refNumber} DATED ${notice.issueDate}

MOST RESPECTFULLY SHOWETH:

1. PRELIMINARY OBJECTIONS
1.1 The Respondent, M/s ${notice.client}, totally and vehemently denies all the allegations, claims, and demands made in the legal notice dated ${notice.issueDate}, except those specifically admitted herein.
1.2 The claims made for an amount of ${notice.mismatchAmount || '₹50,00,000'} are frivolous, vexatious, and an abuse of the legal process, intended solely to extort money.

2. FACTUAL POSITION AND BREACH OF CONTRACT BY CLAIMANT
2.1 The Master Service Agreement (MSA) dated 1st January 2025 clearly stipulates that payments are contingent upon the successful completion of milestones and passing Quality Assurance (QA) checks.
2.2 The Claimant completely failed to deliver the software modules on time. Furthermore, the modules delivered were riddled with critical bugs, leading to severe financial losses for the Respondent.
2.3 The Respondent had repeatedly communicated these deficiencies via emails dated [Insert Dates], which were ignored by the Claimant.
2.4 As per Clause 9 of the MSA, the Respondent exercised its rightful option to terminate the contract for cause, thereby nullifying any outstanding invoices post-termination.

3. COUNTER-CLAIM NOTIFICATION
3.1 The Respondent reserves the right to initiate counter-claims against the Claimant for damages, loss of business opportunity, and reputational harm caused due to the Claimant's substandard performance.

4. CONCLUSION
The Claimant is hereby called upon to immediately withdraw the legal notice and cease and desist from making further baseless demands. Failing this, the Respondent will take appropriate legal action, including defending the matter in court and claiming costs.

For and on behalf of M/s ${notice.client}

___________________________
In-House Legal Counsel / Authorized Representative
`;
