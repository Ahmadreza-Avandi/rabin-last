'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Monitor,
    Users,
    DollarSign,
    FileText,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    TrendingUp,
    Database,
    Server,
    Activity,
    BarChart3,
    PieChart,
    MessageCircle
} from 'lucide-react';
import {
    BarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface SystemStats {
    database: {
        status: string;
        tables: number;
        size: string;
    };
    users: {
        total: number;
        active: number;
        inactive: number;
    };
    customers: {
        total: number;
        active: number;
        prospects: number;
    };
    sales: {
        total: number;
        total_amount: number;
        paid: number;
        pending: number;
    };
    documents: {
        total: number;
        size: string;
    };
    system: {
        uptime: number;
        memory: {
            used: number;
            total: number;
        };
        node_version: string;
        platform: string;
    };
}

export default function SystemMonitoringPage() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [customers, setCustomers] = useState<any[]>([]);
    const [sales, setSales] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            await Promise.all([
                fetchSystemStats(),
                fetchCustomers(),
                fetchSales(),
                fetchActivities()
            ]);
            
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAuthHeaders = () => {
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('auth-token='))
            ?.split('=')[1];
        
        return {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
        };
    };

    const fetchSystemStats = async () => {
        try {
            const response = await fetch('/api/system/stats', {
                headers: getAuthHeaders(),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching system stats:', error);
            setError(error instanceof Error ? error.message : 'خطا در اتصال به سرور');
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await fetch('/api/customers', {
                headers: getAuthHeaders(),
            });
            
            if (response.ok) {
                const data = await response.json();
                setCustomers(data.data?.customers || []);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const fetchSales = async () => {
        try {
            const response = await fetch('/api/sales', {
                headers: getAuthHeaders(),
            });
            
            if (response.ok) {
                const data = await response.json();
                setSales(data.data?.sales || []);
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
        }
    };

    const fetchActivities = async () => {
        try {
            const response = await fetch('/api/activities', {
                headers: getAuthHeaders(),
            });
            
            if (response.ok) {
                const data = await response.json();
                setActivities(data.data?.activities || []);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    };

    const formatPersianNumber = (num: number) => {
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return num.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
    };

    const formatUptime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${formatPersianNumber(hours)} ساعت و ${formatPersianNumber(minutes)} دقیقه`;
    };

    // رنگ‌های چارت
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    // داده‌های چارت مشتریان بر اساس وضعیت
    const customerStatusData = [
        { name: 'فعال', value: customers.filter(c => c.status === 'active').length, color: '#10b981' },
        { name: 'احتمالی', value: customers.filter(c => c.status === 'prospect').length, color: '#3b82f6' },
        { name: 'غیرفعال', value: customers.filter(c => c.status === 'inactive').length, color: '#6b7280' },
        { name: 'پیگیری', value: customers.filter(c => c.status === 'follow_up').length, color: '#f59e0b' }
    ];

    // داده‌های چارت فروش بر اساس وضعیت پرداخت
    const salesStatusData = [
        { name: 'پرداخت شده', value: sales.filter(s => s.payment_status === 'paid').length, color: '#10b981' },
        { name: 'در انتظار', value: sales.filter(s => s.payment_status === 'pending').length, color: '#f59e0b' },
        { name: 'جزئی', value: sales.filter(s => s.payment_status === 'partial').length, color: '#3b82f6' },
        { name: 'بازگشتی', value: sales.filter(s => s.payment_status === 'refunded').length, color: '#ef4444' }
    ];

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                    <p className="text-lg font-medium">در حال بارگذاری آمار سیستم...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Alert className="max-w-md mx-auto border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                        <div className="space-y-2">
                            <p className="font-medium">خطا در بارگذاری داده‌ها</p>
                            <p className="text-sm">{error}</p>
                            <Button 
                                onClick={fetchSystemStats} 
                                size="sm" 
                                className="mt-2 bg-red-600 hover:bg-red-700"
                            >
                                تلاش مجدد
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                        <Monitor className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">مانیتورینگ سیستم</h1>
                        <p className="text-muted-foreground">
                            آخرین بروزرسانی: {lastUpdated.toLocaleString('fa-IR')}
                        </p>
                    </div>
                </div>
                <Button 
                    onClick={fetchAllData} 
                    disabled={loading} 
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    بروزرسانی
                </Button>
            </div>

            {/* Database Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        وضعیت دیتابیس
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Badge 
                            variant={stats?.database.status === 'connected' ? 'default' : 'destructive'}
                            className="flex items-center gap-1"
                        >
                            {stats?.database.status === 'connected' ? (
                                <CheckCircle className="h-3 w-3" />
                            ) : (
                                <AlertCircle className="h-3 w-3" />
                            )}
                            {stats?.database.status === 'connected' ? 'متصل' : 'خطا'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            {formatPersianNumber(stats?.database.tables || 0)} جدول
                        </span>
                        <span className="text-sm text-muted-foreground">
                            حجم: {stats?.database.size}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Users */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">کاربران</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatPersianNumber(stats?.users.total || 0)}
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>فعال: {formatPersianNumber(stats?.users.active || 0)}</span>
                            <span>غیرفعال: {formatPersianNumber(stats?.users.inactive || 0)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Customers */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">مشتریان</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatPersianNumber(stats?.customers.total || 0)}
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>فعال: {formatPersianNumber(stats?.customers.active || 0)}</span>
                            <span>احتمالی: {formatPersianNumber(stats?.customers.prospects || 0)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Sales */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">فروش</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatPersianNumber(stats?.sales.total || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            مجموع: {new Intl.NumberFormat('fa-IR').format(stats?.sales.total_amount || 0)} تومان
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>پرداخت شده: {formatPersianNumber(stats?.sales.paid || 0)}</span>
                            <span>در انتظار: {formatPersianNumber(stats?.sales.pending || 0)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Documents */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">اسناد</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatPersianNumber(stats?.documents.total || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            حجم: {stats?.documents.size}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* System Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        اطلاعات سیستم
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">مدت زمان فعالیت</div>
                            <div className="text-lg font-semibold">
                                {formatUptime(stats?.system.uptime || 0)}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">حافظه استفاده شده</div>
                            <div className="text-lg font-semibold">
                                {formatPersianNumber(stats?.system.memory.used || 0)} / {formatPersianNumber(stats?.system.memory.total || 0)} MB
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">نسخه Node.js</div>
                            <div className="text-lg font-semibold">{stats?.system.node_version}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">پلتفرم</div>
                            <div className="text-lg font-semibold">{stats?.system.platform}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Status Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            توزیع مشتریان بر اساس وضعیت
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsPieChart>
                                <Pie
                                    data={customerStatusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {customerStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Sales Status Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            وضعیت فروش‌ها
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={salesStatusData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Customers Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            مشتریان اخیر
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-right p-2">نام</th>
                                        <th className="text-right p-2">وضعیت</th>
                                        <th className="text-right p-2">تاریخ ایجاد</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.slice(0, 5).map((customer) => (
                                        <tr key={customer.id} className="border-b">
                                            <td className="p-2 font-medium">{customer.name}</td>
                                            <td className="p-2">
                                                <Badge 
                                                    variant={customer.status === 'active' ? 'default' : 'secondary'}
                                                    className="text-xs"
                                                >
                                                    {customer.status === 'active' ? 'فعال' : 
                                                     customer.status === 'prospect' ? 'احتمالی' : 
                                                     customer.status === 'inactive' ? 'غیرفعال' : 'پیگیری'}
                                                </Badge>
                                            </td>
                                            <td className="p-2 text-muted-foreground">
                                                {new Date(customer.created_at).toLocaleDateString('fa-IR')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Sales Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            فروش‌های اخیر
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-right p-2">مشتری</th>
                                        <th className="text-right p-2">مبلغ</th>
                                        <th className="text-right p-2">وضعیت</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.slice(0, 5).map((sale) => (
                                        <tr key={sale.id} className="border-b">
                                            <td className="p-2 font-medium">{sale.customer_name}</td>
                                            <td className="p-2">
                                                {new Intl.NumberFormat('fa-IR').format(sale.total_amount)} تومان
                                            </td>
                                            <td className="p-2">
                                                <Badge 
                                                    variant={sale.payment_status === 'paid' ? 'default' : 'secondary'}
                                                    className="text-xs"
                                                >
                                                    {sale.payment_status === 'paid' ? 'پرداخت شده' : 
                                                     sale.payment_status === 'pending' ? 'در انتظار' : 
                                                     sale.payment_status === 'partial' ? 'جزئی' : 'بازگشتی'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activities Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        فعالیت‌های اخیر
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-right p-2">عنوان</th>
                                    <th className="text-right p-2">نوع</th>
                                    <th className="text-right p-2">نتیجه</th>
                                    <th className="text-right p-2">تاریخ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activities.slice(0, 8).map((activity) => (
                                    <tr key={activity.id} className="border-b">
                                        <td className="p-2 font-medium">{activity.title}</td>
                                        <td className="p-2">
                                            <Badge variant="outline" className="text-xs">
                                                {activity.type === 'call' ? 'تماس' : 
                                                 activity.type === 'email' ? 'ایمیل' : 
                                                 activity.type === 'meeting' ? 'جلسه' : 'سایر'}
                                            </Badge>
                                        </td>
                                        <td className="p-2">
                                            <Badge 
                                                variant={activity.outcome === 'successful' ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {activity.outcome === 'successful' ? 'موفق' : 
                                                 activity.outcome === 'follow_up_needed' ? 'نیاز به پیگیری' : 'تکمیل شده'}
                                            </Badge>
                                        </td>
                                        <td className="p-2 text-muted-foreground">
                                            {new Date(activity.created_at).toLocaleDateString('fa-IR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}