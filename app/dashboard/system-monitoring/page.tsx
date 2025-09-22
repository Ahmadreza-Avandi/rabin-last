'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import moment from 'moment-jalaali';
import {
    Monitor,
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    MessageCircle,
    RefreshCw,
    Calendar,
    BarChart3,
    PieChart,
    Activity,
    ArrowUpIcon,
    ArrowDownIcon,
    MinusIcon,
    AlertCircle,
    CheckCircle,
    Zap,
    Target,
    Clock
} from 'lucide-react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
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
    ResponsiveContainer,
    ComposedChart
} from 'recharts';

interface SystemStats {
    totalCustomers: number;
    totalSales: number;
    totalRevenue: number;
    totalFeedbacks: number;
    weeklyRevenue: any[];
    monthlyRevenue: any[];
    feedbackDistribution: any[];
    satisfactionData: any[];
    salesByStatus: any[];
    customersBySegment: any[];
    recentActivities: any[];
    growth: {
        customers: { percentage: number; trend: 'up' | 'down' | 'stable' };
        sales: { percentage: number; trend: 'up' | 'down' | 'stable' };
        revenue: { percentage: number; trend: 'up' | 'down' | 'stable' };
        feedback: { percentage: number; trend: 'up' | 'down' | 'stable' };
    };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

const GRADIENT_COLORS = {
    blue: ['#3b82f6', '#1d4ed8'],
    green: ['#10b981', '#059669'],
    purple: ['#8b5cf6', '#7c3aed'],
    orange: ['#f59e0b', '#d97706'],
    red: ['#ef4444', '#dc2626']
};

export default function SystemMonitoringPage() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly');
    const [autoRefresh, setAutoRefresh] = useState(true);

