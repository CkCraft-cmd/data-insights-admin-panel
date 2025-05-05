
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

// Define types for our context
type Admin = {
  A_ID: number;
  username: string;
  email: string;
  role: string;
};

type AuthContextType = {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock admin data (in real app this would come from an API)
const MOCK_ADMINS = [
  { 
    A_ID: 1, 
    username: 'admin', 
    password: 'admin123', 
    email: 'admin@example.com',
    role: 'superadmin'
  },
  { 
    A_ID: 2, 
    username: 'manager', 
    password: 'manager123', 
    email: 'manager@example.com',
    role: 'manager'
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        setAdmin(parsedAdmin);
      } catch (error) {
        console.error('Failed to parse stored admin data', error);
        localStorage.removeItem('admin');
      }
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // In a real app, this would be an API call
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const foundAdmin = MOCK_ADMINS.find(
        admin => admin.username === username && admin.password === password
      );
      
      if (foundAdmin) {
        const { password: _, ...adminWithoutPassword } = foundAdmin;
        setAdmin(adminWithoutPassword);
        localStorage.setItem('admin', JSON.stringify(adminWithoutPassword));
        toast({
          title: 'Login successful',
          description: `Welcome back, ${foundAdmin.username}!`,
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: 'Invalid username or password',
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login error',
        description: 'An error occurred during login',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('admin');
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
  };

  const value = {
    admin,
    isAuthenticated: !!admin,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
