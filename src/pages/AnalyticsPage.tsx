
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/DataTable';
import { Plus, Pencil, Trash, BarChart3, IndianRupee, TrendingUp, TrendingDown } from 'lucide-react';
import { analyticsService, businessService } from '@/services/api';
import { Analytics, Business } from '@/types/models';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const formSchema = z.object({
  B_ID: z.string().min(1, "Business is required"),
  transaction_count: z.string().min(1, "Transaction count is required"),
  total_revenue: z.string().min(1, "Total revenue is required"),
  reporting_date: z.string().min(1, "Reporting date is required"),
});

type FormData = z.infer<typeof formSchema>;

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAnalytic, setCurrentAnalytic] = useState<Analytics | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      B_ID: '',
      transaction_count: '',
      total_revenue: '',
      reporting_date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [analyticsData, businessesData] = await Promise.all([
          analyticsService.getAll(),
          businessService.getAll(),
        ]);
        
        setAnalytics(analyticsData);
        setBusinesses(businessesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load data',
          description: 'Please try again later',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  useEffect(() => {
    if (currentAnalytic) {
      form.reset({
        B_ID: currentAnalytic.B_ID ? currentAnalytic.B_ID.toString() : '',
        transaction_count: currentAnalytic.transaction_count.toString(),
        total_revenue: currentAnalytic.total_revenue.toString(),
        reporting_date: new Date(currentAnalytic.reporting_date).toISOString().split('T')[0],
      });
    } else {
      form.reset({
        B_ID: '',
        transaction_count: '',
        total_revenue: '',
        reporting_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [currentAnalytic, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const analyticData = {
        B_ID: Number(data.B_ID),
        transaction_count: Number(data.transaction_count),
        total_revenue: Number(data.total_revenue),
        reporting_date: data.reporting_date,
      };

      if (currentAnalytic) {
        await analyticsService.update(currentAnalytic.analytics_id, analyticData);
        toast({
          title: 'Analytics updated',
          description: `Analytics #${currentAnalytic.analytics_id} has been updated successfully`,
        });
      } else {
        await analyticsService.create(analyticData);
        toast({
          title: 'Analytics created',
          description: 'New analytics entry has been added successfully',
        });
      }

      const updatedAnalytics = await analyticsService.getAll();
      setAnalytics(updatedAnalytics);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving analytics:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save analytics',
        description: 'Please try again',
      });
    }
  };

  const handleDelete = async (analytic: Analytics) => {
    if (window.confirm(`Are you sure you want to delete analytics #${analytic.analytics_id}?`)) {
      try {
        await analyticsService.delete(analytic.analytics_id);
        
        const updatedAnalytics = await analyticsService.getAll();
        setAnalytics(updatedAnalytics);
        
        toast({
          title: 'Analytics deleted',
          description: `Analytics #${analytic.analytics_id} has been removed`,
        });
      } catch (error) {
        console.error('Error deleting analytics:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to delete analytics',
          description: 'Please try again',
        });
      }
    }
  };

  // Format amount in rupees
  const formatRupees = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      maximumFractionDigits: 2 
    }).format(amount);
  };

  // Compare with previous entry to determine trend
  const getTrend = (analytic: Analytics): React.ReactNode => {
    const businessAnalytics = analytics
      .filter(a => a.B_ID === analytic.B_ID)
      .sort((a, b) => new Date(a.reporting_date).getTime() - new Date(b.reporting_date).getTime());
    
    const index = businessAnalytics.findIndex(a => a.analytics_id === analytic.analytics_id);
    
    if (index <= 0) return null; // No previous data to compare
    
    const current = analytic.total_revenue;
    const previous = businessAnalytics[index - 1].total_revenue;
    const percentChange = ((current - previous) / previous) * 100;
    
    if (percentChange > 0) {
      return (
        <div className="flex items-center text-green-500">
          <TrendingUp className="h-4 w-4 mr-1" />
          {percentChange.toFixed(2)}%
        </div>
      );
    } else if (percentChange < 0) {
      return (
        <div className="flex items-center text-red-500">
          <TrendingDown className="h-4 w-4 mr-1" />
          {Math.abs(percentChange).toFixed(2)}%
        </div>
      );
    } else {
      return <span>0%</span>;
    }
  };

  // Prepare data for charts
  const chartData = analytics
    .sort((a, b) => new Date(a.reporting_date).getTime() - new Date(b.reporting_date).getTime())
    .map(analytic => {
      const business = businesses.find(b => b.B_ID === analytic.B_ID);
      return {
        date: new Date(analytic.reporting_date).toLocaleDateString(),
        revenue: analytic.total_revenue,
        transactions: analytic.transaction_count,
        business: business ? business.name : `Business ${analytic.B_ID}`,
      };
    });

  const columns = [
    {
      header: 'ID',
      accessor: 'analytics_id',
    },
    {
      header: 'Business',
      accessor: (analytic: Analytics) => {
        const business = businesses.find((b) => b.B_ID === analytic.B_ID);
        return business ? business.name : '-';
      },
    },
    {
      header: 'Transaction Count',
      accessor: 'transaction_count',
    },
    {
      header: 'Revenue',
      accessor: (analytic: Analytics) => (
        <div className="flex items-center">
          <IndianRupee className="h-4 w-4 mr-1" />
          {formatRupees(analytic.total_revenue)}
        </div>
      ),
    },
    {
      header: 'Trend',
      accessor: (analytic: Analytics) => getTrend(analytic),
    },
    {
      header: 'Date',
      accessor: (analytic: Analytics) => {
        return new Date(analytic.reporting_date).toLocaleDateString();
      },
    },
    {
      header: 'Actions',
      accessor: (analytic: Analytics) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentAnalytic(analytic);
              setIsDialogOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(analytic);
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Track business performance in the loyalty program (in Indian Rupees)
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentAnalytic(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Analytics
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {currentAnalytic ? 'Edit Analytics' : 'Add Analytics'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="B_ID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a business" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businesses.map((business) => (
                              <SelectItem key={business.B_ID} value={business.B_ID.toString()}>
                                {business.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="transaction_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Count</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="total_revenue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Revenue (₹)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input className="pl-10" type="number" step="0.01" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reporting_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reporting Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {currentAnalytic ? 'Update' : 'Create'} Analytics
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {chartData.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="p-6 rounded-lg border bg-card shadow">
              <h2 className="text-lg font-semibold mb-4">Revenue Trend (₹)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis 
                    tickFormatter={(value) => `₹${value}`} 
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatRupees(value), "Revenue"]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    name="Revenue (₹)" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="p-6 rounded-lg border bg-card shadow">
              <h2 className="text-lg font-semibold mb-4">Transaction Count</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="transactions" 
                    fill="#82ca9d" 
                    name="Transactions" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        <DataTable
          columns={columns}
          data={analytics}
          keyField="analytics_id"
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
