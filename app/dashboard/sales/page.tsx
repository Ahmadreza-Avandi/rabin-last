'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import moment from 'moment-jalaali';
import { formatCurrency } from '@/lib/currency-utils';
import {
  Plus, DollarSign, TrendingUp, TrendingDown, ShoppingCart, Search, Package,
  CheckCircle, Clock, AlertTriangle, Eye, Edit, Trash2, Filter,
  Download, FileSpreadsheet, Calendar, User, Receipt
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Configure moment-jalaali
moment.loadPersian({ dialect: 'persian-modern' });

interface Sale {
  id: string;
  deal_id: string;
  customer_id: string;
  customer_name: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  payment_method?: string;
  sale_date: string;
  delivery_date?: string;
  payment_due_date?: string;
  notes?: string;
  invoice_number?: string;
  sales_person_id: string;
  sales_person_name: string;
  items?: SaleItem[];
}

interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  base_price: number;
  currency: string;
  is_active: boolean;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [newSale, setNewSale] = useState({
    deal_id: '',
    customer_id: '',
    total_amount: '',
    currency: 'IRR',
    payment_status: 'pending',
    payment_method: '',
    delivery_date: '',
    payment_due_date: '',
    notes: '',
    invoice_number: '',
    items: [] as any[]
  });
  const { toast } = useToast();

  // Utility function to get auth token
  const getAuthToken = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];
  };

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [startDate, endDate, statusFilter]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (statusFilter && statusFilter !== 'all') params.append('payment_status', statusFilter);

      const response = await fetch(`/api/sales?${params.toString()}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setSales(data.data.sales || []);
      } else {
        toast({
          title: "خطا در بارگذاری",
          description: data.message || "خطا در دریافت اطلاعات فروش‌ها",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        title: "خطا",
        description: "خطا در اتصال به سرور",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/products?is_active=true', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleAddSale = async () => {
    // Validation
    if (!newSale.customer_id || !newSale.total_amount) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدهای اجباری را پر کنید",
        variant: "destructive"
      });
      return;
    }

    if (!newSale.items || newSale.items.length === 0) {
      toast({
        title: "خطا",
        description: "حداقل یک محصول باید انتخاب شود",
        variant: "destructive"
      });
      return;
    }

    // Additional validation for items
    for (let i = 0; i < newSale.items.length; i++) {
      const item = newSale.items[i];
      if (!item.product_id) {
        toast({
          title: "خطا",
          description: `محصول ${i + 1}: لطفاً محصول را انتخاب کنید`,
          variant: "destructive"
        });
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        toast({
          title: "خطا",
          description: `محصول ${i + 1}: تعداد باید بیشتر از صفر باشد`,
          variant: "destructive"
        });
        return;
      }
      if (item.unit_price <= 0) {
        toast({
          title: "خطا",
          description: `محصول ${i + 1}: قیمت واحد باید بیشتر از صفر باشد`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      setSaving(true);
      const token = getAuthToken();

      const requestBody = {
        ...newSale,
        total_amount: parseFloat(newSale.total_amount)
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "موفق",
          description: "فروش با موفقیت ثبت شد"
        });

        setOpen(false);
        resetNewSale();
        await fetchSales();
      } else {
        toast({
          title: "خطا",
          description: data.message || "خطا در ثبت فروش",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding sale:', error);
      toast({
        title: "خطا",
        description: "خطا در اتصال به سرور",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetNewSale = () => {
    setNewSale({
      deal_id: '',
      customer_id: '',
      total_amount: '',
      currency: 'IRR',
      payment_status: 'pending',
      payment_method: '',
      delivery_date: '',
      payment_due_date: '',
      notes: '',
      invoice_number: '',
      items: []
    });
  };

  const addSaleItem = () => {
    setNewSale({
      ...newSale,
      items: [...newSale.items, {
        product_id: '',
        quantity: 1,
        unit_price: 1,
        discount_percentage: 0,
        total_price: 1
      }]
    });
  };

  const updateSaleItem = (index: number, field: string, value: any) => {
    setNewSale(prev => {
      const updatedItems = [...prev.items];
      const nextItem: any = { ...updatedItems[index], [field]: value };

      nextItem.quantity = Number(nextItem.quantity) || 0;
      nextItem.unit_price = Number(nextItem.unit_price) || 0;
      nextItem.discount_percentage = Number(nextItem.discount_percentage) || 0;

      if (field === 'quantity' || field === 'unit_price' || field === 'discount_percentage') {
        const subtotal = nextItem.quantity * nextItem.unit_price;
        const discount = subtotal * (nextItem.discount_percentage / 100);
        nextItem.total_price = subtotal - discount;
      }

      updatedItems[index] = nextItem;

      const totalAmount = updatedItems.reduce((sum, it: any) => sum + (Number(it.total_price) || 0), 0);
      return { ...prev, items: updatedItems, total_amount: totalAmount.toString() };
    });
  };

  const removeSaleItem = (index: number) => {
    const updatedItems = newSale.items.filter((_, i) => i !== index);
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
    setNewSale(prev => ({ ...prev, items: updatedItems, total_amount: totalAmount.toString() }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'تعیین نشده';
    try {
      const date = moment(dateString);
      return date.format('jYYYY/jMM/jDD');
    } catch (error) {
      return 'تاریخ نامعتبر';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'در انتظار';
      case 'partial': return 'پرداخت جزئی';
      case 'paid': return 'پرداخت شده';
      case 'refunded': return 'بازگشت داده شده';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'partial': return 'secondary';
      case 'paid': return 'default';
      case 'refunded': return 'outline';
      default: return 'secondary';
    }
  };

  const exportToExcel = () => {
    const exportData = filteredSales.map(sale => ({
      'شماره فاکتور': sale.invoice_number || '-',
      'نام مشتری': sale.customer_name,
      'مبلغ کل': sale.total_amount,
      'وضعیت پرداخت': getStatusLabel(sale.payment_status),
      'روش پرداخت': sale.payment_method || '-',
      'تاریخ فروش': formatDate(sale.sale_date),
      'تاریخ تحویل': formatDate(sale.delivery_date || ''),
      'فروشنده': sale.sales_person_name,
      'یادداشت': sale.notes || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'فروش‌ها');

    const fileName = `sales_${moment().format('jYYYY-jMM-jDD')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "موفق",
      description: "فایل اکسل با موفقیت دانلود شد"
    });
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setEditDialogOpen(true);
  };

  const handleUpdateSale = async () => {
    if (!editingSale) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/sales/${editingSale.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          total_amount: editingSale.total_amount,
          payment_status: editingSale.payment_status,
          payment_method: editingSale.payment_method
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "موفق",
          description: "فروش با موفقیت بروزرسانی شد"
        });
        await fetchSales();
        setEditDialogOpen(false);
        setEditingSale(null);
      } else {
        toast({
          title: "خطا",
          description: data.message || "خطا در بروزرسانی فروش",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating sale:', error);
      toast({
        title: "خطا",
        description: "خطا در اتصال به سرور",
        variant: "destructive"
      });
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.sales_person_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sale.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">در حال بارگذاری فروش‌ها...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">مدیریت فروش</h1>
              <p className="text-muted-foreground">ثبت و مدیریت فروش‌های انجام شده</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={exportToExcel}
            variant="outline"
            className="flex items-center gap-2"
            disabled={filteredSales.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            خروجی اکسل
          </Button>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetNewSale();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Plus className="h-4 w-4 ml-2" />
                ثبت فروش جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>ثبت فروش جدید</DialogTitle>
                <DialogDescription>
                  فرم ثبت فروش جدید برای محصولات و خدمات
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {/* اطلاعات کلی */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>مشتری *</Label>
                    <Select value={newSale.customer_id} onValueChange={(value) => setNewSale({ ...newSale, customer_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب مشتری" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>وضعیت پرداخت</Label>
                    <Select value={newSale.payment_status} onValueChange={(value) => setNewSale({ ...newSale, payment_status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">در انتظار</SelectItem>
                        <SelectItem value="partial">پرداخت جزئی</SelectItem>
                        <SelectItem value="paid">پرداخت شده</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>روش پرداخت</Label>
                    <Input
                      value={newSale.payment_method}
                      onChange={(e) => setNewSale({ ...newSale, payment_method: e.target.value })}
                      placeholder="نقد، چک، کارت، ..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>شماره فاکتور</Label>
                    <Input
                      value={newSale.invoice_number}
                      onChange={(e) => setNewSale({ ...newSale, invoice_number: e.target.value })}
                      placeholder="شماره فاکتور"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاریخ تحویل</Label>
                    <PersianDatePicker
                      value={newSale.delivery_date}
                      onChange={(date) => setNewSale({ ...newSale, delivery_date: date })}
                      placeholder="انتخاب تاریخ تحویل"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>مهلت پرداخت</Label>
                    <PersianDatePicker
                      value={newSale.payment_due_date}
                      onChange={(date) => setNewSale({ ...newSale, payment_due_date: date })}
                      placeholder="انتخاب مهلت پرداخت"
                    />
                  </div>
                </div>

                {/* آیتم‌های فروش */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg">آیتم‌های فروش</Label>
                    <Button type="button" onClick={addSaleItem} size="sm">
                      <Plus className="h-4 w-4 ml-2" />
                      افزودن محصول
                    </Button>
                  </div>

                  {newSale.items.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-6 gap-4 items-end">
                        <div className="space-y-2">
                          <Label>محصول</Label>
                          <Select
                            value={item.product_id}
                            onValueChange={(value) => {
                              updateSaleItem(index, 'product_id', value);
                              const product = products.find(p => p.id === value);
                              if (product) {
                                updateSaleItem(index, 'unit_price', product.base_price);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب محصول" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(product => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - {formatCurrency(product.base_price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>تعداد</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateSaleItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>قیمت واحد</Label>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateSaleItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>تخفیف (%)</Label>
                          <Input
                            type="number"
                            value={item.discount_percentage}
                            onChange={(e) => updateSaleItem(index, 'discount_percentage', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>مجموع</Label>
                          <div className="text-lg font-bold">
                            {formatCurrency(item.total_price)}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSaleItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* مجموع کل */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">مجموع کل:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(parseFloat(newSale.total_amount) || 0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>یادداشت</Label>
                  <Textarea
                    value={newSale.notes}
                    onChange={(e) => setNewSale({ ...newSale, notes: e.target.value })}
                    placeholder="یادداشت‌های اضافی"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button variant="outline" onClick={() => {
                  setOpen(false);
                  resetNewSale();
                }}>
                  انصراف
                </Button>
                <Button
                  onClick={handleAddSale}
                  disabled={saving || !newSale.items || newSale.items.length === 0 || !newSale.customer_id || !newSale.total_amount}
                >
                  {saving ? 'در حال ذخیره...' : 'ثبت فروش'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* آمار کلی */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-teal-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-700">کل فروش‌ها</CardTitle>
            <div className="p-2 bg-teal-500 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-900">{sales.length.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">مجموع درآمد</CardTitle>
            <div className="p-2 bg-green-500 rounded-lg">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(filteredSales.reduce((sum, sale) => {
                const amount = typeof sale.total_amount === 'string' ? parseFloat(sale.total_amount) : sale.total_amount;
                return sum + (isNaN(amount) ? 0 : amount);
              }, 0))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">پرداخت شده</CardTitle>
            <div className="p-2 bg-emerald-500 rounded-lg">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">
              {sales.filter(s => s.payment_status === 'paid').length.toLocaleString('fa-IR')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">در انتظار</CardTitle>
            <div className="p-2 bg-amber-500 rounded-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {sales.filter(s => s.payment_status === 'pending').length.toLocaleString('fa-IR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فیلترها و جستجو */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فیلتر و جستجو
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو در فروش‌ها..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="وضعیت پرداخت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="partial">پرداخت جزئی</SelectItem>
                  <SelectItem value="paid">پرداخت شده</SelectItem>
                  <SelectItem value="refunded">بازگشت داده شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <PersianDatePicker
                value={startDate}
                onChange={(date) => setStartDate(date)}
                placeholder="از تاریخ"
              />
            </div>
            <div>
              <PersianDatePicker
                value={endDate}
                onChange={(date) => setEndDate(date)}
                placeholder="تا تاریخ"
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              نمایش {filteredSales.length.toLocaleString('fa-IR')} فروش از مجموع {sales.length.toLocaleString('fa-IR')}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setStatusFilter('all');
                setSearchTerm('');
                fetchSales();
              }}
            >
              <Filter className="h-4 w-4 ml-2" />
              پاک کردن فیلترها
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* لیست فروش‌ها */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            لیست فروش‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-600 mb-2">هیچ فروشی یافت نشد</p>
              <p className="text-sm text-gray-500">
                {sales.length === 0 ? 'هنوز هیچ فروشی ثبت نشده است' : 'فیلترهای خود را تغییر دهید'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((sale) => (
                <Card key={sale.id} className="border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-100 rounded-lg">
                          <Receipt className="h-6 w-6 text-teal-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{sale.customer_name}</h3>
                            <Badge variant={getStatusColor(sale.payment_status)}>
                              {getStatusLabel(sale.payment_status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {sale.sales_person_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(sale.sale_date)}
                            </span>
                            {sale.invoice_number && (
                              <span className="flex items-center gap-1">
                                <Receipt className="h-4 w-4" />
                                {sale.invoice_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(sale.total_amount)}
                          </div>
                          {sale.payment_method && (
                            <div className="text-sm text-gray-500">
                              {sale.payment_method}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSale(sale);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSale(sale)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {sale.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{sale.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog نمایش جزئیات فروش */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جزئیات فروش</DialogTitle>
            <DialogDescription>
              اطلاعات کامل فروش و آیتم‌های آن
            </DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">مشتری</Label>
                    <p className="text-lg font-semibold">{selectedSale.customer_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">فروشنده</Label>
                    <p>{selectedSale.sales_person_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">تاریخ فروش</Label>
                    <p>{formatDate(selectedSale.sale_date)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">مبلغ کل</Label>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedSale.total_amount)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">وضعیت پرداخت</Label>
                    <Badge variant={getStatusColor(selectedSale.payment_status)}>
                      {getStatusLabel(selectedSale.payment_status)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">روش پرداخت</Label>
                    <p>{selectedSale.payment_method || 'تعیین نشده'}</p>
                  </div>
                </div>
              </div>

              {selectedSale.items && selectedSale.items.length > 0 && (
                <div>
                  <Label className="text-lg font-semibold mb-4 block">آیتم‌های فروش</Label>
                  <div className="space-y-3">
                    {selectedSale.items.map((item, index) => (
                      <Card key={index} className="p-4 bg-gray-50">
                        <div className="grid grid-cols-5 gap-4 items-center">
                          <div>
                            <Label className="text-xs text-gray-600">محصول</Label>
                            <p className="font-medium">{item.product_name}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">تعداد</Label>
                            <p>{item.quantity.toLocaleString('fa-IR')}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">قیمت واحد</Label>
                            <p>{formatCurrency(item.unit_price)}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">تخفیف</Label>
                            <p>{item.discount_percentage}%</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">مجموع</Label>
                            <p className="font-bold text-green-600">{formatCurrency(item.total_price)}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {selectedSale.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">یادداشت</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedSale.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog ویرایش فروش */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>ویرایش فروش</DialogTitle>
            <DialogDescription>
              ویرایش مبلغ و وضعیت پرداخت فروش
            </DialogDescription>
          </DialogHeader>
          {editingSale && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold">{editingSale.customer_name}</h4>
                <p className="text-sm text-gray-600">
                  {editingSale.invoice_number || `فروش ${editingSale.id.slice(0, 8)}`}
                </p>
              </div>

              {/* ویرایش مبلغ */}
              <div className="space-y-2">
                <Label>مبلغ فروش</Label>
                <Input
                  type="number"
                  value={editingSale.total_amount}
                  onChange={(e) => setEditingSale({
                    ...editingSale,
                    total_amount: parseFloat(e.target.value) || 0
                  })}
                  placeholder="مبلغ به تومان"
                />
                <p className="text-sm text-gray-500">
                  {formatCurrency(editingSale.total_amount)}
                </p>
              </div>

              {/* ویرایش روش پرداخت */}
              <div className="space-y-2">
                <Label>روش پرداخت</Label>
                <Input
                  value={editingSale.payment_method || ''}
                  onChange={(e) => setEditingSale({
                    ...editingSale,
                    payment_method: e.target.value
                  })}
                  placeholder="نقد، چک، کارت، ..."
                />
              </div>

              {/* وضعیت پرداخت */}
              <div className="space-y-2">
                <Label>وضعیت پرداخت</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={editingSale.payment_status === 'pending' ? 'default' : 'outline'}
                    onClick={() => setEditingSale({ ...editingSale, payment_status: 'pending' })}
                    className="justify-start"
                  >
                    <Clock className="h-4 w-4 ml-2" />
                    در انتظار
                  </Button>
                  <Button
                    variant={editingSale.payment_status === 'partial' ? 'default' : 'outline'}
                    onClick={() => setEditingSale({ ...editingSale, payment_status: 'partial' })}
                    className="justify-start"
                  >
                    <AlertTriangle className="h-4 w-4 ml-2" />
                    جزئی
                  </Button>
                  <Button
                    variant={editingSale.payment_status === 'paid' ? 'default' : 'outline'}
                    onClick={() => setEditingSale({ ...editingSale, payment_status: 'paid' })}
                    className="justify-start"
                  >
                    <CheckCircle className="h-4 w-4 ml-2" />
                    پرداخت شده
                  </Button>
                  <Button
                    variant={editingSale.payment_status === 'refunded' ? 'default' : 'outline'}
                    onClick={() => setEditingSale({ ...editingSale, payment_status: 'refunded' })}
                    className="justify-start"
                  >
                    <TrendingDown className="h-4 w-4 ml-2" />
                    بازگشت
                  </Button>
                </div>
              </div>

              {/* دکمه‌های عمل */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  انصراف
                </Button>
                <Button onClick={() => handleUpdateSale()}>
                  ذخیره تغییرات
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}