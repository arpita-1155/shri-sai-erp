"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema, ServiceFormValues } from "@/types/service";
import { getCompanies, getMasterData, getEmployees } from "@/lib/services/settingsService";
import { getFilteredCustomers } from "@/lib/services/customerService";
import { addService } from "@/lib/services/serviceRegister";
import { Customer } from "@/types/customer";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export function ServiceForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Master Data
  const [companies, setCompanies] = useState<any[]>([]);
  const [billingTypes, setBillingTypes] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<any[]>([]);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  
  // Dynamic Customers
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<Customer | null>(null);

  // Auto Dates
  const today = new Date();
  const followUp = new Date();
  followUp.setDate(today.getDate() + 7); // Default 7 days

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      companyId: "", billingTypeId: "", customerId: "",
      date: today.toISOString().split('T')[0], // YYYY-MM-DD
      followUpDate: followUp.toISOString().split('T')[0],
      area: "", treatmentTypeId: "", employeeId: "",
      price: 0, paymentStatusId: "", paymentModeId: "", billGiven: false, remarks: "",
    },
  });

  const watchCompany = form.watch("companyId");
  const watchBilling = form.watch("billingTypeId");
  const watchCustomer = form.watch("customerId");

  // Load Initial Master Data
  useEffect(() => {
    const load = async () => {
      const [comps, bills, treats, emps, pStatus, pModes] = await Promise.all([
        getCompanies(), getMasterData("master_billing_types"), getMasterData("master_treatments"),
        getEmployees(), getMasterData("master_payment_status"), getMasterData("master_payment_modes")
      ]);
      setCompanies(comps.filter(c => c.isActive !== false));
      setBillingTypes(bills.filter(b => b.isActive !== false));
      setTreatments(treats.filter(t => t.isActive !== false));
      setEmployees(emps.filter(e => e.isActive !== false));
      setPaymentStatus(pStatus.filter(p => p.isActive !== false));
      setPaymentModes(pModes.filter(p => p.isActive !== false));
    };
    load();
  }, []);

  // Isolate and load Customers ONLY when Company & Billing are selected
  useEffect(() => {
    const loadCustomers = async () => {
      if (watchCompany && watchBilling) {
        const custs = await getFilteredCustomers(watchCompany, watchBilling);
        setAvailableCustomers(custs.filter(c => c.isActive !== false));
      } else {
        setAvailableCustomers([]);
      }
      form.setValue("customerId", ""); // Reset customer if category changes
      setSelectedCustomerDetails(null);
    };
    loadCustomers();
  }, [watchCompany, watchBilling, form]);

  // Auto-Fill UI when Customer is selected
  useEffect(() => {
    if (watchCustomer) {
      const cust = availableCustomers.find(c => c.id === watchCustomer);
      setSelectedCustomerDetails(cust || null);
    } else {
      setSelectedCustomerDetails(null);
    }
  }, [watchCustomer, availableCustomers]);

  const onSubmit = async (data: ServiceFormValues) => {
    if (!user?.email || !selectedCustomerDetails) return;
    setLoading(true);
    try {
      const comp = companies.find(c => c.id === data.companyId);
      const bill = billingTypes.find(b => b.id === data.billingTypeId);
      const treat = treatments.find(t => t.id === data.treatmentTypeId);
      const emp = employees.find(e => e.id === data.employeeId);
      const pStat = paymentStatus.find(p => p.id === data.paymentStatusId);
      const pMode = paymentModes.find(p => p.id === data.paymentModeId);

      const metadata = {
        companyName: comp?.name, companyPrefix: comp?.invoicePrefix || "", billingTypeName: bill?.name,
        customerName: selectedCustomerDetails.name, customerMobile: selectedCustomerDetails.mobile,
        customerAddress: selectedCustomerDetails.address, cityName: selectedCustomerDetails.cityName, locationTypeName: selectedCustomerDetails.locationTypeName,
        treatmentTypeName: treat?.name, employeeName: emp?.name, paymentStatusName: pStat?.name, paymentModeName: pMode?.name
      };

      await addService(data, metadata, user.email);
      toast.success("Service recorded successfully!");
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error("Failed to record service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[75vh] overflow-y-auto overflow-x-hidden pr-4 pb-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Section 1: Core Filters */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="companyId" render={({ field }) => (
              <FormItem><FormLabel className="text-lg font-bold text-blue-900">1. Company</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-14 text-lg bg-white"><SelectValue placeholder="Required" /></SelectTrigger></FormControl>
                  <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id} className="text-lg py-3">{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )}/>
            <FormField control={form.control} name="billingTypeId" render={({ field }) => (
              <FormItem><FormLabel className="text-lg font-bold text-blue-900">2. Billing Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-14 text-lg bg-white"><SelectValue placeholder="Required" /></SelectTrigger></FormControl>
                  <SelectContent>{billingTypes.map(b => <SelectItem key={b.id} value={b.id} className="text-lg py-3">{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )}/>
          </div>

          {/* Section 2: Customer & Auto-Fill */}
          <div className="space-y-4">
            <FormField control={form.control} name="customerId" render={({ field }) => (
              <FormItem><FormLabel className="text-xl text-slate-800 font-bold">Select Customer</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!watchCompany || !watchBilling}>
                  <FormControl><SelectTrigger className="h-14 text-xl border-2 border-slate-300"><SelectValue placeholder={watchCompany ? "Search/Select Customer..." : "Select Company & Billing First"} /></SelectTrigger></FormControl>
                  <SelectContent>{availableCustomers.map(c => <SelectItem key={c.id} value={c.id} className="text-lg py-3">{c.name} ({c.customerId})</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}/>

            {selectedCustomerDetails && (
              <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                <div><p className="text-sm text-slate-500 font-semibold uppercase">Auto-filled Details</p>
                <p className="text-lg font-medium text-slate-800">{selectedCustomerDetails.mobile}</p></div>
                <div><p className="text-sm text-slate-500 font-semibold uppercase">Location</p>
                <p className="text-lg font-medium text-slate-800">{selectedCustomerDetails.cityName} - {selectedCustomerDetails.locationTypeName}</p></div>
                <div className="col-span-1 md:col-span-2"><p className="text-sm text-slate-500 font-semibold uppercase">Address</p>
                <p className="text-lg font-medium text-slate-800">{selectedCustomerDetails.address}</p></div>
              </div>
            )}
          </div>

          {/* Section 3: Service Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800">Service Date</FormLabel>
                <FormControl><Input type="date" className="h-14 text-lg" {...field} /></FormControl><FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="treatmentTypeId" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800">Treatment Done</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-14 text-lg"><SelectValue placeholder="Select Treatment" /></SelectTrigger></FormControl>
                  <SelectContent>{treatments.map(t => <SelectItem key={t.id} value={t.id} className="text-lg py-3">{t.name}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="employeeId" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800">Assigned Technician</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-14 text-lg"><SelectValue placeholder="Select Staff" /></SelectTrigger></FormControl>
                  <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id} className="text-lg py-3">{e.name}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="area" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800">Area / Sq.Ft</FormLabel>
                <FormControl><Input className="h-14 text-lg" placeholder="e.g. 1000 sq ft or 2 BHK" {...field} /></FormControl><FormMessage />
              </FormItem>
            )}/>
          </div>

          {/* Section 4: Billing & Follow Up */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-green-50 p-6 rounded-xl border border-green-100">
            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800 font-bold">Total Price (₹)</FormLabel>
                <FormControl><Input type="number" className="h-14 text-xl font-bold text-green-700" {...field} /></FormControl><FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="paymentStatusId" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800">Payment Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-14 text-lg bg-white"><SelectValue placeholder="Pending/Done" /></SelectTrigger></FormControl>
                  <SelectContent>{paymentStatus.map(p => <SelectItem key={p.id} value={p.id} className="text-lg py-3">{p.name}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="paymentModeId" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800">Payment Mode</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-14 text-lg bg-white"><SelectValue placeholder="Cash/UPI" /></SelectTrigger></FormControl>
                  <SelectContent>{paymentModes.map(p => <SelectItem key={p.id} value={p.id} className="text-lg py-3">{p.name}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <FormField control={form.control} name="followUpDate" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800 text-blue-700 font-bold">Auto Follow-up Date</FormLabel>
                <FormControl><Input type="date" className="h-14 text-lg border-blue-300" {...field} /></FormControl><FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="billGiven" render={({ field }) => (
              <FormItem className="flex items-center space-x-4 bg-slate-100 p-4 h-14 rounded-xl border border-slate-200">
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-blue-600 scale-125" /></FormControl>
                <FormLabel className="text-xl font-semibold text-slate-800 cursor-pointer !mt-0">Physical Bill Handed Over?</FormLabel>
              </FormItem>
            )}/>
          </div>

          <FormField control={form.control} name="remarks" render={({ field }) => (
            <FormItem><FormLabel className="text-lg text-slate-800">Remarks / Extra Details</FormLabel>
              <FormControl><Textarea className="text-lg p-4 min-h-[100px]" placeholder="Any notes about the treatment..." {...field} /></FormControl>
            </FormItem>
          )}/>

          <Button type="submit" disabled={loading || !selectedCustomerDetails} className="w-full h-16 text-xl bg-blue-600 hover:bg-blue-700 shadow-lg mt-8">
            {loading ? "Recording Service..." : "Save Service Entry"}
          </Button>
        </form>
      </Form>
    </div>
  );
}