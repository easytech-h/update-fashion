import React, { useState, useEffect } from 'react';
import { useSales } from '../context/SalesContext';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, Calendar, Download, Printer } from 'lucide-react';

const Reports: React.FC = () => {
  const { sales } = useSales();
  const { products } = useInventory();
  const { user, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredSales, setFilteredSales] = useState(sales);
  const [totals, setTotals] = useState({
    revenue: 0,
    discount: 0,
    items: 0,
    averageTicket: 0,
  });

  useEffect(() => {
    let filtered = [...sales];

    // Filter by user if not admin
    if (!isAdmin && user) {
      filtered = filtered.filter((sale) => sale.cashier === user.fullName);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((sale) => {
        const matchesSaleId = sale.id.toLowerCase().includes(searchLower);
        const matchesCashier = sale.cashier.toLowerCase().includes(searchLower);
        const matchesProducts = sale.items.some((item) => {
          const product = products.find((p) => p.id === item.productId);
          return product?.name.toLowerCase().includes(searchLower);
        });
        return matchesSaleId || matchesCashier || matchesProducts;
      });
    }

    // Apply date range filter
    if (startDate) {
      filtered = filtered.filter(
        (sale) => new Date(sale.date) >= new Date(startDate)
      );
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filtered = filtered.filter((sale) => new Date(sale.date) <= endDateTime);
    }

    // Calculate totals
    const newTotals = filtered.reduce(
      (acc, sale) => ({
        revenue: acc.revenue + sale.total,
        discount: acc.discount + sale.discount,
        items:
          acc.items + sale.items.reduce((sum, item) => sum + item.quantity, 0),
        averageTicket: filtered.length > 0 ? acc.revenue / filtered.length : 0,
      }),
      { revenue: 0, discount: 0, items: 0, averageTicket: 0 }
    );

    setFilteredSales(filtered);
    setTotals(newTotals);
  }, [sales, searchTerm, startDate, endDate, products, isAdmin, user]);

  const handleExport = () => {
    const headers = [
      'Date',
      'Sale ID',
      'Cashier',
      'Products',
      'Total',
      'Discount',
      'Net Paid',
    ];

    const rows = filteredSales.map((sale) => [
      new Date(sale.date).toLocaleString('fr-FR'),
      sale.id,
      sale.cashier,
      sale.items
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return `${product?.name} (x${item.quantity})`;
        })
        .join('; '),
      sale.total.toFixed(2),
      sale.discount.toFixed(2),
      (sale.total - sale.discount).toFixed(2),
    ]);

    const csvContent = [
      'UP2DATE FASHION - Sales Report',
      `Generated: ${new Date().toLocaleString('fr-FR')}`,
      `User: ${user?.fullName || 'N/A'}`,
      '',
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_report_${
      new Date().toISOString().split('T')[0]
    }.csv`;
    link.click();
  };

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-section, .print-section * {
          visibility: visible;
        }
        .print-section {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error:</p>
          <p>You must be logged in to view reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            <Printer className="inline-block mr-2" size={18} />
            Print Report
          </button>
          <button
            onClick={handleExport}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            <Download className="inline-block mr-2" size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded"
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="text-gray-400" size={18} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 p-2 border rounded"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="text-gray-400" size={18} />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 p-2 border rounded"
            />
          </div>
        </div>
      </div>

      <div className="print-section">
        {/* Report Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">UP2DATE FASHION</h1>
          <p className="text-xl mt-2">Sales Report</p>
          <p className="text-sm text-gray-600 mt-2">
            {startDate && endDate
              ? `Period: ${new Date(startDate).toLocaleDateString(
                  'fr-FR'
                )} - ${new Date(endDate).toLocaleDateString('fr-FR')}`
              : `Generated on: ${new Date().toLocaleDateString('fr-FR')}`}
          </p>
          <p className="text-sm text-gray-600">
            Generated by: {user?.fullName}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-600">
              HTG {totals.revenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Items Sold</h3>
            <p className="text-3xl font-bold text-blue-600">{totals.items}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Average Sale</h3>
            <p className="text-3xl font-bold text-purple-600">
              HTG {totals.averageTicket.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Total Sales</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {filteredSales.length}
            </p>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale ID
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cashier
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Paid
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(sale.date).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{sale.id}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sale.cashier}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <ul className="list-disc list-inside">
                        {sale.items.map((item, index) => {
                          const product = products.find(
                            (p) => p.id === item.productId
                          );
                          return (
                            <li key={index}>
                              {product?.name} (x{item.quantity})
                            </li>
                          );
                        })}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      HTG {sale.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      HTG {sale.discount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      HTG {(sale.total - sale.discount).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 7 : 6}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No sales found for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-6 py-4 font-bold">
                    Totals
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">
                    HTG {totals.revenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">
                    HTG {totals.discount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">
                    HTG {(totals.revenue - totals.discount).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Store Information Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p className="font-semibold">UP2DATE FASHION</p>
          <p>Rue la paix, Haiti</p>
          <p>Tel: (509) 3123 3485/3261 8607</p>
          <p className="mt-2">
            Report generated on {new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
