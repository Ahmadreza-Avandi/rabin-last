'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Search, UserPlus, Mail, Phone, Building, Calendar, Activity,
  Eye, Edit, Trash2, Users, Star, MapPin, Linkedin, Twitter, Filter
} from 'lucide-react';

interface Contact {
  id: string;
  customer_id?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  job_title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  linkedin_url?: string;
  twitter_url?: string;
  address?: string;
  city?: string;
  country?: string;
  source?: string;
  status: string;
  is_primary: boolean;
  notes?: string;
  created_at: string;
  company?: {
    id: string;
    name: string;
  };
}

interface Customer {
  id: string;
  name: string;
  industry?: string;
  status: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newContact, setNewContact] = useState({
    customer_id: '',
    first_name: '',
    last_name: '',
    job_title: '',
    department: '',
    email: '',
    phone: '',
    mobile: '',
    linkedin_url: '',
    twitter_url: '',
    address: '',
    city: '',
    country: 'ایران',
    source: 'other',
    notes: ''
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
    fetchContacts();
    fetchCustomers();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch('/api/contacts', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (data.success) {
        setContacts(data.data || []);
      } else {
        toast({
          title: "خطا",
          description: "خطا در بارگذاری مخاطبین",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "خطا",
        description: "خطا در اتصال به سرور",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/customers?limit=100', {
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

  const handleCreateContact = async () => {
    if (!newContact.first_name || !newContact.last_name) {
      toast({
        title: "خطا",
        description: "نام و نام خانوادگی الزامی است",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      const token = getAuthToken();

      console.log('Creating contact with data:', newContact);

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(newContact),
      });

      const data = await response.json();
      console.log('Contact creation response:', data);

      if (data.success) {
        toast({
          title: "موفق",
          description: `مخاطب ${newContact.first_name} ${newContact.last_name} با موفقیت اضافه شد`
        });
        setOpen(false);
        resetForm();
        fetchContacts();
      } else {
        console.error('Contact creation error:', data);
        toast({
          title: "خطا",
          description: data.message || "خطا در افزودن مخاطب",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: "خطا",
        description: "خطا در اتصال به سرور",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNewContact({
      customer_id: '',
      first_name: '',
      last_name: '',
      job_title: '',
      department: '',
      email: '',
      phone: '',
      mobile: '',
      linkedin_url: '',
      twitter_url: '',
      address: '',
      city: '',
      country: 'ایران',
      source: 'other',
      notes: ''
    });
  };

  const getContactName = (contact: Contact) => {
    return contact.full_name || `${contact.first_name} ${contact.last_name}`.trim();
  };

  const filteredContacts = contacts.filter(contact => {
    const contactName = getContactName(contact);
    const matchesSearch =
      contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    const matchesCompany = companyFilter === 'all' ||
      (companyFilter === 'individual' && !contact.customer_id) ||
      (companyFilter !== 'individual' && contact.customer_id === companyFilter);

    return matchesSearch && matchesStatus && matchesCompany;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'website': return 'وب‌سایت';
      case 'referral': return 'معرفی';
      case 'social_media': return 'شبکه اجتماعی';
      case 'cold_call': return 'تماس سرد';
      case 'trade_show': return 'نمایشگاه';
      default: return 'سایر';
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'website': return 'bg-blue-100 text-blue-700';
      case 'referral': return 'bg-green-100 text-green-700';
      case 'social_media': return 'bg-purple-100 text-purple-700';
      case 'cold_call': return 'bg-orange-100 text-orange-700';
      case 'trade_show': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">مخاطبین</h1>
              <p className="text-muted-foreground">مدیریت اطلاعات مخاطبین و ارتباطات</p>
            </div>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <UserPlus className="h-4 w-4 ml-2" />
              افزودن مخاطب
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>افزودن مخاطب جدید</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">اطلاعات پایه</TabsTrigger>
                  <TabsTrigger value="additional">اطلاعات تکمیلی</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  {/* Company Selection */}
                  <div className="space-y-2">
                    <Label>شرکت</Label>
                    <Select
                      value={newContact.customer_id || 'independent'}
                      onValueChange={(value) => setNewContact({ ...newContact, customer_id: value === 'independent' ? '' : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب شرکت (اختیاری)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="independent">فرد مستقل</SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نام *</Label>
                      <Input
                        value={newContact.first_name}
                        onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نام خانوادگی *</Label>
                      <Input
                        value={newContact.last_name}
                        onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Job Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>سمت</Label>
                      <Input
                        value={newContact.job_title}
                        onChange={(e) => setNewContact({ ...newContact, job_title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>بخش</Label>
                      <Input
                        value={newContact.department}
                        onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>ایمیل</Label>
                      <Input
                        type="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>تلفن ثابت</Label>
                        <Input
                          value={newContact.phone}
                          onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>موبایل</Label>
                        <Input
                          value={newContact.mobile}
                          onChange={(e) => setNewContact({ ...newContact, mobile: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Source */}
                  <div className="space-y-2">
                    <Label>منبع</Label>
                    <Select
                      value={newContact.source}
                      onValueChange={(value) => setNewContact({ ...newContact, source: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">وب‌سایت</SelectItem>
                        <SelectItem value="referral">معرفی</SelectItem>
                        <SelectItem value="social_media">شبکه‌های اجتماعی</SelectItem>
                        <SelectItem value="cold_call">تماس سرد</SelectItem>
                        <SelectItem value="trade_show">نمایشگاه</SelectItem>
                        <SelectItem value="other">سایر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="additional" className="space-y-4">
                  {/* Social Links */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>لینکدین</Label>
                      <Input
                        value={newContact.linkedin_url}
                        onChange={(e) => setNewContact({ ...newContact, linkedin_url: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>توییتر</Label>
                      <Input
                        value={newContact.twitter_url}
                        onChange={(e) => setNewContact({ ...newContact, twitter_url: e.target.value })}
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>آدرس</Label>
                      <Textarea
                        value={newContact.address}
                        onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>شهر</Label>
                        <Input
                          value={newContact.city}
                          onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>کشور</Label>
                        <Input
                          value={newContact.country}
                          onChange={(e) => setNewContact({ ...newContact, country: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>یادداشت</Label>
                    <Textarea
                      value={newContact.notes}
                      onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                      rows={4}
                      placeholder="یادداشت‌های مربوط به این مخاطب..."
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  انصراف
                </Button>
                <Button
                  onClick={handleCreateContact}
                  disabled={saving || !newContact.first_name || !newContact.last_name}
                >
                  {saving ? 'در حال ذخیره...' : 'افزودن مخاطب'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* آمار کلی */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">کل مخاطبین</CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{contacts.length.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">فعال</CardTitle>
            <div className="p-2 bg-green-500 rounded-lg">
              <Activity className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {contacts.filter(c => c.status === 'active').length.toLocaleString('fa-IR')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">شرکتی</CardTitle>
            <div className="p-2 bg-purple-500 rounded-lg">
              <Building className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {contacts.filter(c => c.customer_id).length.toLocaleString('fa-IR')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">مخاطب اصلی</CardTitle>
            <div className="p-2 bg-amber-500 rounded-lg">
              <Star className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {contacts.filter(c => c.is_primary).length.toLocaleString('fa-IR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فیلتر و جستجو
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در مخاطبین..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="inactive">غیرفعال</SelectItem>
                <SelectItem value="blocked">مسدود</SelectItem>
              </SelectContent>
            </Select>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="شرکت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه مخاطبین</SelectItem>
                <SelectItem value="individual">افراد مستقل</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              نمایش {filteredContacts.length.toLocaleString('fa-IR')} مخاطب از مجموع {contacts.length.toLocaleString('fa-IR')}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCompanyFilter('all');
              }}
            >
              <Filter className="h-4 w-4 ml-2" />
              پاک کردن فیلترها
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List - Phone Book Style */}
      {loading ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/3"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-24"></div>
                    <div className="h-3 bg-muted rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredContacts.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">مخاطبی یافت نشد</h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm ? 'هیچ مخاطبی با این جستجو یافت نشد' : 'هنوز مخاطبی اضافه نشده است'}
              </p>
              <Button
                onClick={() => setOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <UserPlus className="h-4 w-4 ml-2" />
                افزودن اولین مخاطب
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              دفتر تلفن ({filteredContacts.length.toLocaleString('fa-IR')} مخاطب)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredContacts.map((contact, index) => (
                <div
                  key={contact.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}
                >
                  {/* Avatar and Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                        {contact.first_name[0]}{contact.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {getContactName(contact)}
                        </h4>
                        {contact.is_primary && (
                          <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )}
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(contact.status)}`}></div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {contact.job_title && (
                          <span className="truncate">{contact.job_title}</span>
                        )}
                        {contact.job_title && contact.company && <span>•</span>}
                        {contact.company && (
                          <span className="truncate">{contact.company.name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="flex items-center gap-6 text-sm">
                    {contact.mobile && (
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="font-mono">{contact.mobile}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="truncate max-w-48">{contact.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge className={`text-xs ${getSourceBadgeColor(contact.source || 'other')}`}>
                      {getSourceLabel(contact.source || 'other')}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}