import React, { createContext, useState, useContext, useEffect } from 'react';
import { useUser } from './UserContext';

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  contactNumber: string;
  email: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  discount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'mobile' | 'bank_transfer';
  orderDate: string;
  notes?: string;
  createdBy?: string;
  finalAmount: number;
  advancePayment: number;
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'orderDate'>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  getOrderById: (id: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logActivity } = useUser();
  const [orders, setOrders] = useState<Order[]>(() => {
    const savedOrders = localStorage.getItem('orders');
    return savedOrders ? JSON.parse(savedOrders) : [];
  });

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  const addOrder = (orderData: Omit<Order, 'id' | 'orderDate'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `ORD-${Date.now()}`,
      orderDate: new Date().toISOString()
    };
    setOrders(prev => [...prev, newOrder]);
    logActivity(newOrder.createdBy || 'system', 'ORDER_CREATED', `Nouvelle commande ${newOrder.id} créée`);
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(order => {
      if (order.id === id) {
        const updatedOrder = { ...order, ...updates };
        
        // Log status change if status is updated
        if (updates.status && updates.status !== order.status) {
          logActivity(
            order.createdBy || 'system',
            'ORDER_STATUS_UPDATED',
            `Statut de la commande ${order.id} mis à jour: ${order.status} → ${updates.status}`
          );
        }

        return updatedOrder;
      }
      return order;
    }));
  };

  const deleteOrder = (id: string) => {
    const order = orders.find(o => o.id === id);
    if (order) {
      logActivity(
        order.createdBy || 'system',
        'ORDER_DELETED',
        `Commande ${order.id} supprimée`
      );
    }
    setOrders(prev => prev.filter(order => order.id !== id));
  };

  const getOrderById = (id: string) => {
    return orders.find(order => order.id === id);
  };

  return (
    <OrderContext.Provider value={{
      orders,
      addOrder,
      updateOrder,
      deleteOrder,
      getOrderById
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};