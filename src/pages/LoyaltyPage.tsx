
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
import { Plus, Pencil, Trash, Award } from 'lucide-react';
import { loyaltyService } from '@/services/api';
import { Loyalty } from '@/types/models';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  points: z.string().min(1, "Points are required"),
  issue_date: z.string().min(1, "Issue date is required"),
  exp_date: z.string().min(1, "Expiration date is required"),
});

type FormData = z.infer<typeof formSchema>;

const LoyaltyPage = () => {
  const [loyalties, setLoyalties] = useState<Loyalty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentLoyalty, setCurrentLoyalty] = useState<Loyalty | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      points: '',
      issue_date: new Date().toISOString().split('T')[0],
      exp_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    const fetchLoyalties = async () => {
      setIsLoading(true);
      try {
        const loyaltiesData = await loyaltyService.getAll();
        setLoyalties(loyaltiesData);
      } catch (error) {
        console.error('Error fetching loyalty points:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load loyalty points',
          description: 'Please try again later',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLoyalties();
  }, [toast]);

  useEffect(() => {
    if (currentLoyalty) {
      form.reset({
        points: currentLoyalty.points.toString(),
        issue_date: new Date(currentLoyalty.issue_date).toISOString().split('T')[0],
        exp_date: new Date(currentLoyalty.exp_date).toISOString().split('T')[0],
      });
    } else {
      form.reset({
        points: '',
        issue_date: new Date().toISOString().split('T')[0],
        exp_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      });
    }
  }, [currentLoyalty, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const loyaltyData = {
        points: Number(data.points),
        issue_date: data.issue_date,
        exp_date: data.exp_date,
      };

      if (currentLoyalty) {
        await loyaltyService.update(currentLoyalty.L_ID, loyaltyData);
        toast({
          title: 'Loyalty points updated',
          description: `Loyalty points ID #${currentLoyalty.L_ID} has been updated successfully`,
        });
      } else {
        await loyaltyService.create(loyaltyData);
        toast({
          title: 'Loyalty points created',
          description: 'New loyalty points have been added successfully',
        });
      }

      const updatedLoyalties = await loyaltyService.getAll();
      setLoyalties(updatedLoyalties);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving loyalty points:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save loyalty points',
        description: 'Please try again',
      });
    }
  };

  const handleDelete = async (loyalty: Loyalty) => {
    if (window.confirm(`Are you sure you want to delete loyalty points ID #${loyalty.L_ID}?`)) {
      try {
        await loyaltyService.delete(loyalty.L_ID);
        
        const updatedLoyalties = await loyaltyService.getAll();
        setLoyalties(updatedLoyalties);
        
        toast({
          title: 'Loyalty points deleted',
          description: `Loyalty points ID #${loyalty.L_ID} has been removed`,
        });
      } catch (error) {
        console.error('Error deleting loyalty points:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to delete loyalty points',
          description: 'Please try again',
        });
      }
    }
  };

  const columns = [
    {
      header: 'ID',
      accessor: 'L_ID',
    },
    {
      header: 'Points',
      accessor: 'points',
    },
    {
      header: 'Issue Date',
      accessor: (loyalty: Loyalty) => {
        return new Date(loyalty.issue_date).toLocaleDateString();
      },
    },
    {
      header: 'Expiration Date',
      accessor: (loyalty: Loyalty) => {
        return new Date(loyalty.exp_date).toLocaleDateString();
      },
    },
    {
      header: 'Status',
      accessor: (loyalty: Loyalty) => {
        const now = new Date();
        const expDate = new Date(loyalty.exp_date);
        return now > expDate ? 
          <span className="text-red-500 font-medium">Expired</span> : 
          <span className="text-green-500 font-medium">Active</span>;
      },
    },
    {
      header: 'Actions',
      accessor: (loyalty: Loyalty) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentLoyalty(loyalty);
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
              handleDelete(loyalty);
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
            <h1 className="text-3xl font-bold tracking-tight">Loyalty Points</h1>
            <p className="text-muted-foreground">
              Manage loyalty points in the program
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentLoyalty(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Loyalty Points
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {currentLoyalty ? 'Edit Loyalty Points' : 'Add Loyalty Points'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="issue_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                      {currentLoyalty ? 'Update' : 'Create'} Loyalty Points
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <DataTable
          columns={columns}
          data={loyalties}
          keyField="L_ID"
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default LoyaltyPage;
