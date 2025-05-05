
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
import { Plus, Pencil, Trash, Percent } from 'lucide-react';
import { promotionService } from '@/services/api';
import { Promotion } from '@/types/models';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
})
.refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
  message: "End date must be after start date",
  path: ["end_date"],
});

type FormData = z.infer<typeof formSchema>;

const PromotionPage = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState<Promotion | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    const fetchPromotions = async () => {
      setIsLoading(true);
      try {
        const promotionsData = await promotionService.getAll();
        setPromotions(promotionsData);
      } catch (error) {
        console.error('Error fetching promotions:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load promotions',
          description: 'Please try again later',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPromotions();
  }, [toast]);

  useEffect(() => {
    if (currentPromotion) {
      form.reset({
        start_date: new Date(currentPromotion.start_date).toISOString().split('T')[0],
        end_date: new Date(currentPromotion.end_date).toISOString().split('T')[0],
      });
    } else {
      form.reset({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      });
    }
  }, [currentPromotion, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const promotionData = {
        start_date: data.start_date,
        end_date: data.end_date,
      };

      if (currentPromotion) {
        await promotionService.update(currentPromotion.P_ID, promotionData);
        toast({
          title: 'Promotion updated',
          description: `Promotion #${currentPromotion.P_ID} has been updated successfully`,
        });
      } else {
        await promotionService.create(promotionData);
        toast({
          title: 'Promotion created',
          description: 'New promotion has been added successfully',
        });
      }

      const updatedPromotions = await promotionService.getAll();
      setPromotions(updatedPromotions);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save promotion',
        description: 'Please try again',
      });
    }
  };

  const handleDelete = async (promotion: Promotion) => {
    if (window.confirm(`Are you sure you want to delete promotion #${promotion.P_ID}?`)) {
      try {
        await promotionService.delete(promotion.P_ID);
        
        const updatedPromotions = await promotionService.getAll();
        setPromotions(updatedPromotions);
        
        toast({
          title: 'Promotion deleted',
          description: `Promotion #${promotion.P_ID} has been removed`,
        });
      } catch (error) {
        console.error('Error deleting promotion:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to delete promotion',
          description: 'Please try again',
        });
      }
    }
  };

  const columns = [
    {
      header: 'ID',
      accessor: 'P_ID',
    },
    {
      header: 'Start Date',
      accessor: (promotion: Promotion) => {
        return new Date(promotion.start_date).toLocaleDateString();
      },
    },
    {
      header: 'End Date',
      accessor: (promotion: Promotion) => {
        return new Date(promotion.end_date).toLocaleDateString();
      },
    },
    {
      header: 'Duration (Days)',
      accessor: (promotion: Promotion) => {
        const start = new Date(promotion.start_date);
        const end = new Date(promotion.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays;
      },
    },
    {
      header: 'Status',
      accessor: (promotion: Promotion) => {
        const now = new Date();
        const startDate = new Date(promotion.start_date);
        const endDate = new Date(promotion.end_date);
        
        if (now < startDate) {
          return <span className="text-blue-500 font-medium">Upcoming</span>;
        } else if (now > endDate) {
          return <span className="text-red-500 font-medium">Expired</span>;
        } else {
          return <span className="text-green-500 font-medium">Active</span>;
        }
      },
    },
    {
      header: 'Actions',
      accessor: (promotion: Promotion) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentPromotion(promotion);
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
              handleDelete(promotion);
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
            <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
            <p className="text-muted-foreground">
              Manage promotional campaigns in the loyalty program
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentPromotion(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Promotion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {currentPromotion ? 'Edit Promotion' : 'Add Promotion'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
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
                      {currentPromotion ? 'Update' : 'Create'} Promotion
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <DataTable
          columns={columns}
          data={promotions}
          keyField="P_ID"
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default PromotionPage;
