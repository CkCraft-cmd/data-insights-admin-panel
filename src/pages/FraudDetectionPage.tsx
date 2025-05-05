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
import { Plus, Pencil, Trash, AlertTriangle } from 'lucide-react';
import { fraudDetectionService, customerService } from '@/services/api';
import { FraudDetection, Customer } from '@/types/models';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  C_ID: z.string().min(1, "Customer is required"),
});

type FormData = z.infer<typeof formSchema>;

const FraudDetectionPage = () => {
  const [fraudCases, setFraudCases] = useState<FraudDetection[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentFraud, setCurrentFraud] = useState<FraudDetection | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      C_ID: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fraudData, customersData] = await Promise.all([
          fraudDetectionService.getAll(),
          customerService.getAll(),
        ]);
        
        setFraudCases(fraudData);
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
    if (currentFraud) {
      form.reset({
        C_ID: currentFraud.C_ID ? currentFraud.C_ID.toString() : '',
      });
    } else {
      form.reset({
        C_ID: '',
      });
    }
  }, [currentFraud, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const fraudData = {
        C_ID: Number(data.C_ID),
      };

      if (currentFraud) {
        await fraudDetectionService.update(currentFraud.Fraud_id, fraudData);
        toast({
          title: 'Fraud case updated',
          description: `Fraud case #${currentFraud.Fraud_id} has been updated successfully`,
        });
      } else {
        await fraudDetectionService.create(fraudData);
        toast({
          title: 'Fraud case created',
          description: 'New fraud case has been added successfully',
        });
      }

      const updatedFraudCases = await fraudDetectionService.getAll();
      setFraudCases(updatedFraudCases);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving fraud case:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save fraud case',
        description: 'Please try again',
      });
    }
  };

  const handleDelete = async (fraud: FraudDetection) => {
    if (window.confirm(`Are you sure you want to delete fraud case #${fraud.Fraud_id}?`)) {
      try {
        await fraudDetectionService.delete(fraud.Fraud_id);
        
        const updatedFraudCases = await fraudDetectionService.getAll();
        setFraudCases(updatedFraudCases);
        
        toast({
          title: 'Fraud case deleted',
          description: `Fraud case #${fraud.Fraud_id} has been removed`,
        });
      } catch (error) {
        console.error('Error deleting fraud case:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to delete fraud case',
          description: 'Please try again',
        });
      }
    }
  };

  // Count fraud cases by customer
  const getFraudCountByCustomer = (customerId: number): number => {
    return fraudCases.filter(fraud => fraud.C_ID === customerId).length;
  };

  const columns: Column<FraudDetection>[] = [
    {
      header: 'ID',
      accessor: 'Fraud_id',
    },
    {
      header: 'Customer',
      accessor: (fraud: FraudDetection) => {
        const customer = customers.find((c) => c.C_ID === fraud.C_ID);
        return customer ? customer.name : '-';
      },
    },
    {
      header: 'Customer Email',
      accessor: (fraud: FraudDetection) => {
        const customer = customers.find((c) => c.C_ID === fraud.C_ID);
        return customer ? customer.email : '-';
      },
    },
    {
      header: 'Total Flags',
      accessor: (fraud: FraudDetection) => {
        return fraud.C_ID ? getFraudCountByCustomer(fraud.C_ID) : 0;
      },
    },
    {
      header: 'Risk Level',
      accessor: (fraud: FraudDetection) => {
        const count = fraud.C_ID ? getFraudCountByCustomer(fraud.C_ID) : 0;
        
        if (count >= 3) {
          return <div className="flex items-center text-red-600 font-medium">
            <AlertTriangle className="h-4 w-4 mr-1" />
            High
          </div>;
        } else if (count === 2) {
          return <div className="flex items-center text-amber-500 font-medium">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Medium
          </div>;
        } else {
          return <div className="flex items-center text-green-500 font-medium">
            Low
          </div>;
        }
      },
    },
    {
      header: 'Actions',
      accessor: (fraud: FraudDetection) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentFraud(fraud);
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
              handleDelete(fraud);
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
            <h1 className="text-3xl font-bold tracking-tight">Fraud Detection</h1>
            <p className="text-muted-foreground">
              Monitor and manage fraud cases in the loyalty program
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentFraud(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Fraud Case
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {currentFraud ? 'Edit Fraud Case' : 'Add Fraud Case'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
                      {currentFraud ? 'Update' : 'Create'} Fraud Case
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <DataTable
          columns={columns}
          data={fraudCases}
          keyField="Fraud_id"
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default FraudDetectionPage;
