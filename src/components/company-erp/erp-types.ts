/**
 * ERP SHARED TYPES
 * All TypeScript interfaces for the Smart ERP Module.
 * Used by SmartERPModule (demo) and RealERPModule (live).
 */

export interface ERPInvoice {
  id: string;
  invoice_no: string;
  date: string;
  customer: string;
  gstin: string;
  items: number;
  amount: number;
  gst: number;
  total: number;
  status: "paid" | "pending" | "overdue" | "draft";
  due_date: string;
  days_overdue?: number;
}

export interface ERPPurchase {
  id: string;
  bill_no: string;
  date: string;
  vendor: string;
  gstin: string;
  amount: number;
  gst: number;
  total: number;
  itc_eligible: boolean;
  itc_claimed: boolean;
  status: "processed" | "pending_review" | "rejected";
  ai_confidence: number;
  category: string;
}

export type IndirectExpenseCategory =
  | "Salary" | "Wages (Office)" | "Rent" | "Electricity Expenses" | "Telephone Expenses"
  | "Internet Expenses" | "Printing & Stationery" | "Postage & Courier" | "Travelling Expenses"
  | "Conveyance Expenses" | "Fuel & Petrol Expenses" | "Vehicle Maintenance" | "Repair & Maintenance"
  | "Office Expenses" | "Staff Welfare Expenses" | "Refreshment Expenses" | "Advertisement Expenses"
  | "Marketing Expenses" | "Commission Paid" | "Legal & Professional Fees" | "Audit Fees"
  | "Consultancy Charges" | "Bank Charges" | "Interest Paid" | "Insurance Expenses"
  | "Computer Expenses" | "Software Expenses" | "Security Expenses" | "Housekeeping Expenses"
  | "Cleaning Expenses" | "Donation (Business Purpose)" | "Subscription Charges" | "Membership Fees"
  | "Miscellaneous Expenses" | "Water Charges" | "Depreciation" | "Bad Debts"
  | "GST Late Fee" | "Penalty & Fine" | "Packing Charges" | "Forwarding Charges"
  | "Professional Tax" | "RTO Expenses" | "Indirect Labour Charges" | "Loading & Unloading Charges"
  | "Gate Pass Charges" | "Weighment Charges" | "Sampling Charges" | "Testing Charges"
  | "Loss by Theft / Fire";

export interface ERPExpense {
  id: string;
  date: string;
  description: string;
  category: IndirectExpenseCategory | string;
  amount: number;
  paid_by: "cash" | "bank" | "card";
  receipt_uploaded: boolean;
  tds_applicable: boolean;
  tds_amount?: number;
}

export interface ERPPayroll {
  id: string;
  employee: string;
  designation: string;
  basic: number;
  hra: number;
  allowances: number;
  gross: number;
  pf: number;
  esic: number;
  tds: number;
  net_pay: number;
  status: "paid" | "pending";
  bank_account: string;
}

export interface ERPBankTxn {
  id: string;
  date: string;
  description: string;
  debit?: number;
  credit?: number;
  balance: number;
  matched: boolean;
  category: string;
  confidence: number;
}

export interface ERPStockItem {
  id: string;
  name: string;
  hsn_code: string;
  unit: string;
  opening_qty: number;
  current_qty: number;
  rate: number;
  reorder_level: number;
  category: string;
}

export interface ERPCompany {
  name: string;
  gstin: string;
  state: string;
  pan?: string;
}

export interface SmartERPProps {
  invoices: ERPInvoice[];
  purchases: ERPPurchase[];
  expenses: ERPExpense[];
  payroll: ERPPayroll[];
  bankTxns: ERPBankTxn[];
  inventory?: ERPStockItem[];
  company?: ERPCompany;
  financialYear?: string;
  companyId?: string;
}
