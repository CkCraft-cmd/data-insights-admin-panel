
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
import { Plus, Pencil, Trash, Tag } from 'lucide-react';
import { offerService, businessService } from '@/services/api';
import { Offer, Business } from '@/types/models';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  O_name: z.string().min(1, "Offer name is required"),
  B_ID: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const OfferPage = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      O_name: '',
      B_ID: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [offersData, businessesData] = await Promise.all([
          offerService.getAll(),
          businessService.getAll(),
        ]);
        
        setOffers(offersData);
        setBusinesses(businessesData);
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
    if (currentOffer) {
      form.reset({
        O_name: currentOffer.O_name,
        B_ID: currentOffer.B_ID ? String(currentOffer.B_ID) : '',
      });
    } else {
      form.reset({
        O_name: '',
        B_ID: '',
      });
    }
  }, [currentOffer, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const offerData = {
        O_name: data.O_name,
        B_ID: data.B_ID ? Number(data.B_ID) : null,
      };

      if (currentOffer) {
        await offerService.update(currentOffer.offer_id, offerData);
        toast({
          title: 'Offer updated',
          description: `${data.O_name} has been updated successfully`,
        });
      } else {
        await offerService.create(offerData);
        toast({
          title: 'Offer created',
          description: `${data.O_name} has been added successfully`,
        });
      }

      const updatedOffers = await offerService.getAll();
      setOffers(updatedOffers);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving offer:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save offer',
        description: 'Please try again',
      });
    }
  };

  const handleDelete = async (offer: Offer) => {
    if (window.confirm(`Are you sure you want to delete ${offer.O_name}?`)) {
      try {
        await offerService.delete(offer.offer_id);
        
        const updatedOffers = await offerService.getAll();
        setOffers(updatedOffers);
        
        toast({
          title: 'Offer deleted',
          description: `${offer.O_name} has been removed`,
        });
      } catch (error) {
        console.error('Error deleting offer:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to delete offer',
          description: 'Please try again',
        });
      }
    }
  };

  const columns = [
    {
      header: 'Offer Name',
      accessor: 'O_name',
    },
    {
      header: 'Business',
      accessor: (offer: Offer) => {
        const business = businesses.find((b) => b.B_ID === offer.B_ID);
        return business ? business.name : '-';
      },
    },
    {
      header: 'Actions',
      accessor: (offer: Offer) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentOffer(offer);
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
              handleDelete(offer);
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
            <h1 className="text-3xl font-bold tracking-tight">Offers</h1>
            <p className="text-muted-foreground">
              Manage promotional offers in the loyalty program
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentOffer(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {currentOffer ? 'Edit Offer' : 'Add Offer'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="O_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                            <SelectItem value="">No business</SelectItem>
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
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {currentOffer ? 'Update' : 'Create'} Offer
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <DataTable
          columns={columns}
          data={offers}
          keyField="offer_id"
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default OfferPage;
