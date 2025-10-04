'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import {
    LayoutDashboard,
    Users,
    Contact,
    Ticket,
    MessageCircle,
    TrendingUp,
    BarChart3,
    Settings,
    ChevronDown,
    ChevronRight,
    Menu,
    X,
    Building2,
    Activity,
    Calendar,
    Briefcase,
    Target,
    FileText,
    Brain,
    Package,
    User,
    Mail,
    Monitor,
    CheckCircle,
    Mic2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<any>;
    badge?: string;
    children?: NavItem[];
}

interface Module {
    id: string;
    name: string;
    display_name: string;
    route: string;
    icon: string;
    sort_order: number;
    parent_id?: string;
}

// Dashboard color scheme
const dashboardColors = {
    primary: '#00BCD4',
    secondary: '#4CAF50',
    accent: '#FF9800',
    primaryLight: 'rgba(0, 188, 212, 0.1)',
    secondaryLight: 'rgba(76, 175, 80, 0.1)',
    accentLight: 'rgba(255, 152, 0, 0.1)',
    primaryBorder: 'rgba(0, 188, 212, 0.2)',
    secondaryBorder: 'rgba(76, 175, 80, 0.2)',
    accentBorder: 'rgba(255, 152, 0, 0.2)',
    text: '#000000',        // سیاه کامل
    textMuted: '#1a1a1a'    // تقریباً سیاه
};

// نقشه آیکون‌ها
const iconMap: { [key: string]: React.ComponentType<any> } = {
    'Home': LayoutDashboard,
    'LayoutDashboard': LayoutDashboard,
    'Users': Users,
    'Users2': Target,
    'UserCheck': Contact,
    'Activity': Activity,
    'MessageCircle': MessageCircle,
    'MessageCircle2': MessageCircle,
    'DollarSign': TrendingUp,
    'BarChart3': BarChart3,
    'Calendar': Calendar,
    'User': Contact,
    'Settings': Settings,
    'Target': Target,
    'Briefcase': Briefcase,
    'Ticket': Ticket,
    'ChevronRight': ChevronRight,
    'Building2': Building2,
    'TrendingUp': TrendingUp,
    'FileText': FileText,
    'Brain': Brain,
    'Package': Package,
    'Mail': Mail,
    'Monitor': Monitor,
    'Mic2': Mic2,
};

// نقشه نام‌های نمایشی روت‌ها
const routeDisplayNames: { [key: string]: string } = {
    '/dashboard': 'داشبورد',
    '/dashboard/customers': 'مشتریان',
    '/dashboard/contacts': 'مخاطبین',
    '/dashboard/coworkers': 'همکاران',
    '/dashboard/tasks': 'وظایف',
    '/dashboard/activities': 'فعالیت‌ها',
    '/dashboard/chat': 'چت',
    '/dashboard/customer-club': 'باشگاه مشتریان',
    '/dashboard/deals': 'معاملات',
    '/dashboard/feedback': 'بازخوردها',
    '/dashboard/reports': 'گزارش‌ها',
    '/dashboard/daily-reports': 'گزارش‌های روزانه',
    '/dashboard/insights/reports-analysis': 'تحلیل گزارشات',
    '/dashboard/insights/feedback-analysis': 'تحلیل بازخوردها',
    '/dashboard/insights/sales-analysis': 'تحلیل فروش',
    '/dashboard/insights/audio-analysis': 'تحلیل صوتی',
    '/dashboard/calendar': 'تقویم',
    '/dashboard/profile': 'پروفایل',
    '/dashboard/settings': 'تنظیمات سیستم',
    '/dashboard/system-monitoring': 'مانیتورینگ سیستم',
    '/dashboard/products': 'محصولات',
    '/dashboard/documents': 'مدیریت اسناد',
};

