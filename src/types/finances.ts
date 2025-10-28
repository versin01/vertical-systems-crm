export interface Offer {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CashEntry {
  id: string;
  date: string;
  due_date?: string;
  income: number;
  offer_id?: string;
  client_name: string;
  client_email: string;
  payment_type: PaymentType;
  status: PaymentStatus;
  contracted_amount: number;
  gross_profit: number;
  setter_percentage: number;
  setter_payment: number;
  closer_percentage: number;
  closer_payment: number;
  total_commissions: number;
  setter_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  offer?: Offer;
  setter?: {
    id: string;
    email: string;
    full_name?: string;
  };
  creator?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export type PaymentType = 
  | 'Deposit' 
  | 'Installment' 
  | '1' 
  | '2' 
  | '3' 
  | '4' 
  | '5' 
  | '6' 
  | '7' 
  | '8' 
  | '9' 
  | '10';

export type PaymentStatus = 'Paid' | 'Canceled' | 'Refunded';

export interface CashEntryFormData {
  date: string;
  due_date: string;
  income: number;
  offer_id: string;
  client_name: string;
  client_email: string;
  payment_type: PaymentType;
  status: PaymentStatus;
  contracted_amount: number;
  gross_profit: number;
  setter_percentage: number;
  closer_percentage: number;
  setter_id: string;
}

export interface CashEntryFilters {
  search: string;
  status: PaymentStatus | '';
  payment_type: PaymentType | '';
  offer_id: string;
  setter_id: string;
  date_range: 'all' | 'today' | 'this_week' | 'this_month' | 'custom';
  due_date_range: 'all' | 'overdue' | 'due_this_week' | 'due_this_month' | 'custom';
  start_date?: string;
  end_date?: string;
  due_start_date?: string;
  due_end_date?: string;
}

export interface OfferFormData {
  name: string;
  description: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  expense_name: string;
  expense_type: ExpenseType;
  invoice_filed: boolean;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;

  // Related data
  creator?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export type ExpenseType =
  | 'Bank fees'
  | 'Course'
  | 'Done with you program'
  | 'Done for you program'
  | 'Meta ads'
  | 'Agency fees'
  | 'Loan'
  | 'Misk'
  | 'Monthly software'
  | 'Other'
  | 'Personal'
  | 'Referral free'
  | 'Refund'
  | 'Taxes'
  | 'Team payroll'
  | 'Yearly software'
  | 'YouTube ads';

export interface ExpenseFormData {
  date: string;
  amount: number;
  expense_name: string;
  expense_type: ExpenseType | '';
  invoice_filed: boolean;
  notes: string;
}

export interface ExpenseFilters {
  search: string;
  expense_type: ExpenseType | '';
  invoice_filed: 'all' | 'yes' | 'no';
  date_range: 'all' | 'today' | 'this_week' | 'this_month' | 'custom';
  start_date?: string;
  end_date?: string;
}