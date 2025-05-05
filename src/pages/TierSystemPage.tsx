
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
import { DataTable } from '@/components/DataTable';
import { Plus, Pencil, Trash, Star } from 'lucide-react';
import { tierSystemService } from '@/services/api';
import { TierSystem } from '@/types/models';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, "Tier name is required"),
  benefits: z.string().min(1, "Benefits are required"),
});

type FormData = z.infer<typeof formSchema>;

const TierSystemPage = () => {
  const [tiers, setTiers] = useState<TierSystem[]>([]);
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
    const fetchTiers = async () => {
      setIsLoading(true);
      try {
        const tiersData = await tierSystemService.getAll();
        setTiers(tiersData);
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
    
    fetchTiers();
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
          description: `${data.name} tier has been updated successfully`,
        });
      } else {
        await tierSystemService.create(tierData);
        toast({
          title: 'Tier created',
          description: `${data.name} tier has been added successfully`,
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
    if (window.confirm(`Are you sure you want to delete ${tier.name} tier?`)) {
      try {
        await tierSystemService.delete(tier.tier_id);
        
        const updatedTiers = await tierSystemService.getAll();
        setTiers(updatedTiers);
        
        toast({
          title: 'Tier deleted',
          description: `${tier.name} tier has been removed`,
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

  const getStarsByTierName = (tierName: string): React.ReactNode => {
    const tierNameLower = tierName.toLowerCase();
    let stars = 1;
    
    if (tierNameLower.includes('silver')) stars = 2;
    else if (tierNameLower.includes('gold')) stars = 3;
    else if (tierNameLower.includes('platinum')) stars = 4;
    else if (tierNameLower.includes('diamond')) stars = 5;
    
    return (
      <div className="flex">
        {Array(stars).fill(0).map((_, i) => (
          <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
        ))}
      </div>
    );
  };

  const columns = [
    {
      header: 'ID',
      accessor: 'tier_id',
    },
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Tier Level',
      accessor: (tier: TierSystem) => getStarsByTierName(tier.name),
    },
    {
      header: 'Benefits',
      accessor: 'benefits',
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
              Manage customer tiers in the loyalty program
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
                          <Textarea rows={4} {...field} />
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
