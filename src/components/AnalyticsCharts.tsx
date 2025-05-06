import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Analytics, Business } from '@/types/models';
import { IndianRupee } from 'lucide-react';
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

interface AnalyticsChartsProps {
  analytics: Analytics[];
  businesses: Business[];
}

const COLORS = ['#8B5CF6', '#D946EF', '#F97316', '#0EA5E9', '#9b87f5', '#7E69AB', '#6E59A5'];

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ analytics, businesses }) => {
  // Format currency in Indian Rupees
  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Prepare data for the charts
  const chartData = useMemo(() => {
    return analytics.map(analytic => {
      const business = businesses.find(b => b.B_ID === analytic.B_ID);
      return {
        name: business?.name || `Business ${analytic.B_ID}`,
        revenue: analytic.total_revenue,
        transactions: analytic.transaction_count,
        date: new Date(analytic.reporting_date).toLocaleDateString(),
        B_ID: analytic.B_ID
      };
    });
  }, [analytics, businesses]);

  // Prepare data for the revenue by business pie chart
  const revenueByBusinessData = useMemo(() => {
    const businessMap = new Map<number, { name: string; revenue: number }>();
    
    analytics.forEach(analytic => {
      const business = businesses.find(b => b.B_ID === analytic.B_ID);
      const businessName = business?.name || `Business ${analytic.B_ID}`;
      
      if (businessMap.has(analytic.B_ID)) {
        const existing = businessMap.get(analytic.B_ID)!;
        businessMap.set(analytic.B_ID, {
          name: businessName,
          revenue: existing.revenue + analytic.total_revenue
        });
      } else {
        businessMap.set(analytic.B_ID, {
          name: businessName,
          revenue: analytic.total_revenue
        });
      }
    });
    
    return Array.from(businessMap.values());
  }, [analytics, businesses]);

  // Prepare data for the transactions over time line chart
  const timeSeriesData = useMemo(() => {
    const dateMap = new Map<string, { date: string; transactions: number; revenue: number }>();
    
    analytics.forEach(analytic => {
      const date = new Date(analytic.reporting_date).toLocaleDateString();
      
      if (dateMap.has(date)) {
        const existing = dateMap.get(date)!;
        dateMap.set(date, {
          date,
          transactions: existing.transactions + analytic.transaction_count,
          revenue: existing.revenue + analytic.total_revenue
        });
      } else {
        dateMap.set(date, {
          date,
          transactions: analytic.transaction_count,
          revenue: analytic.total_revenue
        });
      }
    });
    
    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [analytics]);

  // Custom tooltip formatter for the revenue chart
  const revenueTooltipFormatter = (value: number) => {
    return formatRupees(value);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 mb-6">
      {/* Revenue by Business Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Revenue by Business</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueByBusinessData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {revenueByBusinessData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={revenueTooltipFormatter} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Count by Business Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Transaction Count by Business</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="transactions" fill="#8B5CF6" name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Timeline */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="date" 
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                  width={80}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  formatter={(value: any) => formatRupees(value)}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#8B5CF6"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsCharts;
