'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, Users2, Contact, Activity, MessageCircle, 
  TrendingUp, BarChart3, Calendar, User, Settings, Target, 
  Briefcase, Ticket, Building, FileText, Brain, Package, 
  Mail, Monitor, CheckCircle2, Shield
} from 'lucide-react';

interface Module {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  route?: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

const getModuleIcon = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    'LayoutDashboard': LayoutDashboard,
    'Users': Users2,
    'Users2': Users2,
    'UserCheck': Contact,
    'Activity': Activity,
    'MessageCircle': MessageCircle,
    'TrendingUp': TrendingUp,
    'BarChart3': BarChart3,
    'Calendar': Calendar,
    'User': User,
    'Settings': Settings,
    'Target': Target,
    'Briefcase': Briefcase,
    'Ticket': Ticket,
    'Building2': Building,
    'FileText': FileText,
    'Brain': Brain,
    'Package': Package,
    'Mail': Mail,
    'Monitor': Monitor,
    'CheckCircle': CheckCircle2,
    'Shield': Shield
  };
  
  return iconMap[iconName] || Settings;
};

export default function TestModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthToken = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/user-permissions', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (data.success) {
        setModules(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">تست ماژول‌های سیستم</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تمام ماژول‌های موجود ({modules.length} ماژول)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module) => {
              const IconComponent = getModuleIcon(module.icon);
              return (
                <Card key={module.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{module.display_name}</h3>
                        <p className="text-sm text-gray-500">{module.name}</p>
                      </div>
                    </div>
                    
                    {module.description && (
                      <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                    )}
                    
                    {module.route && (
                      <p className="text-xs text-gray-400 font-mono mb-2">{module.route}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        ترتیب: {module.sort_order}
                      </Badge>
                      <Badge variant={module.is_active ? "default" : "secondary"} className="text-xs">
                        {module.is_active ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>آمار ماژول‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{modules.length}</div>
              <div className="text-sm text-gray-600">کل ماژول‌ها</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {modules.filter(m => m.is_active).length}
              </div>
              <div className="text-sm text-gray-600">فعال</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {modules.filter(m => m.route?.startsWith('/dashboard/insights')).length}
              </div>
              <div className="text-sm text-gray-600">تحلیل و هوش مصنوعی</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {modules.filter(m => !m.route?.startsWith('/dashboard/insights') && m.route !== '/dashboard').length}
              </div>
              <div className="text-sm text-gray-600">عملیاتی</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}