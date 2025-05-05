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
import { DataTable, Column } from '@/components/DataTable';
import { Plus, Pencil, Trash, UserPlus } from 'lucide-react';
import { referralProgramService, customerService } from '@/services/api';
import { ReferralProgram, Customer } from '@/types/models';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  Referred_id: z.string().min(1, "Referral ID is required"),
  Referred_C_id: z.string().min(1, "Customer is required"),
  Point_awarded: z.string().min(1, "Points awarded are required"),
  exp_date: z.string().min(1, "Expiration date is required"),
});

type FormData = z.infer<typeof formSchema>;

const ReferralPage = () => {
  const [referrals, setReferrals] = useState<ReferralProgram[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentReferral, setCurrentReferral] = useState<ReferralProgram | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Referred_id: '',
      Referred_C_id: '',
      Point_awarded: '250',
      exp_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [referralsData, customersData] = await Promise.all([
          referralProgramService.getAll(),
          customerService.getAll(),
        ]);
        
        setReferrals(referralsData);
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
    if (currentReferral) {
      form.reset({
        Referred_id: currentReferral.Referred_id.toString(),
        Referred_C_id: currentReferral.Referred_C_id ? currentReferral.Referred_C_id.toString() : 'none',
        Point_awarded: currentReferral.Point_awarded.toString(),
        exp_date: new Date(currentReferral.exp_date).toISOString().split('T')[0],
      });
    } else {
      form.reset({
        Referred_id: '',
        Referred_C_id: '',
        Point_awarded: '250',
        exp_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      });
    }
  }, [currentReferral, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const referralData = {
        Referred_id: Number(data.Referred_id),
        Referred_C_id: data.Referred_C_id && data.Referred_C_id !== 'none' ? Number(data.Referred_C_id) : null,
        Point_awarded: Number(data.Point_awarded),
        exp_date: data.exp_date,
      };

      if (currentReferral) {
        await referralProgramService.update(currentReferral.Referral_id, referralData);
        toast({
          title: 'Referral updated',
          description: `Referral #${currentReferral.Referral_id} has been updated successfully`,
        });
      } else {
        await referralProgramService.create(referralData);
        toast({
          title: 'Referral created',
          description: 'New referral has been added successfully',
        });
      }

      const updatedReferrals = await referralProgramService.getAll();
      setReferrals(updatedReferrals);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving referral:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save referral',
        description: 'Please try again',
      });
    }
  };

  const handleDelete = async (referral: ReferralProgram) => {
    if (window.confirm(`Are you sure you want to delete referral #${referral.Referral_id}?`)) {
      try {
        await referralProgramService.delete(referral.Referral_id);
        
        const updatedReferrals = await referralProgramService.getAll();
        setReferrals(updatedReferrals);
        
        toast({
          title: 'Referral deleted',
          description: `Referral #${referral.Referral_id} has been removed`,
        });
      } catch (error) {
        console.error('Error deleting referral:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to delete referral',
          description: 'Please try again',
        });
      }
    }
  };

  const columns: Column<ReferralProgram>[] = [
    {
      header: 'ID',
      accessor: 'Referral_id',
    },
    {
      header: 'Referred ID',
      accessor: 'Referred_id',
    },
    {
      header: 'Referred Customer',
      accessor: (referral: ReferralProgram) => {
        const customer = customers.find((c) => c.C_ID === referral.Referred_C_id);
        return customer ? customer.name : '-';
      },
    },
    {
      header: 'Points Awarded',
      accessor: 'Point_awarded',
    },
    {
      header: 'Expiration Date',
      accessor: (referral: ReferralProgram) => {
        return new Date(referral.exp_date).toLocaleDateString();
      },
    },
    {
      header: 'Status',
      accessor: (referral: ReferralProgram) => {
        const now = new Date();
        const expDate = new Date(referral.exp_date);
        return now > expDate ? 
          <span className="text-red-500 font-medium">Expired</span> : 
          <span className="text-green-500 font-medium">Active</span>;
      },
    },
    {
      header: 'Actions',
      accessor: (referral: ReferralProgram) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentReferral(referral);
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
              handleDelete(referral);
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
            <h1 className="text-3xl font-bold tracking-tight">Referrals</h1>
            <p className="text-muted-foreground">
              Manage customer referrals in the loyalty program
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentReferral(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Referral
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {currentReferral ? 'Edit Referral' : 'Add Referral'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="Referred_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referred ID</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="Referred_C_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referred Customer</FormLabel>
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
                            <SelectItem value="none">No customer</SelectItem>
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
                    name="Point_awarded"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Awarded</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="exp_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date</FormLabel>
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
                      {currentReferral ? 'Update' : 'Create'} Referral
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <DataTable
          columns={columns}
          data={referrals}
          keyField="Referral_id"
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default ReferralPage;