interface DashboardSidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
    mobileOpen = false,
    onMobileClose
}) => {
    const pathname = usePathname();
    const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);
    const [navItems, setNavItems] = useState<NavItem[]>([
        {
            title: 'داشبورد',
            href: '/dashboard',
            icon: LayoutDashboard,
        },
        {
            title: 'مشتریان',
            href: '/dashboard/customers',
            icon: Users,
        },
        {
            title: 'همکاران',
            href: '/dashboard/coworkers',
            icon: Users,
        },
        {
            title: 'وظایف',
            href: '/dashboard/tasks',
            icon: CheckCircle,
        },
        {
            title: 'فعالیت‌ها',
            href: '/dashboard/activities',
            icon: Activity,
        },
        {
            title: 'چت',
            href: '/dashboard/chat',
            icon: MessageCircle,
        },
        {
            title: 'گزارش‌ها',
            href: '/dashboard/reports',
            icon: BarChart3,
        },
        {
            title: 'تقویم',
            href: '/dashboard/calendar',
            icon: Calendar,
        },
        {
            title: 'محصولات',
            href: '/dashboard/products',
            icon: Package,
        }
    ]);
    const [loading, setLoading] = useState(false);

    const fetchUserPermissions = async () => {
        // Set default items immediately to prevent flash
        const defaultItems = [
            {
                title: 'داشبورد',
                href: '/dashboard',
                icon: LayoutDashboard,
            },
            {
                title: 'مشتریان',
                href: '/dashboard/customers',
                icon: Users,
            },
            {
                title: 'همکاران',
                href: '/dashboard/coworkers',
                icon: Users,
            },
            {
                title: 'وظایف',
                href: '/dashboard/tasks',
                icon: CheckCircle,
            },
            {
                title: 'فعالیت‌ها',
                href: '/dashboard/activities',
                icon: Activity,
            },
            {
                title: 'چت',
                href: '/dashboard/chat',
                icon: MessageCircle,
            },
            {
                title: 'گزارش‌ها',
                href: '/dashboard/reports',
                icon: BarChart3,
            },
            {
                title: 'تقویم',
                href: '/dashboard/calendar',
                icon: Calendar,
            },
            {
                title: 'محصولات',
                href: '/dashboard/products',
                icon: Package,
            }
        ];

        setNavItems(defaultItems);
        setLoading(false);

        // Try to fetch from API in background
        try {
            const response = await fetch('/api/auth/permissions');
            const data = await response.json();

            if (data.success) {
                const modules: Module[] = data.data;
                const convertedNavItems = convertModulesToNavItems(modules);
                setNavItems(convertedNavItems);
            }
        } catch (error) {
            console.log('API not available, using default items');
            // Keep default items
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchUserPermissions();

        const handleRefreshSidebar = () => {
            console.log('🔄 Refreshing sidebar permissions...');
            fetchUserPermissions();
        };

        window.addEventListener('refreshSidebar', handleRefreshSidebar);

        return () => {
            window.removeEventListener('refreshSidebar', handleRefreshSidebar);
        };
    }, []);

    // Don't hide sidebar on mount - just show loading state
    // if (!mounted) {
    //     return null;
    // }

    const convertModulesToNavItems = (modules: Module[]): NavItem[] => {
        const filteredModules = modules
            .filter(module => module.route && module.route !== '#')
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        const navItems: NavItem[] = [];

        // Add dashboard first if exists
        const dashboardModule = filteredModules.find(m => m.name === 'dashboard');
        if (dashboardModule) {
            navItems.push({
                title: routeDisplayNames[dashboardModule.route] || dashboardModule.display_name,
                href: dashboardModule.route,
                icon: iconMap[dashboardModule.icon] || LayoutDashboard,
            });
        }

        // Add other modules
        filteredModules.forEach(module => {
            if (module.name !== 'dashboard') {
                navItems.push({
                    title: routeDisplayNames[module.route] || module.display_name,
                    href: module.route,
                    icon: iconMap[module.icon] || LayoutDashboard,
                });
            }
        });

        return navItems;
    };

    const toggleExpanded = (title: string) => {
        setExpandedItems(prev => {
            if (prev.includes(title)) {
                return prev.filter(item => item !== title);
            }
            return [title];
        });
    };

    const renderNavItem = (item: NavItem, level = 0) => {
        const isActive = pathname === item.href;
        const isExpanded = expandedItems.includes(item.title);
        const hasChildren = item.children && item.children.length > 0;

        const activeStyle = {
            background: `linear-gradient(to right, ${dashboardColors.primaryBorder}, ${dashboardColors.secondaryBorder}, ${dashboardColors.accentBorder})`,
            color: dashboardColors.primary,
            borderColor: dashboardColors.primaryBorder,
            borderWidth: '1px',
            borderStyle: 'solid'
        };

        const hoverStyle = {
            background: `linear-gradient(to right, ${dashboardColors.primaryLight}, ${dashboardColors.secondaryLight}, ${dashboardColors.accentLight})`
        };

        return (
            <div key={item.title}>
                <div
                    className={cn(
                        'flex items-center space-x-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative overflow-hidden',
                        level > 0 && 'ml-4',
                        sidebarCollapsed && 'justify-center px-2'
                    )}
                    style={isActive ? activeStyle : {}}
                    onMouseEnter={(e) => {
                        if (!isActive) {
                            Object.assign(e.currentTarget.style, hoverStyle);
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive) {
                            e.currentTarget.style.background = '';
                        }
                    }}
                >
                    {hasChildren ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-inherit hover:bg-transparent relative z-10 w-full"
                            onClick={() => toggleExpanded(item.title)}
                        >
                            <div className="flex items-center space-x-3 space-x-reverse w-full">
                                <item.icon
                                    className="h-5 w-5 transition-colors duration-300 flex-shrink-0"
                                    style={{ color: isActive ? dashboardColors.primary : dashboardColors.textMuted }}
                                />
                                <div className="flex items-center space-x-3 space-x-reverse flex-1">
                                    <span className="flex-1 font-vazir text-sm text-right" style={{ color: isActive ? dashboardColors.primary : dashboardColors.text }}>
                                        {item.title}
                                    </span>
                                    {item.badge && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                            style={{
                                                backgroundColor: dashboardColors.accentLight,
                                                color: dashboardColors.accent,
                                                borderColor: dashboardColors.accentBorder
                                            }}
                                        >
                                            {item.badge}
                                        </Badge>
                                    )}
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 transition-transform duration-300 flex-shrink-0" style={{ color: dashboardColors.textMuted }} />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 transition-transform duration-300 flex-shrink-0" style={{ color: dashboardColors.textMuted }} />
                                    )}
                                </div>
                            </div>
                        </Button>
                    ) : (
                        <Link
                            href={item.href}
                            className="flex items-center space-x-3 space-x-reverse flex-1 relative z-10 cursor-pointer"
                            onClick={() => console.log('Clicked:', item.title, item.href)}
                        >
                            <item.icon
                                className="h-5 w-5 transition-colors duration-300 flex-shrink-0"
                                style={{ color: isActive ? dashboardColors.primary : dashboardColors.textMuted }}
                            />
                            <div className="flex items-center space-x-3 space-x-reverse flex-1">
                                <span className="flex-1 font-vazir text-sm" style={{ color: isActive ? dashboardColors.primary : dashboardColors.text }}>
                                    {item.title}
                                </span>
                                {item.badge && (
                                    <Badge
                                        variant="secondary"
                                        className="mr-auto text-xs"
                                        style={{
                                            backgroundColor: dashboardColors.accentLight,
                                            color: dashboardColors.accent,
                                            borderColor: dashboardColors.accentBorder
                                        }}
                                    >
                                        {item.badge}
                                    </Badge>
                                )}
                            </div>
                        </Link>
                    )}
                </div>

                {hasChildren && isExpanded && (
                    <div className="mr-4 space-y-1 animate-slide-in-right">
                        {item.children?.map(child => renderNavItem(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Mobile overlay */}
            {(mobileOpen || !sidebarCollapsed) && (
                <div
                    className="fixed inset-0 bg-black/50 lg:hidden z-30 backdrop-blur-sm"
                    onClick={() => {
                        setSidebarCollapsed(true);
                        onMobileClose?.();
                    }}
                />
            )}

            {/* Sidebar */}
            <div
                className={cn(
                    'fixed right-0 top-16 z-50 h-[calc(100vh-4rem)] transition-all duration-300 shadow-2xl flex flex-col',
                    // Desktop: always show with fixed width
                    'w-72',
                    // Mobile: show/hide based on state
                    'max-lg:w-[85vw] max-lg:max-w-[300px]',
                    mobileOpen ? 'translate-x-0' : 'max-lg:translate-x-full'
                )}
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(16px)',
                    borderLeft: `2px solid ${dashboardColors.primaryBorder}`,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    color: dashboardColors.text,
                    fontFamily: "'Vazirmatn', Inter, system-ui, sans-serif"
                }}
            >
                {/* Main Navigation */}
                <nav
                    className="space-y-1 p-3 overflow-y-auto flex-1 pt-4"
                    style={{
                        backgroundColor: 'transparent',
                        color: dashboardColors.text
                    }}
                >
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div
                                className="animate-spin rounded-full h-8 w-8 border-b-2"
                                style={{ borderColor: dashboardColors.primary }}
                            ></div>
                        </div>
                    ) : navItems.length > 0 ? (
                        navItems.map(item => renderNavItem(item))
                    ) : (
                        <div className="flex items-center justify-center py-8">
                            <p className="text-sm" style={{ color: dashboardColors.textMuted }}>
                                در حال بارگذاری منو...
                            </p>
                        </div>
                    )}
                </nav>

                {/* Bottom Section: Profile */}
                <div className="mt-auto" style={{ borderTop: `1px solid ${dashboardColors.primaryBorder}` }}>
                    <div className="p-4 space-y-2">
                        <Link href="/dashboard/profile">
                            <div
                                className={cn(
                                    'flex items-center space-x-3 space-x-reverse rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative overflow-hidden'
                                )}
                                style={pathname === '/dashboard/profile' ? {
                                    background: `linear-gradient(to right, ${dashboardColors.primaryBorder}, ${dashboardColors.secondaryBorder}, ${dashboardColors.accentBorder})`,
                                    color: dashboardColors.primary,
                                    borderColor: dashboardColors.primaryBorder,
                                    borderWidth: '1px',
                                    borderStyle: 'solid'
                                } : {}}
                                onMouseEnter={(e) => {
                                    if (pathname !== '/dashboard/profile') {
                                        e.currentTarget.style.backgroundColor = dashboardColors.primaryLight;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (pathname !== '/dashboard/profile') {
                                        e.currentTarget.style.backgroundColor = '';
                                    }
                                }}
                            >
                                <User
                                    className="h-5 w-5 flex-shrink-0"
                                    style={{ color: pathname === '/dashboard/profile' ? dashboardColors.primary : dashboardColors.textMuted }}
                                />
                                <span
                                    className="font-vazir text-sm"
                                    style={{ color: pathname === '/dashboard/profile' ? dashboardColors.primary : dashboardColors.text }}
                                >
                                    پروفایل کاربری
                                </span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};