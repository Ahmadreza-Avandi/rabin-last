'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar as CalendarIcon,
  Users,
  Phone,
  Clock,
  TrendingUp,
  Plus
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  type: 'meeting' | 'call' | 'reminder' | 'task';
  participants?: string[];
  location?: string;
  description?: string;
  color?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  customer_name?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Customer {
  id: string;
  name: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Utility function to get auth token
  const getAuthToken = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];
  };

  useEffect(() => {
    fetchEvents();
    fetchUsers();
    fetchCustomers();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      // Get events for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const params = new URLSearchParams({
        from: startOfMonth.toISOString().split('T')[0],
        to: endOfMonth.toISOString().split('T')[0]
      });

      const response = await fetch(`/api/events?${params.toString()}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        // Transform API data to component format
        const transformedEvents = data.data.map((event: any) => ({
          id: event.id,
          title: event.title,
          start: event.start_date,
          end: event.end_date,
          allDay: event.all_day,
          type: event.type,
          participants: event.participants?.map((p: any) => p.user_id) || [],
          location: event.location,
          description: event.description,
          status: event.status,
          customer_name: event.customer_name
        }));
        setEvents(transformedEvents);
      } else {
        toast({
          title: "خطا",
          description: data.message || "خطا در دریافت رویدادها",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "خطا",
        description: "خطا در اتصال به سرور",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
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

  const handleEventCreate = async (eventData: Omit<CalendarEvent, 'id'>) => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          title: eventData.title,
          description: eventData.description,
          start: eventData.start,
          end: eventData.end,
          allDay: eventData.allDay,
          type: eventData.type,
          participants: eventData.participants,
          location: eventData.location,
          status: eventData.status,
          reminders: [{ method: 'popup', minutes: 15 }]
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchEvents(); // Refresh events
      } else {
        toast({
          title: "خطا",
          description: data.message || "خطا در ایجاد رویداد",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "خطا",
        description: "خطا در اتصال به سرور",
        variant: "destructive"
      });
    }
  };

  const handleEventUpdate = async (eventData: CalendarEvent) => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/events', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          id: eventData.id,
          title: eventData.title,
          description: eventData.description,
          start: eventData.start,
          end: eventData.end,
          allDay: eventData.allDay,
          type: eventData.type,
          participants: eventData.participants,
          location: eventData.location,
          status: eventData.status
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchEvents(); // Refresh events
      } else {
        toast({
          title: "خطا",
          description: data.message || "خطا در ویرایش رویداد",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "خطا",
        description: "خطا در اتصال به سرور",
        variant: "destructive"
      });
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/events?id=${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const data = await response.json();
      if (data.success) {
        fetchEvents(); // Refresh events
      } else {
        toast({
          title: "خطا",
          description: data.message || "خطا در حذف رویداد",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "خطا",
        description: "خطا در اتصال به سرور",
        variant: "destructive"
      });
    }
  };

  // Calculate stats
  const today = new Date().toDateString();
  const todayEvents = events.filter(event =>
    new Date(event.start).toDateString() === today
  );

  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay() + 6); // Saturday
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

  const thisWeekEvents = events.filter(event => {
    const eventDate = new Date(event.start);
    return eventDate >= thisWeekStart && eventDate <= thisWeekEnd;
  });

  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.start);
    const now = new Date();
    return eventDate > now;
  }).slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground font-vazir mt-4">در حال بارگذاری تقویم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-vazir bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          تقویم رویدادها
        </h1>
        <p className="text-muted-foreground font-vazir mt-2">
          مدیریت جلسات، تماس‌ها و یادآوری‌های شما
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">
              رویدادهای امروز
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">{todayEvents.length}</div>
            <p className="text-xs text-muted-foreground font-vazir">
              {todayEvents.filter(e => e.type === 'meeting').length} جلسه، {todayEvents.filter(e => e.type === 'call').length} تماس
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-secondary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">
              این هفته
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">{thisWeekEvents.length}</div>
            <p className="text-xs text-muted-foreground font-vazir">
              رویداد برنامه‌ریزی شده
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-accent/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">
              جلسات
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">
              {events.filter(e => e.type === 'meeting').length}
            </div>
            <p className="text-xs text-muted-foreground font-vazir">
              کل جلسات ماه
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-vazir">
              تماس‌ها
            </CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-vazir">
              {events.filter(e => e.type === 'call').length}
            </div>
            <p className="text-xs text-muted-foreground font-vazir">
              کل تماس‌های ماه
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-vazir flex items-center gap-2">
              <Clock className="h-5 w-5" />
              رویدادهای پیش رو
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full`} style={{
                      backgroundColor: event.type === 'meeting' ? '#7c3aed' :
                        event.type === 'call' ? '#2563eb' :
                          event.type === 'reminder' ? '#dc2626' : '#16a34a'
                    }} />
                    <div>
                      <p className="font-medium font-vazir">{event.title}</p>
                      <p className="text-sm text-muted-foreground font-vazir">
                        {new Date(event.start).toLocaleDateString('fa-IR')} - {new Date(event.start).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground font-vazir">
                    {event.location && `📍 ${event.location}`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simple Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="font-vazir flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              تقویم ساده
            </span>
            <Button size="sm" className="font-vazir">
              <Plus className="h-4 w-4 ml-2" />
              رویداد جدید
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-vazir">هیچ رویدادی برای نمایش وجود ندارد</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full`} style={{
                        backgroundColor: event.type === 'meeting' ? '#7c3aed' :
                          event.type === 'call' ? '#2563eb' :
                            event.type === 'reminder' ? '#dc2626' : '#16a34a'
                      }} />
                      <div>
                        <h4 className="font-medium font-vazir">{event.title}</h4>
                        <p className="text-sm text-muted-foreground font-vazir">
                          {new Date(event.start).toLocaleDateString('fa-IR')} - {new Date(event.start).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground font-vazir mt-1">{event.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground font-vazir">
                      {event.location && `📍 ${event.location}`}
                      {event.customer_name && (
                        <div className="text-xs mt-1">👤 {event.customer_name}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}