
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
import { Plus, Pencil, Trash, Package } from 'lucide-react';
import { productService } from '@/services/api';
import { Product } from '@/types/models';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
});

type FormData = z.infer<typeof formSchema>;

const ProductPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: '',
    },
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const productsData = await productService.getAll();
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load products',
          description: 'Please try again later',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, [toast]);

  useEffect(() => {
    if (currentProduct) {
      form.reset({
        name: currentProduct.name,
        category: currentProduct.category,
      });
    } else {
      form.reset({
        name: '',
        category: '',
      });
    }
  }, [currentProduct, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const productData = {
        name: data.name,
        category: data.category,
      };

      if (currentProduct) {
        await productService.update(currentProduct.P_ID, productData);
        toast({
          title: 'Product updated',
          description: `${data.name} has been updated successfully`,
        });
      } else {
        await productService.create(productData);
        toast({
          title: 'Product created',
          description: `${data.name} has been added successfully`,
        });
      }

      const updatedProducts = await productService.getAll();
      setProducts(updatedProducts);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save product',
        description: 'Please try again',
      });
    }
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await productService.delete(product.P_ID);
        
        const updatedProducts = await productService.getAll();
        setProducts(updatedProducts);
        
        toast({
          title: 'Product deleted',
          description: `${product.name} has been removed`,
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to delete product',
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
      header: 'Category',
      accessor: 'category',
    },
    {
      header: 'Actions',
      accessor: (product: Product) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentProduct(product);
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
              handleDelete(product);
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
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              Manage products in the loyalty program
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentProduct(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {currentProduct ? 'Edit Product' : 'Add Product'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                      {currentProduct ? 'Update' : 'Create'} Product
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <DataTable
          columns={columns}
          data={products}
          keyField="P_ID"
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default ProductPage;
