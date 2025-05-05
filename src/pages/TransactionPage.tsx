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
import { Plus, Pencil, Trash, Receipt, IndianRupee } from 'lucide-react';
import { transactionService, customerService, productService } from '@/services/api';
import { Transaction, Customer, Product } from '@/types/models';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  C_ID: z.string().min(1, "Customer is required"),
  P_ID: z.string().min(1, "Product is required"),
  Amount: z.string().min(1, "Amount is required"),
  Date: z.string().min(1, "Date is required"),
});

type FormData = z.infer<typeof formSchema>;

const TransactionPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      C_ID: '',
      P_ID: '',
      Amount: '',
      Date: new Date().toISOString().slice(0, 16),
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [transactionsData, customersData, productsData] = await Promise.all([
          transactionService.getAll(),
          customerService.getAll(),
          productService.getAll(),
        ]);
        
        setTransactions(transactionsData);
        setCustomers(customersData);
        setProducts(productsData);
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
    if (currentTransaction) {
      const dateTime = new Date(currentTransaction.Date).toISOString().slice(0, 16);
      form.reset({
        C_ID: currentTransaction.C_ID.toString(),
        P_ID: currentTransaction.P_ID.toString(),
        Amount: currentTransaction.Amount.toString(),
        Date: dateTime,
      });
    } else {
      form.reset({
        C_ID: '',
        P_ID: '',
        Amount: '',
        Date: new Date().toISOString().slice(0, 16),
      });
    }
  }, [currentTransaction, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const transactionData = {
        C_ID: Number(data.C_ID),
        P_ID: Number(data.P_ID),
        Amount: Number(data.Amount),
        Date: data.Date,
      };

      if (currentTransaction) {
        await transactionService.update(currentTransaction.T_ID, transactionData);
        toast({
          title: 'Transaction updated',
          description: `Transaction #${currentTransaction.T_ID} has been updated successfully`,
        });
      } else {
        await transactionService.create(transactionData);
        toast({
          title: 'Transaction created',
          description: 'New transaction has been added successfully',
        });
      }

      const updatedTransactions = await transactionService.getAll();
      setTransactions(updatedTransactions);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save transaction',
        description: 'Please try again',
      });
    }
  };

  const handleDelete = async (transaction: Transaction) => {
    if (window.confirm(`Are you sure you want to delete transaction #${transaction.T_ID}?`)) {
      try {
        await transactionService.delete(transaction.T_ID);
        
        const updatedTransactions = await transactionService.getAll();
        setTransactions(updatedTransactions);
        
        toast({
          title: 'Transaction deleted',
          description: `Transaction #${transaction.T_ID} has been removed`,
        });
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to delete transaction',
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
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const columns = [
    {
      header: 'ID',
      accessor: (transaction: Transaction) => transaction.T_ID.toString(),
    },
    {
      header: 'Customer',
      accessor: (transaction: Transaction) => {
        const customer = customers.find((c) => c.C_ID === transaction.C_ID);
        return customer ? customer.name : '-';
      },
    },
    {
      header: 'Product',
      accessor: (transaction: Transaction) => {
        const product = products.find((p) => p.P_ID === transaction.P_ID);
        return product ? product.name : '-';
      },
    },
    {
      header: 'Amount',
      accessor: (transaction: Transaction) => (
        <div className="flex items-center">
          <IndianRupee className="h-4 w-4 mr-1" />
          {formatRupees(transaction.Amount)}
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: (transaction: Transaction) => {
        const date = new Date(transaction.Date);
        return date.toLocaleString();
      },
    },
    {
      header: 'Actions',
      accessor: (transaction: Transaction) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentTransaction(transaction);
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
              handleDelete(transaction);
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
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">
              Manage customer transactions in the loyalty program (in Indian Rupees)
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentTransaction(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {currentTransaction ? 'Edit Transaction' : 'Add Transaction'}
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
                          value={field.value || "placeholder"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="placeholder" disabled>Select a customer</SelectItem>
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
                  
                  <FormField
                    control={form.control}
                    name="P_ID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value || "placeholder"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="placeholder" disabled>Select a product</SelectItem>
                            {products.map((product) => (
                              <SelectItem key={product.P_ID} value={product.P_ID.toString()}>
                                {product.name}
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
                    name="Amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₹)</FormLabel>
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
                    name="Date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date & Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
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
                      {currentTransaction ? 'Update' : 'Create'} Transaction
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <DataTable
          columns={columns}
          data={transactions}
          keyField="T_ID"
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default TransactionPage;
