
import { 
  Admin, Business, Product, Customer, Offer, 
  Transaction, Redemption, Loyalty, TierSystem, 
  CustomerTier, ReferralProgram, Feedback, 
  Promotion, FraudDetection, Analytics 
} from '../types/models';

// Mock data
let businesses: Business[] = [
  { B_ID: 1, name: 'Acme Corporation', phone: '555-123-4567', industry: 'Technology', address: '123 Tech Lane', offer_id: 1 },
  { B_ID: 2, name: 'Global Retail', phone: '555-987-6543', industry: 'Retail', address: '456 Shop Street', offer_id: 2 },
  { B_ID: 3, name: 'Food Delights', phone: '555-456-7890', industry: 'Food & Beverage', address: '789 Taste Avenue', offer_id: 3 },
];

let products: Product[] = [
  { P_ID: 1, name: 'Laptop Pro', category: 'Electronics' },
  { P_ID: 2, name: 'Office Chair', category: 'Furniture' },
  { P_ID: 3, name: 'Coffee Maker', category: 'Appliances' },
];

let customers: Customer[] = [
  { C_ID: 1, name: 'John Doe', email: 'john@example.com', phone: '555-111-2222', join_date: '2023-01-15' },
  { C_ID: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '555-333-4444', join_date: '2023-02-20' },
  { C_ID: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '555-555-6666', join_date: '2023-03-10' },
];

let offers: Offer[] = [
  { offer_id: 1, O_name: 'Summer Sale', B_ID: 1 },
  { offer_id: 2, O_name: 'Holiday Special', B_ID: 2 },
  { offer_id: 3, O_name: 'Weekend Deal', B_ID: 3 },
];

let transactions: Transaction[] = [
  { T_ID: 1, C_ID: 1, P_ID: 1, Amount: 1200.00, Date: '2023-06-15T14:30:00' },
  { T_ID: 2, C_ID: 2, P_ID: 2, Amount: 150.00, Date: '2023-06-20T10:15:00' },
  { T_ID: 3, C_ID: 3, P_ID: 3, Amount: 80.00, Date: '2023-06-25T16:45:00' },
];

let redemptions: Redemption[] = [
  { R_ID: 1, points_used: 500, T_ID: 1 },
  { R_ID: 2, points_used: 200, T_ID: 2 },
];

let loyalties: Loyalty[] = [
  { L_ID: 1, points: 1000, issue_date: '2023-01-20', exp_date: '2024-01-20' },
  { L_ID: 2, points: 750, issue_date: '2023-02-25', exp_date: '2024-02-25' },
];

let tierSystems: TierSystem[] = [
  { tier_id: 1, name: 'Bronze', benefits: 'Basic rewards, 5% discount' },
  { tier_id: 2, name: 'Silver', benefits: 'Free shipping, 10% discount' },
  { tier_id: 3, name: 'Gold', benefits: 'Priority support, 15% discount, exclusive offers' },
];

let customerTiers: CustomerTier[] = [
  { CT_ID: 1, C_ID: 1, tier_id: 3, enrollment_date: '2023-01-20', status: 'active' },
  { CT_ID: 2, C_ID: 2, tier_id: 2, enrollment_date: '2023-02-25', status: 'active' },
  { CT_ID: 3, C_ID: 3, tier_id: 1, enrollment_date: '2023-03-15', status: 'pending' },
];

let referralPrograms: ReferralProgram[] = [
  { Referral_id: 1, Referred_id: 101, Referred_C_id: 1, Point_awarded: 250, exp_date: '2024-06-30' },
  { Referral_id: 2, Referred_id: 102, Referred_C_id: 2, Point_awarded: 250, exp_date: '2024-07-15' },
];

let feedbacks: Feedback[] = [
  { Feedback_id: 1, B_ID: 1, C_ID: 1 },
  { Feedback_id: 2, B_ID: 2, C_ID: 2 },
];

let promotions: Promotion[] = [
  { P_ID: 1, start_date: '2023-07-01', end_date: '2023-07-31' },
  { P_ID: 2, start_date: '2023-08-01', end_date: '2023-08-31' },
];

let fraudDetections: FraudDetection[] = [
  { Fraud_id: 1, C_ID: 3 },
];

