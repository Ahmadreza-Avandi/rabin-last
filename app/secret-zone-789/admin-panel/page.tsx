'use client';

import { useState } from 'react';
import { Customer, DashboardStats } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardStatsComponent from './components/DashboardStats';
import CustomerTable from './components/CustomerTable';
import CustomerDetailsModal from './components/CustomerDetailsModal';
import SubscriptionManagement from './components/SubscriptionManagement';
import BillingInterface from './components/BillingInterface';

// Try to load react-icons, but provide simple fallbacks if not installed to avoid build/runtime errors
let FiHome: any = () => <svg className="w-5 h-5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9.5L12 3l9 6.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
let FiUsers: any = FiHome;
let FiCreditCard: any = FiHome;
let FiSettings: any = FiHome;
let FiLogOut: any = FiHome;
let FiLayers: any = FiHome;
let FiFileText: any = FiHome;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const icons = require('react-icons/fi');
    FiHome = icons.FiHome;
    FiUsers = icons.FiUsers;
    FiCreditCard = icons.FiCreditCard;
    FiSettings = icons.FiSettings;
    FiLogOut = icons.FiLogOut;
    FiLayers = icons.FiLayers;
    FiFileText = icons.FiFileText;
} catch (e) {
    // react-icons not installed — icon fallbacks will be used
}

// Mock data
const MOCK_CUSTOMERS: Customer[] = [
    {
        id: '1',
        name: 'علی محمدی',
        email: 'ali@example.com',
        phone: '09123456789',
        subscriptionStatus: 'active',
        subscriptionStart: '2024-01-01',
        subscriptionEnd: '2024-12-31',
        plan: 'سالانه',
        subscriptionHistory: [
            { id: 'h1', plan: 'ماهانه', start: '2023-01-01', end: '2023-02-01', amount: 100000 },
            { id: 'h2', plan: 'سالانه', start: '2024-01-01', end: '2024-12-31', amount: 1000000 },
        ],
    },
    {
        id: '2',
        name: 'زهرا رضایی',
        email: 'zahra@example.com',
        phone: '09121112222',
        subscriptionStatus: 'expired',
        subscriptionStart: '2022-01-01',
        subscriptionEnd: '2022-12-31',
        plan: 'ماهانه',
        subscriptionHistory: [
            { id: 'h3', plan: 'ماهانه', start: '2022-01-01', end: '2022-02-01', amount: 90000 },
        ],
    },
    {
        id: '3',
        name: 'مهدی کریمی',
        email: 'mehdi@example.com',
        phone: '09123334455',
        subscriptionStatus: 'suspended',
        subscriptionStart: '2023-06-01',
        subscriptionEnd: '2024-06-01',
        plan: 'ویژه',
        subscriptionHistory: [
            { id: 'h4', plan: 'ویژه', start: '2023-06-01', end: '2024-06-01', amount: 2000000 },
        ],
    },
];

const MOCK_STATS: DashboardStats = {
    totalCustomers: 150,
    activeCustomers: 120,
    expiredCustomers: 25,
    suspendedCustomers: 5,
    monthlyRevenue: 15000000,
    yearlyRevenue: 180000000,
};

// Helper function to get page title based on active tab
const getPageTitle = (tab: string): string => {
    const titles: Record<string, string> = {
        dashboard: 'داشبورد',
        customers: 'مدیریت مشتریان',
        subscriptions: 'مدیریت اشتراک‌ها',
        billing: 'صورتحساب‌ها و درآمد',
        settings: 'تنظیمات سیستم'
    };
    return titles[tab] || 'پنل مدیریت CRM';
};

export default function AdminPanel() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customers] = useState<Customer[]>(MOCK_CUSTOMERS);
    const [stats] = useState<DashboardStats>(MOCK_STATS);

    // router removed - not needed for this client-only mock admin

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'Ahmadreza.avandi' && password === 'Ahmadreza.avandi') {
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('نام کاربری یا رمز عبور اشتباه است');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">ورود به پنل مدیریت</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">نام کاربری</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                                placeholder="Ahmadreza.avandi"
                                title="نام کاربری را وارد کنید"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">رمز عبور</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                                placeholder="رمز عبور را وارد کنید"
                                title="رمز عبور را وارد کنید"
                            />
                        </div>
                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            ورود
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 lg:flex">
            {/* WordPress-style Sidebar */}
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onLogout={() => setIsAuthenticated(false)}
            />

            {/* Main Content */}
            <main className="flex-1 bg-gray-50 flex flex-col min-w-0 lg:ml-0">
                {/* Header */}
                <Header
                    title={getPageTitle(activeTab)}
                    userName="Ahmadreza.avandi"
                />

                {/* Content Area */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-4">

                    {/* Dashboard Content */}
                    {activeTab === 'dashboard' && (
                        <DashboardStatsComponent stats={stats} />
                    )}

                    {/* Customers Content */}
                    {activeTab === 'customers' && (
                        <CustomerTable
                            customers={customers}
                            onCustomerSelect={setSelectedCustomer}
                        />
                    )}

                    {/* Customer Details Modal */}
                    {selectedCustomer && (
                        <CustomerDetailsModal
                            customer={selectedCustomer}
                            onClose={() => setSelectedCustomer(null)}
                        />
                    )}

                    {/* Subscriptions Content */}
                    {activeTab === 'subscriptions' && (
                        <SubscriptionManagement customers={customers} />
                    )}

                    {activeTab === 'billing' && (
                        <BillingInterface stats={stats} />
                    )}

                    {activeTab === 'settings' && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">تنظیمات ادمین</h2>
                            <div className="max-w-md">
                                <label className="block text-sm font-medium text-gray-700">تغییر رمز (این نسخه فقط در سمت کلاینت)</label>
                                <input type="password" placeholder="رمز جدید" className="mt-2 border px-3 py-2 rounded-md w-full" />
                                <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded">ذخیره</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
