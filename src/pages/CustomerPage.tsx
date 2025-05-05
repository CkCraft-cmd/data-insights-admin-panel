
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
import { DataTable } from '@/components/DataTable';
import { Plus, Pencil, Trash, User } from 'lucide-react';
import { customerService } from '@/services/api';
import { Customer } from '@/types/models';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  join_date: z.string().min(1, "Join date is required"),
});

type FormData = z.infer<typeof formSchema>;

const CustomerPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      join_date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const customersData = await customerService.getAll();
        setCustomers(customersData);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load customers',
          description: 'Please try again later',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomers();
  }, [toast]);

  useEffect(() => {
    if (currentCustomer) {
      form.reset({
        name: currentCustomer.name,
        email: currentCustomer.email,
        phone: currentCustomer.phone,
        join_date: new Date(currentCustomer.join_date).toISOString().split('T')[0],
      });
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        join_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [currentCustomer, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const customerData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        join_date: data.join_date,
      };

      if (currentCustomer) {
        await customerService.update(currentCustomer.C_ID, customerData);
        toast({
          title: 'Customer updated',
          description: `${data.name} has been updated successfully`,
        });
      } else {
        await customerService.create(customerData);
        toast({
          title: 'Customer created',
          description: `${data.name} has been added successfully`,
        });
      }

      const updatedCustomers = await customerService.getAll();
      setCustomers(updatedCustomers);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save customer',
        description: 'Please try again',
      });
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      try {
        await customerService.delete(customer.C_ID);
        
        const updatedCustomers = await customerService.getAll();
        setCustomers(updatedCustomers);
        
        toast({
          title: 'Customer deleted',
          description: `${customer.name} has been removed`,
        });
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to delete customer',
          description: 'Please try again',
        });
      }
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Phone',
      accessor: 'phone',
    },
    {
      header: 'Join Date',
      accessor: (customer: Customer) => {
        const date = new Date(customer.join_date);
        return date.toLocaleDateString();
      },
    },
    {
      header: 'Actions',
      accessor: (customer: Customer) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentCustomer(customer);
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
              handleDelete(customer);
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
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">
              Manage customers in the loyalty program
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentCustomer(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {currentCustomer ? 'Edit Customer' : 'Add Customer'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="join_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Join Date</FormLabel>
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
                      {currentCustomer ? 'Update' : 'Create'} Customer
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <DataTable
          columns={columns}
          data={customers}
          keyField="C_ID"
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default CustomerPage;
