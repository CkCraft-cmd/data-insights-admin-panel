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
import { DataTable, Column } from '@/components/DataTable';
import { Plus, Pencil, Trash, BarChart, IndianRupee, RefreshCw } from 'lucide-react';
import { analyticsService, businessService } from '@/services/api';
import { Analytics, Business } from '@/types/models';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AnalyticsCharts from '@/components/AnalyticsCharts';

// Define form schema
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAnalytic, setCurrentAnalytic] = useState<Analytics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
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

  const fetchData = async (showLoadingState = true) => {
    if (showLoadingState) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      const [analyticsData, businessesData] = await Promise.all([
        analyticsService.getAll(),
        businessService.getAll(),
      ]);
      
      setAnalytics(analyticsData);
      setBusinesses(businessesData);
      setLastUpdated(new Date());
      
      if (!showLoadingState) {
        toast({
          title: 'Data refreshed',
          description: 'Analytics data has been updated',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load data',
        description: 'Please try again later',
      });
    } finally {
      if (showLoadingState) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  // Set up auto-refresh interval (every 30 seconds)
  useEffect(() => {
    fetchData();
    
    const intervalId = setInterval(() => {
      fetchData(false);
    }, 30000); // 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

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
          description: 'New analytics have been added successfully',
        });
      }

      // Refresh data after changes
      fetchData(false);
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
        toast({
          title: 'Analytics deleted',
          description: `Analytics #${analytic.analytics_id} has been removed`,
        });
        
        // Refresh data after deletion
        fetchData(false);
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

  const handleRefresh = () => {
    fetchData(false);
  };

  // Format currency in Indian Rupees instead of USD
  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const columns: Column<Analytics>[] = [
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
      accessor: (analytic: Analytics) => {
        return (
          <div className="flex items-center">
            <IndianRupee className="h-4 w-4 mr-1" />
            {formatRupees(analytic.total_revenue)}
          </div>
        );
      },
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
              Track and manage business analytics (in Indian Rupees)
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            
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
                          <FormControl>
                            {/* Replace with Select component */}
                            <Input {...field} />
                          </FormControl>
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
                              <Input className="pl-10" type="number" {...field} />
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
        </div>
        
        {/* Add the Analytics Charts section */}
        {!isLoading && analytics.length > 0 && (
          <>
            <AnalyticsCharts analytics={analytics} businesses={businesses} />
            <div className="text-xs text-gray-500 text-right">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </>
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
