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
import { Textarea } from '@/components/ui/textarea';
import { DataTable, Column } from '@/components/DataTable';
import { Plus, Pencil, Trash, Users } from 'lucide-react';
import { tierSystemService, customerTierService } from '@/services/api';
import { TierSystem, CustomerTier } from '@/types/models';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define form schema
const formSchema = z.object({
  name: z.string().min(1, "Tier name is required"),
  benefits: z.string().min(1, "Benefits description is required"),
});

type FormData = z.infer<typeof formSchema>;

const TierSystemPage = () => {
  const [tiers, setTiers] = useState<TierSystem[]>([]);
  const [customerTiers, setCustomerTiers] = useState<CustomerTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTier, setCurrentTier] = useState<TierSystem | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      benefits: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [tiersData, customerTiersData] = await Promise.all([
          tierSystemService.getAll(),
          customerTierService.getAll(),
        ]);
        
        setTiers(tiersData);
        setCustomerTiers(customerTiersData);
      } catch (error) {
        console.error('Error fetching tiers:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load tiers',
          description: 'Please try again later',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  useEffect(() => {
    if (currentTier) {
      form.reset({
        name: currentTier.name,
        benefits: currentTier.benefits,
      });
    } else {
      form.reset({
        name: '',
        benefits: '',
      });
    }
  }, [currentTier, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const tierData = {
        name: data.name,
        benefits: data.benefits,
      };

      if (currentTier) {
        await tierSystemService.update(currentTier.tier_id, tierData);
        toast({
          title: 'Tier updated',
          description: `${data.name} has been updated successfully`,
        });
      } else {
        await tierSystemService.create(tierData);
        toast({
          title: 'Tier created',
          description: `${data.name} has been added successfully`,
        });
      }

      const updatedTiers = await tierSystemService.getAll();
      setTiers(updatedTiers);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving tier:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save tier',
        description: 'Please try again',
      });
    }
  };

  const handleDelete = async (tier: TierSystem) => {
    if (window.confirm(`Are you sure you want to delete ${tier.name}?`)) {
      try {
        await tierSystemService.delete(tier.tier_id);
        
        const updatedTiers = await tierSystemService.getAll();
        setTiers(updatedTiers);
        
        toast({
          title: 'Tier deleted',
          description: `${tier.name} has been removed`,
        });
      } catch (error) {
        console.error('Error deleting tier:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to delete tier',
          description: 'Please try again',
        });
      }
    }
  };

  const columns: Column<TierSystem>[] = [
    {
      header: 'ID',
      accessor: 'tier_id',
    },
    {
      header: 'Tier Name',
      accessor: 'name',
    },
    {
      header: 'Benefits',
      accessor: 'benefits',
    },
    {
      header: 'Total Customers',
      accessor: (tier: TierSystem) => {
        // Get count of customers in this tier
        const count = customerTiers.filter(ct => ct.tier_id === tier.tier_id).length;
        return count;
      },
    },
    {
      header: 'Actions',
      accessor: (tier: TierSystem) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentTier(tier);
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
              handleDelete(tier);
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
            <h1 className="text-3xl font-bold tracking-tight">Tier System</h1>
            <p className="text-muted-foreground">
              Manage loyalty tier system and benefits
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentTier(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Tier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {currentTier ? 'Edit Tier' : 'Add Tier'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tier Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="benefits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Benefits</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
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
                      {currentTier ? 'Update' : 'Create'} Tier
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <DataTable
          columns={columns}
          data={tiers}
          keyField="tier_id"
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default TierSystemPage;
