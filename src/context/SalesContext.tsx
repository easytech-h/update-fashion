import React, { createContext, useState, useContext, useEffect } from 'react';

export interface SaleItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  total: number;
  discount: number;
  paymentReceived: number;
  change: number;
  date: string;
  cashier: string;
  storeLocation: string;
}

interface SalesContextType {
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id' | 'date'>) => void;
  getSaleById: (id: string) => Sale | undefined;
  getSalesByUser: (username: string) => Sale[];
  getSalesByDateRange: (startDate: string, endDate: string) => Sale[];
  clearSales: () => void;
  isLoading: boolean;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>(() => {
    const savedSales = localStorage.getItem('sales');
    return savedSales ? JSON.parse(savedSales) : [];
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('sales', JSON.stringify(sales));
  }, [sales]);

  const addSale = (saleData: Omit<Sale, 'id' | 'date'>) => {
    const newSale: Sale = {
      ...saleData,
      id: `SALE-${Date.now()}`,
      date: new Date().toISOString()
    };
    setSales(prev => [...prev, newSale]);
  };

  const getSaleById = (id: string) => {
    return sales.find(sale => sale.id === id);
  };

  const getSalesByUser = (username: string) => {
    return sales.filter(sale => sale.cashier === username);
  };

  const getSalesByDateRange = (startDate: string, endDate: string) => {
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= start && saleDate <= end;
    });
  };

  const clearSales = () => {
    setSales([]);
    localStorage.removeItem('sales');
  };

  return (
    <SalesContext.Provider value={{
      sales,
      addSale,
      getSaleById,
      getSalesByUser,
      getSalesByDateRange,
      clearSales,
      isLoading
    }}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (context === undefined) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};