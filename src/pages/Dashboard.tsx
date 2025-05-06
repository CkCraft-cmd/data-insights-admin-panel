import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  Store, 
  Package, 
  Receipt, 
  TrendingUp,
  Award,
  RefreshCw,
  IndianRupee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  customerService, 
  businessService, 
  productService, 
  transactionService, 
  tierSystemService,
  analyticsService
} from '@/services/api';
import { Customer, Business, Product, Transaction, Analytics, TierSystem } from '@/types/models';
import { useToast } from '@/hooks/use-toast';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  trend?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, description, trend }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="p-2 bg-primary/10 rounded-full text-primary">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
      {trend && (
        <div className="flex items-center mt-2">
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-xs text-green-500">{trend}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tiers, setTiers] = useState<TierSystem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [customersData, businessesData, productsData, transactionsData, tiersData, analyticsData] = await Promise.all([
        customerService.getAll(),
        businessService.getAll(),
        productService.getAll(),
        transactionService.getAll(),
        tierSystemService.getAll(),
        analyticsService.getAll(),
      ]);
      
      setCustomers(customersData);
      setBusinesses(businessesData);
      setProducts(productsData);
      setTransactions(transactionsData);
      setTiers(tiersData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading dashboard',
        description: 'Failed to fetch the latest data. Please try again.',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // Format currency in Indian Rupees
  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate total revenue from transactions
  const totalRevenue = transactions.reduce((sum, transaction) => sum + transaction.Amount, 0);
  
  // Calculate total analytics revenue
  const analyticsTotalRevenue = analytics.reduce((sum, analytic) => sum + analytic.total_revenue, 0);

  // Get most recent customers
  const recentCustomers = [...customers].sort((a, b) => 
    new Date(b.join_date).getTime() - new Date(a.join_date).getTime()
  ).slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your loyalty management system</p>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Stats overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StatsCard
                title="Total Customers"
                value={customers.length}
                icon={<Users className="h-4 w-4" />}
                description="Active customer accounts"
                trend="+12% from last month"
              />
              <StatsCard
                title="Total Businesses"
                value={businesses.length}
                icon={<Store className="h-4 w-4" />}
                description="Registered businesses"
              />
              <StatsCard
                title="Products"
                value={products.length}
                icon={<Package className="h-4 w-4" />}
                description="Products in catalog"
              />
              <StatsCard
                title="Transactions"
                value={transactions.length}
                icon={<Receipt className="h-4 w-4" />}
                description="Completed transactions"
                trend="+5% from last week"
              />
              <StatsCard
                title="Total Revenue"
                value={
                  <div className="flex items-center">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    {formatRupees(totalRevenue).replace('₹', '')}
                  </div>
                }
                icon={<TrendingUp className="h-4 w-4" />}
                description="Revenue from all transactions"
                trend="+8% from last month"
              />
              <StatsCard
                title="Loyalty Tiers"
                value={tiers.length}
                icon={<Award className="h-4 w-4" />}
                description="Active loyalty tiers"
              />
            </div>

            {/* Recent customers */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Customers</CardTitle>
                  <p className="text-sm text-muted-foreground">{customers.length} total</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentCustomers.length > 0 ? (
                      recentCustomers.map((customer) => (
                        <div key={customer.C_ID} className="flex items-center">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">{customer.email}</div>
                          </div>
                          <div className="ml-auto text-sm text-muted-foreground">
                            {new Date(customer.join_date).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">No customers found</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Business performance */}
              <Card className="col-span-1">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Business Performance</CardTitle>
                  <p className="text-sm text-muted-foreground">{businesses.length} total</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {businesses.length > 0 ? (
                      businesses.map((business) => {
                        const businessAnalytics = analytics.find(a => a.B_ID === business.B_ID);
                        const percentage = businessAnalytics && analyticsTotalRevenue > 0
                          ? (businessAnalytics.total_revenue / analyticsTotalRevenue) * 100 
                          : 0;
                        
                        return (
                          <div key={business.B_ID} className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">{business.name}</span>
                              <span className="text-sm text-muted-foreground flex items-center">
                                <IndianRupee className="h-3 w-3 mr-1" />
                                {businessAnalytics ? formatRupees(businessAnalytics.total_revenue).replace('₹', '') : '0.00'}
                              </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">No businesses found</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
