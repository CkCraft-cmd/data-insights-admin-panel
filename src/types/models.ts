
// Admin model
export interface Admin {
  A_ID: number;
  username: string;
  email: string;
  role: string;
}

// Business model
export interface Business {
  B_ID: number;
  name: string;
  phone: string;
  industry: string | null;
  address: string | null;
  offer_id: number | null;
}

// Product model
export interface Product {
  P_ID: number;
  name: string;
  category: string;
}

// Customer model
export interface Customer {
  C_ID: number;
  name: string;
  email: string;
  phone: string;
  join_date: string;
}

// Offers model
export interface Offer {
  offer_id: number;
  O_name: string;
  B_ID: number | null;
}

// Transaction model
export interface Transaction {
  T_ID: number;
  C_ID: number;
  P_ID: number;
  Amount: number;
  Date: string;
}

// Redemption model
export interface Redemption {
  R_ID: number;
  points_used: number;
  T_ID: number;
}

// Loyalty model
export interface Loyalty {
  L_ID: number;
  points: number;
  issue_date: string;
  exp_date: string;
}

// Tier System model
export interface TierSystem {
  tier_id: number;
  name: string;
  benefits: string;
}

// Customer Tier model
export interface CustomerTier {
  CT_ID: number;
  C_ID: number;
  tier_id: number;
  enrollment_date: string;
  status: string;
}

// Referral Program model
export interface ReferralProgram {
  Referral_id: number;
  Referred_id: number;
  Referred_C_id: number;
  Point_awarded: number;
  exp_date: string;
}

// Feedback model
export interface Feedback {
  Feedback_id: number;
  B_ID: number;
  C_ID: number;
}

// Promotion model
export interface Promotion {
  P_ID: number;
  start_date: string;
  end_date: string;
}

// Fraud Detection model
export interface FraudDetection {
  Fraud_id: number;
  C_ID: number;
}

// Analytics model
export interface Analytics {
  analytics_id: number;
  B_ID: number;
  transaction_count: number;
  total_revenue: number;
  reporting_date: string;
}
