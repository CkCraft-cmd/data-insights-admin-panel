
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
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
import { Textarea } from '@/components/ui/textarea';
import { DataTable, Column } from '@/components/DataTable';
import { Plus, Pencil, Trash } from 'lucide-react';
import { businessService, offerService } from '@/services/api';
import { Business, Offer } from '@/types/models';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define form schema
const formSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  phone: z.string().min(1, "Phone number is required"),
  industry: z.string().optional(),
  address: z.string().optional(),
  offer_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const BusinessPage = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      industry: '',
      address: '',
      offer_id: '',
    },
  });

  // Fetch businesses and offers
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [businessesData, offersData] = await Promise.all([
          businessService.getAll(),
          offerService.getAll(),
        ]);
        
        setBusinesses(businessesData);
        setOffers(offersData);
      } catch (error) {
        console.error('Error fetching businesses:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load businesses',
          description: 'Please try again later',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  // Set form values when editing a business
  useEffect(() => {
    if (currentBusiness) {
      form.reset({
        name: currentBusiness.name,
        phone: currentBusiness.phone,
        industry: currentBusiness.industry || '',
        address: currentBusiness.address || '',
        offer_id: currentBusiness.offer_id ? String(currentBusiness.offer_id) : '',
      });
    } else {
      form.reset({
        name: '',
        phone: '',
        industry: '',
        address: '',
        offer_id: '',
      });
    }
  }, [currentBusiness, form]);

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    try {
      const businessData = {
        name: data.name,
        phone: data.phone,
        industry: data.industry || null,
        address: data.address || null,
        offer_id: data.offer_id ? Number(data.offer_id) : null,
      };

      if (currentBusiness) {
        // Update existing business
        await businessService.update(currentBusiness.B_ID, businessData);
        toast({
          title: 'Business updated',
          description: `${data.name} has been updated successfully`,
        });
      } else {
        // Create new business
        await businessService.create(businessData);
        toast({
          title: 'Business created',
          description: `${data.name} has been added successfully`,
        });
      }

      // Refresh business list
      const updatedBusinesses = await businessService.getAll();
      setBusinesses(updatedBusinesses);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving business:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save business',
        description: 'Please try again',
      });
    }
  };

  // Handle business deletion
  const handleDelete = async (business: Business) => {
    if (window.confirm(`Are you sure you want to delete ${business.name}?`)) {
      try {
        await businessService.delete(business.B_ID);
        
        // Refresh business list
        const updatedBusinesses = await businessService.getAll();
        setBusinesses(updatedBusinesses);
        
        toast({
          title: 'Business deleted',
          description: `${business.name} has been removed`,
        });
      } catch (error) {
        console.error('Error deleting business:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to delete business',
          description: 'Please try again',
        });
      }
    }
  };

  // Define columns for the data table
  const columns: Column<Business>[] = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Phone',
      accessor: 'phone',
    },
    {
      header: 'Industry',
      accessor: (business) => business.industry || '-',
    },
    {
      header: 'Offer',
      accessor: (business) => {
        const offer = offers.find((o) => o.offer_id === business.offer_id);
        return offer ? offer.O_name : '-';
      },
    },
    {
      header: 'Actions',
      accessor: (business) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentBusiness(business);
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
              handleDelete(business);
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
            <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
            <p className="text-muted-foreground">
              Manage partner businesses in the loyalty program
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentBusiness(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Business
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {currentBusiness ? 'Edit Business' : 'Add Business'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="offer_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Offer</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an offer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">No offer</SelectItem>
                              {offers.map((offer) => (
                                <SelectItem key={offer.offer_id} value={offer.offer_id.toString()}>
                                  {offer.O_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
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
                      {currentBusiness ? 'Update' : 'Create'} Business
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <DataTable<Business>
          columns={columns}
          data={businesses}
          keyField="B_ID"
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default BusinessPage;
