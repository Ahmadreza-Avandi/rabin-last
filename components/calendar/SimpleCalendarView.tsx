'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import moment from 'moment-jalaali';
import {
    Plus, Calendar as CalendarIcon, Users, Phone,
    Trash2, Bell, CheckCircle, ChevronLeft, ChevronRight
} from 'lucide-react';

// Configure moment-jalaali for Persian calendar
moment.loadPersian({ 
    dialect: 'persian-modern',
    usePersianDigits: true
});
moment.locale('fa');

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
    reminders?: Array<{
        method: 'popup' | 'email';
        minutes: number;
    }>;
}

interface SimpleCalendarViewProps {
    events: CalendarEvent[];
    onEventCreate?: (event: Omit<CalendarEvent, 'id'>) => void;
    onEventUpdate?: (event: CalendarEvent) => void;
    onEventDelete?: (eventId: string) => void;
    users?: Array<{ id: string; name: string; email: string }>;
    customers?: Array<{ id: string; name: string }>;
}

export default function SimpleCalendarView({
    events,
    onEventCreate,
    onEventUpdate,
    onEventDelete,
}: SimpleCalendarViewProps) {
    const [showEventDialog, setShowEventDialog] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDate, setCurrentDate] = useState(moment());
    const { toast } = useToast();

    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        start: '',
        end: '',
        allDay: false,
        type: 'meeting' as CalendarEvent['type'],
        participants: [] as string[],
        location: '',
        status: 'confirmed' as CalendarEvent['status'],
        reminders: [{ method: 'popup' as const, minutes: 15 }]
    });

    const resetForm = () => {
        setEventForm({
            title: '',
            description: '',
            start: '',
            end: '',
            allDay: false,
            type: 'meeting',
            participants: [],
            location: '',
            status: 'confirmed',
            reminders: [{ method: 'popup', minutes: 15 }]
        });
    };

    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setEventForm({
            title: event.title,
            description: event.description || '',
            start: event.start,
            end: event.end || '',
            allDay: event.allDay || false,
            type: event.type,
            participants: event.participants || [],
            location: event.location || '',
            status: event.status,
            reminders: event.reminders || [{ method: 'popup', minutes: 15 }]
        });
        setIsEditing(true);
        setShowEventDialog(true);
    };

    const handleSaveEvent = () => {
        if (!eventForm.title || !eventForm.start) {
            toast({
                title: "خطا",
                description: "عنوان و زمان شروع الزامی است",
                variant: "destructive"
            });
            return;
        }

        const eventData = {
            title: eventForm.title,
            description: eventForm.description,
            start: eventForm.start,
            end: eventForm.end,
            allDay: eventForm.allDay,
            type: eventForm.type,
            participants: eventForm.participants,
            location: eventForm.location,
            status: eventForm.status,
            color: getEventTypeColor(eventForm.type),
            reminders: eventForm.reminders
        };

        if (isEditing && selectedEvent) {
            onEventUpdate?.({ ...selectedEvent, ...eventData });
            toast({
                title: "موفق",
                description: "رویداد ویرایش شد"
            });
        } else {
            onEventCreate?.(eventData);
            toast({
                title: "موفق",
                description: "رویداد جدید ایجاد شد"
            });
        }

        setShowEventDialog(false);
        resetForm();
    };

    const handleDeleteEvent = () => {
        if (selectedEvent && onEventDelete) {
            onEventDelete(selectedEvent.id);
            toast({
                title: "موفق",
                description: "رویداد حذف شد"
            });
            setShowEventDialog(false);
        }
    };

    const getEventTypeColor = (type: CalendarEvent['type']) => {
        switch (type) {
            case 'meeting': return '#7c3aed';
            case 'call': return '#2563eb';
            case 'reminder': return '#dc2626';
            case 'task': return '#16a34a';
            default: return '#6b7280';
        }
    };

    const getEventTypeIcon = (type: CalendarEvent['type']) => {
        switch (type) {
            case 'meeting': return <Users className="h-4 w-4" />;
            case 'call': return <Phone className="h-4 w-4" />;
            case 'reminder': return <Bell className="h-4 w-4" />;
            case 'task': return <CheckCircle className="h-4 w-4" />;
            default: return <CalendarIcon className="h-4 w-4" />;
        }
    };

    // Generate calendar days for current month
    const generateCalendarDays = () => {
        const startOfMonth = currentDate.clone().startOf('jMonth');
        const endOfMonth = currentDate.clone().endOf('jMonth');
        const startOfWeek = startOfMonth.clone().startOf('week');
        const endOfWeek = endOfMonth.clone().endOf('week');

        const days = [];
        const current = startOfWeek.clone();

        while (current.isSameOrBefore(endOfWeek)) {
            days.push(current.clone());
            current.add(1, 'day');
        }

        return days;
    };

    const getEventsForDay = (day: moment.Moment) => {
        return events.filter(event => {
            const eventDate = moment(event.start);
            return eventDate.isSame(day, 'day');
        });
    };

    const calendarDays = generateCalendarDays();

    return (
        <div className="space-y-6">
            {/* Calendar Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-vazir">تقویم رویدادها</h2>
                    <p className="text-muted-foreground font-vazir">
                        مدیریت جلسات، تماس‌ها و یادآوری‌های شما
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(moment())}
                        className="font-vazir"
                    >
                        امروز
                    </Button>
                    <Button
                        onClick={() => {
                            resetForm();
                            setSelectedEvent(null);
                            setIsEditing(false);
                            setShowEventDialog(true);
                        }}
                        className="font-vazir"
                    >
                        <Plus className="h-4 w-4 ml-2" />
                        رویداد جدید
                    </Button>
                </div>
            </div>

            {/* Calendar */}
            <Card>
                <CardContent className="p-4">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentDate(currentDate.clone().subtract(1, 'jMonth'))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <h3 className="text-lg font-bold font-vazir">
                            {currentDate.format('jMMMM jYYYY')}
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentDate(currentDate.clone().add(1, 'jMonth'))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Week Days Header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'].map((day) => (
                            <div
                                key={day}
                                className="h-10 flex items-center justify-center text-sm font-medium text-muted-foreground font-vazir border-b"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => {
                            const isCurrentMonth = day.jMonth() === currentDate.jMonth();
                            const isToday = day.isSame(moment(), 'day');
                            const dayEvents = getEventsForDay(day);

                            return (
                                <div
                                    key={index}
                                    className={`min-h-[100px] p-2 border border-border/50 ${
                                        !isCurrentMonth ? 'bg-muted/20 text-muted-foreground' : 'bg-background'
                                    } ${
                                        isToday ? 'bg-primary/10 border-primary/30' : ''
                                    }`}
                                >
                                    <div className={`text-sm font-vazir mb-1 ${
                                        isToday ? 'font-bold text-primary' : ''
                                    }`}>
                                        {day.format('jDD')}
                                    </div>
                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 3).map((event) => (
                                            <div
                                                key={event.id}
                                                className="text-xs p-1 rounded cursor-pointer hover:opacity-80 font-vazir"
                                                style={{ backgroundColor: event.color || getEventTypeColor(event.type) }}
                                                onClick={() => handleEventClick(event)}
                                            >
                                                <div className="flex items-center gap-1 text-white">
                                                    {getEventTypeIcon(event.type)}
                                                    <span className="truncate">{event.title}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="text-xs text-muted-foreground font-vazir">
                                                +{dayEvents.length - 3} بیشتر
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Event Dialog */}
            <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-vazir">
                            {isEditing ? 'ویرایش رویداد' : 'رویداد جدید'}
                        </DialogTitle>
                        <DialogDescription className="font-vazir">
                            {isEditing ? 'اطلاعات رویداد را ویرایش کنید' : 'اطلاعات رویداد جدید را وارد کنید'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-vazir">عنوان *</Label>
                                <Input
                                    placeholder="عنوان رویداد"
                                    value={eventForm.title}
                                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                                    className="font-vazir"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-vazir">نوع</Label>
                                <Select
                                    value={eventForm.type}
                                    onValueChange={(value: CalendarEvent['type']) =>
                                        setEventForm({ ...eventForm, type: value })
                                    }
                                >
                                    <SelectTrigger className="font-vazir">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="meeting" className="font-vazir">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                جلسه
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="call" className="font-vazir">
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4" />
                                                تماس
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="reminder" className="font-vazir">
                                            <div className="flex items-center gap-2">
                                                <Bell className="h-4 w-4" />
                                                یادآوری
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="task" className="font-vazir">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4" />
                                                وظیفه
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-vazir">توضیحات</Label>
                            <Textarea
                                placeholder="توضیحات رویداد"
                                value={eventForm.description}
                                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                className="font-vazir"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-vazir">تاریخ و زمان شروع *</Label>
                                <Input
                                    type="datetime-local"
                                    value={eventForm.start ? moment(eventForm.start).format('YYYY-MM-DDTHH:mm') : ''}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setEventForm({
                                                ...eventForm,
                                                start: new Date(e.target.value).toISOString()
                                            });
                                        }
                                    }}
                                    className="font-vazir"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-vazir">تاریخ و زمان پایان</Label>
                                <Input
                                    type="datetime-local"
                                    value={eventForm.end ? moment(eventForm.end).format('YYYY-MM-DDTHH:mm') : ''}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setEventForm({
                                                ...eventForm,
                                                end: new Date(e.target.value).toISOString()
                                            });
                                        }
                                    }}
                                    className="font-vazir"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-vazir">مکان</Label>
                            <Input
                                placeholder="مکان برگزاری"
                                value={eventForm.location}
                                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                                className="font-vazir"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-vazir">وضعیت</Label>
                            <Select
                                value={eventForm.status}
                                onValueChange={(value: CalendarEvent['status']) =>
                                    setEventForm({ ...eventForm, status: value })
                                }
                            >
                                <SelectTrigger className="font-vazir">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="confirmed" className="font-vazir">تایید شده</SelectItem>
                                    <SelectItem value="tentative" className="font-vazir">موقت</SelectItem>
                                    <SelectItem value="cancelled" className="font-vazir">لغو شده</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end space-x-2 space-x-reverse">
                            {isEditing && (
                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteEvent}
                                    className="font-vazir"
                                >
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    حذف
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => setShowEventDialog(false)}
                                className="font-vazir"
                            >
                                انصراف
                            </Button>
                            <Button
                                onClick={handleSaveEvent}
                                className="font-vazir"
                            >
                                {isEditing ? 'ویرایش' : 'ایجاد'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}