let analytics: Analytics[] = [
  { analytics_id: 1, B_ID: 1, transaction_count: 150, total_revenue: 15000.00, reporting_date: '2023-06-30' },
  { analytics_id: 2, B_ID: 2, transaction_count: 120, total_revenue: 12000.00, reporting_date: '2023-06-30' },
  { analytics_id: 3, B_ID: 3, transaction_count: 90, total_revenue: 9000.00, reporting_date: '2023-06-30' },
];

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generic CRUD functions
const generateCrudService = <T extends { [key: string]: any }>(
  items: T[],
  primaryKey: keyof T
) => {
  return {
    getAll: async (): Promise<T[]> => {
      await delay(300); // Simulate network delay
      return [...items];
    },
    
    getById: async (id: number | string): Promise<T | undefined> => {
      await delay(200);
      return items.find(item => item[primaryKey] === id);
    },
    
    create: async (item: Omit<T, typeof primaryKey>): Promise<T> => {
      await delay(400);
      
      // Generate a new ID (in a real app this would be handled by the database)
      const maxId = items.length > 0 
        ? Math.max(...items.map(i => Number(i[primaryKey])))
        : 0;
        
      const newId = maxId + 1;
      const newItem = { ...item, [primaryKey]: newId } as T;
      
      items.push(newItem);
      return newItem;
    },
    
    update: async (id: number | string, updates: Partial<T>): Promise<T | undefined> => {
      await delay(400);
      
      const index = items.findIndex(item => item[primaryKey] === id);
      if (index === -1) return undefined;
      
      items[index] = { ...items[index], ...updates };
      return items[index];
    },
    
    delete: async (id: number | string): Promise<boolean> => {
      await delay(300);
      
      const initialLength = items.length;
      const filtered = items.filter(item => item[primaryKey] !== id);
      
      if (filtered.length === initialLength) return false;
      
      // Replace the array contents
      items.length = 0;
      items.push(...filtered);
      return true;
    }
  };
};

// Create services for each entity
export const businessService = generateCrudService(businesses, 'B_ID');
export const productService = generateCrudService(products, 'P_ID');
export const customerService = generateCrudService(customers, 'C_ID');
export const offerService = generateCrudService(offers, 'offer_id');
export const transactionService = generateCrudService(transactions, 'T_ID');
export const redemptionService = generateCrudService(redemptions, 'R_ID');
export const loyaltyService = generateCrudService(loyalties, 'L_ID');
export const tierSystemService = generateCrudService(tierSystems, 'tier_id');
export const customerTierService = generateCrudService(customerTiers, 'CT_ID');
export const referralProgramService = generateCrudService(referralPrograms, 'Referral_id');
export const feedbackService = generateCrudService(feedbacks, 'Feedback_id');
export const promotionService = generateCrudService(promotions, 'P_ID');
export const fraudDetectionService = generateCrudService(fraudDetections, 'Fraud_id');
export const analyticsService = generateCrudService(analytics, 'analytics_id');

// Additional business-specific queries
export const getBusinessOffers = async (businessId: number): Promise<Offer[]> => {
  await delay(300);
  return offers.filter(offer => offer.B_ID === businessId);
};

export const getBusinessFeedback = async (businessId: number): Promise<Feedback[]> => {
  await delay(300);
  return feedbacks.filter(feedback => feedback.B_ID === businessId);
};

export const getBusinessAnalytics = async (businessId: number): Promise<Analytics[]> => {
  await delay(300);
  return analytics.filter(analytic => analytic.B_ID === businessId);
};

// Additional customer-specific queries
export const getCustomerTransactions = async (customerId: number): Promise<Transaction[]> => {
  await delay(300);
  return transactions.filter(transaction => transaction.C_ID === customerId);
};

export const getCustomerTier = async (customerId: number): Promise<CustomerTier | undefined> => {
  await delay(300);
  return customerTiers.find(tier => tier.C_ID === customerId);
};

export const getCustomerReferrals = async (customerId: number): Promise<ReferralProgram[]> => {
  await delay(300);
  return referralPrograms.filter(referral => referral.Referred_C_id === customerId);
};

export const getCustomerFeedback = async (customerId: number): Promise<Feedback[]> => {
  await delay(300);
  return feedbacks.filter(feedback => feedback.C_ID === customerId);
};

export const getCustomerFraudDetections = async (customerId: number): Promise<FraudDetection[]> => {
  await delay(300);
  return fraudDetections.filter(fraud => fraud.C_ID === customerId);
};

// Additional transaction-specific queries
export const getTransactionRedemptions = async (transactionId: number): Promise<Redemption[]> => {
  await delay(300);
  return redemptions.filter(redemption => redemption.T_ID === transactionId);
};
