
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Package, 
  Tag, 
  Receipt, 
  Award, 
  Star, 
  UserPlus,
  MessageSquare,
  BarChart3,
  AlertTriangle,
  LogOut,
  Menu, 
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger 
} from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, path: '/' },
    { name: 'Businesses', icon: <Store className="h-5 w-5" />, path: '/businesses' },
    { name: 'Products', icon: <Package className="h-5 w-5" />, path: '/products' },
    { name: 'Customers', icon: <Users className="h-5 w-5" />, path: '/customers' },
    { name: 'Offers', icon: <Tag className="h-5 w-5" />, path: '/offers' },
    { name: 'Transactions', icon: <Receipt className="h-5 w-5" />, path: '/transactions' },
    { name: 'Loyalty', icon: <Award className="h-5 w-5" />, path: '/loyalty' },
    { name: 'Tier System', icon: <Star className="h-5 w-5" />, path: '/tier-system' },
    { name: 'Referrals', icon: <UserPlus className="h-5 w-5" />, path: '/referrals' },
    { name: 'Feedback', icon: <MessageSquare className="h-5 w-5" />, path: '/feedback' },
    { name: 'Promotions', icon: <Tag className="h-5 w-5" />, path: '/promotions' },
    { name: 'Fraud Detection', icon: <AlertTriangle className="h-5 w-5" />, path: '/fraud' },
    { name: 'Analytics', icon: <BarChart3 className="h-5 w-5" />, path: '/analytics' },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="hidden md:flex">
          <SidebarContent>
            <div className="flex flex-col h-full">
              <div className="px-4 py-6">
                <h1 className="text-xl font-bold text-white">Loyalty Admin</h1>
              </div>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild>
                      <Button
                        variant={location.pathname === item.path ? "secondary" : "ghost"}
                        className="w-full justify-start text-sidebar-foreground"
                        onClick={() => navigate(item.path)}
                      >
                        {item.icon}
                        <span className="ml-2">{item.name}</span>
                      </Button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sidebar-foreground"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="ml-2">Logout</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Mobile menu button */}
        <div className="md:hidden fixed top-0 left-0 z-50 p-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-background md:hidden">
            <div className="flex flex-col h-full py-20 px-6">
              <h1 className="text-2xl font-bold mb-8">Loyalty Admin</h1>
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Button 
                    key={item.name}
                    variant={location.pathname === item.path ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {item.icon}
                    <span className="ml-2">{item.name}</span>
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="ml-2">Logout</span>
                </Button>
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
