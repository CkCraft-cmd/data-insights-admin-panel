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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, Column } from '@/components/DataTable';
import { Plus, Pencil, Trash, MessageSquare } from 'lucide-react';
import { feedbackService, businessService, customerService } from '@/services/api';
import { Feedback, Business, Customer } from '@/types/models';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  B_ID: z.string().min(1, "Business is required"),
  C_ID: z.string().min(1, "Customer is required"),
});

type FormData = z.infer<typeof formSchema>;

const FeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<Feedback | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      B_ID: '',
      C_ID: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [feedbacksData, businessesData, customersData] = await Promise.all([
          feedbackService.getAll(),
          businessService.getAll(),
          customerService.getAll(),
        ]);
        
        setFeedbacks(feedbacksData);
        setBusinesses(businessesData);
        setCustomers(customersData);
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
    if (currentFeedback) {
      form.reset({
        B_ID: currentFeedback.B_ID ? currentFeedback.B_ID.toString() : '',
        C_ID: currentFeedback.C_ID ? currentFeedback.C_ID.toString() : '',
      });
    } else {
      form.reset({
        B_ID: '',
        C_ID: '',
      });
    }
  }, [currentFeedback, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const feedbackData = {
        B_ID: Number(data.B_ID),
        C_ID: Number(data.C_ID),
      };

      if (currentFeedback) {
        await feedbackService.update(currentFeedback.Feedback_id, feedbackData);
        toast({
          title: 'Feedback updated',
          description: `Feedback #${currentFeedback.Feedback_id} has been updated successfully`,
        });
      } else {
        await feedbackService.create(feedbackData);
        toast({
          title: 'Feedback created',
          description: 'New feedback has been added successfully',
        });
      }

      const updatedFeedbacks = await feedbackService.getAll();
      setFeedbacks(updatedFeedbacks);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save feedback',
        description: 'Please try again',
      });
    }
  };

  const handleDelete = async (feedback: Feedback) => {
    if (window.confirm(`Are you sure you want to delete feedback #${feedback.Feedback_id}?`)) {
      try {
        await feedbackService.delete(feedback.Feedback_id);
        
        const updatedFeedbacks = await feedbackService.getAll();
        setFeedbacks(updatedFeedbacks);
        
        toast({
          title: 'Feedback deleted',
          description: `Feedback #${feedback.Feedback_id} has been removed`,
        });
      } catch (error) {
        console.error('Error deleting feedback:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to delete feedback',
          description: 'Please try again',
        });
      }
    }
  };

  const columns: Column<Feedback>[] = [
    {
      header: 'ID',
      accessor: 'Feedback_id',
    },
    {
      header: 'Business',
      accessor: (feedback: Feedback) => {
        const business = businesses.find((b) => b.B_ID === feedback.B_ID);
        return business ? business.name : '-';
      },
    },
    {
      header: 'Customer',
      accessor: (feedback: Feedback) => {
        const customer = customers.find((c) => c.C_ID === feedback.C_ID);
        return customer ? customer.name : '-';
      },
    },
    {
      header: 'Actions',
      accessor: (feedback: Feedback) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentFeedback(feedback);
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
              handleDelete(feedback);
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
            <h1 className="text-3xl font-bold tracking-tight">Customer Feedback</h1>
            <p className="text-muted-foreground">
              Manage customer feedback for businesses
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentFeedback(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Feedback
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {currentFeedback ? 'Edit Feedback' : 'Add Feedback'}
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
                    name="C_ID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.C_ID} value={customer.C_ID.toString()}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      {currentFeedback ? 'Update' : 'Create'} Feedback
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <DataTable
          columns={columns}
          data={feedbacks}
          keyField="Feedback_id"
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default FeedbackPage;