    useEffect(() => {
        fetchSystemStats();
        // Auto refresh every 2 minutes if enabled
        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(fetchSystemStats, 2 * 60 * 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    const fetchSystemStats = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('auth-token='))
                ?.split('=')[1];
            
            const response = await fetch('/api/system/stats', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();

            // Create mock data structure if API doesn't return expected format
            const mockStats = {
                totalCustomers: data.users?.total || 0,
                totalSales: data.customers?.total || 0,
                totalRevenue: 0,
                totalFeedbacks: data.documents?.total || 0,
                weeklyRevenue: [
                    { name: 'شنبه', revenue: 1200000 },
                    { name: 'یکشنبه', revenue: 1900000 },
                    { name: 'دوشنبه', revenue: 3000000 },
                    { name: 'سه‌شنبه', revenue: 5000000 },
                    { name: 'چهارشنبه', revenue: 2000000 },
                    { name: 'پنج‌شنبه', revenue: 3000000 },
                    { name: 'جمعه', revenue: 2000000 }
                ],
                monthlyRevenue: [
                    { name: 'فروردین', revenue: 40000000 },
                    { name: 'اردیبهشت', revenue: 30000000 },
                    { name: 'خرداد', revenue: 20000000 },
                    { name: 'تیر', revenue: 27000000 },
                    { name: 'مرداد', revenue: 18000000 },
                    { name: 'شهریور', revenue: 23000000 }
                ],
                feedbackDistribution: [
                    { name: 'مثبت', value: 65 },
                    { name: 'منفی', value: 20 },
                    { name: 'خنثی', value: 15 }
                ],
                satisfactionData: [
                    { name: 'فروردین', satisfaction: 4.2 },
                    { name: 'اردیبهشت', satisfaction: 4.5 },
                    { name: 'خرداد', satisfaction: 4.1 },
                    { name: 'تیر', satisfaction: 4.7 },
                    { name: 'مرداد', satisfaction: 4.3 },
                    { name: 'شهریور', satisfaction: 4.6 }
                ],
                salesByStatus: [
                    { name: 'پرداخت شده', value: 70 },
                    { name: 'در انتظار', value: 20 },
                    { name: 'لغو شده', value: 10 }
                ],
                customersBySegment: [
                    { name: 'VIP', value: 15 },
                    { name: 'عادی', value: 60 },
                    { name: 'جدید', value: 25 }
                ],
                recentActivities: [],
                growth: {
                    customers: { percentage: 12, trend: 'up' as const },
                    sales: { percentage: 8, trend: 'up' as const },
                    revenue: { percentage: 15, trend: 'up' as const },
                    feedback: { percentage: 5, trend: 'up' as const }
                }
            };

            setStats(mockStats);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching system stats:', error);
            setError(error instanceof Error ? error.message : 'خطا در اتصال به سرور');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchSystemStats();
    };

    const formatPersianDate = (date: Date) => {
        moment.loadPersian({ dialect: 'persian-modern' });
        return moment(date).format('jYYYY/jMM/jDD - HH:mm');
    };

    const formatPersianNumber = (num: number) => {
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return num.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return <ArrowUpIcon className="h-3 w-3" />;
            case 'down':
                return <ArrowDownIcon className="h-3 w-3" />;
            default:
                return <MinusIcon className="h-3 w-3" />;
        }
    };

    const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return 'text-green-600';
            case 'down':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    if (loading && !stats) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-medium text-gray-900">در حال بارگذاری آمار سیستم</p>
                        <p className="text-sm text-muted-foreground">لطفاً صبر کنید...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !stats) {
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
                    <div className="relative p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                        <Monitor className="h-8 w-8 text-white" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            مانیتورینگ سیستم
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <p className="text-muted-foreground">
                                آخرین بروزرسانی: {formatPersianDate(lastUpdated)}
                            </p>
                            {autoRefresh && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                                    زنده
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`flex items-center gap-2 ${autoRefresh ? 'border-green-300 text-green-700' : ''}`}
                    >
                        <Zap className="h-4 w-4" />
                        {autoRefresh ? 'غیرفعال کردن خودکار' : 'فعال کردن خودکار'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTimeRange(timeRange === 'weekly' ? 'monthly' : 'weekly')}
                        className="flex items-center gap-2"
                    >
                        <Calendar className="h-4 w-4" />
                        {timeRange === 'weekly' ? 'نمایش ماهانه' : 'نمایش هفتگی'}
                    </Button>
                    <Button 
                        onClick={handleRefresh} 
                        disabled={loading} 
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        بروزرسانی
                    </Button>
                </div>
            </div>

            {/* Status Alert */}
            {error && (
                <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                        خطا در آخرین بروزرسانی: {error}
                    </AlertDescription>
                </Alert>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -mr-10 -mt-10 opacity-50"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-blue-700">کل مشتریان</CardTitle>
                        <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold text-blue-900 mb-2">
                            {formatPersianNumber(stats?.totalCustomers || 0)}
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="secondary"
                                className={`${getTrendColor(stats?.growth.customers.trend || 'stable')} bg-white/70 border-0 px-2 py-1 rounded-full`}
                            >
                                {getTrendIcon(stats?.growth.customers.trend || 'stable')}
                                {formatPersianNumber(stats?.growth.customers.percentage || 0)}%
                            </Badge>
                            <span className="text-xs text-blue-600 font-medium">نسبت به ماه قبل</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full -mr-10 -mt-10 opacity-50"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-green-700">کل فروش</CardTitle>
                        <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold text-green-900 mb-2">
                            {formatPersianNumber(stats?.totalSales || 0)}
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="secondary"
                                className={`${getTrendColor(stats?.growth.sales.trend || 'stable')} bg-white/70 border-0 px-2 py-1 rounded-full`}
                            >
                                {getTrendIcon(stats?.growth.sales.trend || 'stable')}
                                {formatPersianNumber(stats?.growth.sales.percentage || 0)}%
                            </Badge>
                            <span className="text-xs text-green-600 font-medium">نسبت به ماه قبل</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full -mr-10 -mt-10 opacity-50"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-purple-700">درآمد کل</CardTitle>
                        <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                            <DollarSign className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-2xl font-bold text-purple-900 mb-2">
                            {new Intl.NumberFormat('fa-IR').format(stats?.totalRevenue || 0)} تومان
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="secondary"
                                className={`${getTrendColor(stats?.growth.revenue.trend || 'stable')} bg-white/70 border-0 px-2 py-1 rounded-full`}
                            >
                                {getTrendIcon(stats?.growth.revenue.trend || 'stable')}
                                {formatPersianNumber(stats?.growth.revenue.percentage || 0)}%
                            </Badge>
                            <span className="text-xs text-purple-600 font-medium">نسبت به ماه قبل</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200 rounded-full -mr-10 -mt-10 opacity-50"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-orange-700">کل بازخوردها</CardTitle>
                        <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
                            <MessageCircle className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold text-orange-900 mb-2">
                            {formatPersianNumber(stats?.totalFeedbacks || 0)}
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="secondary"
                                className={`${getTrendColor(stats?.growth.feedback.trend || 'stable')} bg-white/70 border-0 px-2 py-1 rounded-full`}
                            >
                                {getTrendIcon(stats?.growth.feedback.trend || 'stable')}
                                {formatPersianNumber(stats?.growth.feedback.percentage || 0)}%
                            </Badge>
                            <span className="text-xs text-orange-600 font-medium">نسبت به ماه قبل</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-500 rounded-lg">
                                    <BarChart3 className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-gray-800">درآمد {timeRange === 'weekly' ? 'هفتگی' : 'ماهانه'}</span>
                            </div>
                            <Badge variant="outline" className="bg-white border-blue-200 text-blue-700">
                                <Target className="h-3 w-3 mr-1" />
                                تحلیل روند
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <ResponsiveContainer width="100%" height={350}>
                            <ComposedChart data={timeRange === 'weekly' ? stats?.weeklyRevenue : stats?.monthlyRevenue}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                />
                                <Tooltip
                                    formatter={(value) => [new Intl.NumberFormat('fa-IR').format(Number(value)) + ' تومان', 'درآمد']}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                                    }}
                                />
                                <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[6, 6, 0, 0]} />
                                <Line type="monotone" dataKey="revenue" stroke="#1d4ed8" strokeWidth={3} dot={{ fill: '#1d4ed8', strokeWidth: 2, r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Feedback Distribution */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-500 rounded-lg">
                                    <PieChart className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-gray-800">توزیع بازخوردها</span>
                            </div>
                            <Badge variant="outline" className="bg-white border-green-200 text-green-700">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                تحلیل نظرات
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <ResponsiveContainer width="100%" height={350}>
                            <RechartsPieChart>
                                <Pie
                                    data={stats?.feedbackDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={110}
                                    innerRadius={40}
                                    fill="#8884d8"
                                    dataKey="value"
                                    stroke="#fff"
                                    strokeWidth={2}
                                >
                                    {stats?.feedbackDistribution?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [value, name]}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                                    }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{ paddingTop: '20px' }}
                                />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Satisfaction Trend */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-t-lg">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-500 rounded-lg">
                                    <Activity className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-gray-800">روند رضایت مشتری</span>
                            </div>
                            <Badge variant="outline" className="bg-white border-purple-200 text-purple-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                کیفیت خدمات
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={stats?.satisfactionData}>
                                <defs>
                                    <linearGradient id="satisfactionGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                />
                                <YAxis
                                    domain={[0, 5]}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                />
                                <Tooltip
                                    formatter={(value) => [Number(value).toFixed(1) + ' از ۵', 'امتیاز رضایت']}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="satisfaction"
                                    stroke="#7c3aed"
                                    fill="url(#satisfactionGradient)"
                                    strokeWidth={3}
                                    dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Sales by Status */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-orange-500 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-gray-800">فروش بر اساس وضعیت</span>
                            </div>
                            <Badge variant="outline" className="bg-white border-orange-200 text-orange-700">
                                <DollarSign className="h-3 w-3 mr-1" />
                                وضعیت پرداخت
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <ResponsiveContainer width="100%" height={350}>
                            <RechartsPieChart>
                                <Pie
                                    data={stats?.salesByStatus}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={110}
                                    innerRadius={40}
                                    fill="#8884d8"
                                    dataKey="value"
                                    stroke="#fff"
                                    strokeWidth={2}
                                >
                                    {stats?.salesByStatus?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [value, name]}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                                    }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{ paddingTop: '20px' }}
                                />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activities */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-600 rounded-lg">
                                <Activity className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-gray-800">فعالیت‌های اخیر سیستم</span>
                        </div>
                        <Badge variant="outline" className="bg-white border-slate-200 text-slate-700">
                            <Clock className="h-3 w-3 mr-1" />
                            زمان واقعی
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-3">
                        {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                            stats.recentActivities.map((activity, index) => (
                                <div key={index} className="group flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
                                            <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 group-hover:text-blue-900 transition-colors">
                                                {activity.description}
                                            </span>
                                            <span className="text-xs text-gray-500 mt-1">
                                                سیستم CRM
                                            </span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                                        {activity.time}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-16">
                                <div className="relative mx-auto w-24 h-24 mb-6">
                                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse"></div>
                                    <Activity className="absolute inset-0 m-auto h-12 w-12 text-gray-400" />
                                </div>
                                <p className="text-xl font-semibold text-gray-700 mb-2">هیچ فعالیت اخیری یافت نشد</p>
                                <p className="text-sm text-gray-500 max-w-md mx-auto">
                                    فعالیت‌های جدید سیستم شامل ثبت مشتری، فروش و بازخوردها اینجا نمایش داده خواهند شد
                                </p>
                                <Button 
                                    onClick={fetchSystemStats} 
                                    variant="outline" 
                                    size="sm" 
                                    className="mt-4 border-gray-300 hover:border-blue-300 hover:text-blue-600"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    بروزرسانی
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}