"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { amcSchema, AmcFormValues } from "@/types/amc";
import { getCompanies, getMasterData } from "@/lib/services/settingsService";
import { getFilteredCustomers } from "@/lib/services/customerService";
import { addAmc } from "@/lib/services/amcService";
import { Customer } from "@/types/customer";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const FREQUENCIES = [
  { id: "Monthly", name: "Monthly (12 Visits)", days: 30, visits: 12 },
  { id: "Bi-Monthly", name: "Bi-Monthly (6 Visits)", days: 60, visits: 6 },
  { id: "Quarterly", name: "Quarterly (4 Visits)", days: 90, visits: 4 },
  { id: "Tri-Annual", name: "Tri-Annual (3 Visits)", days: 120, visits: 3 },
  { id: "Bi-Annual", name: "Bi-Annual (2 Visits)", days: 180, visits: 2 },
  { id: "Yearly", name: "Yearly (1 Visit)", days: 365, visits: 1 },
];

export function AmcForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [billingTypes, setBillingTypes] = useState<any[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const form = useForm<AmcFormValues>({
    resolver: zodResolver(amcSchema),
    defaultValues: {
      companyId: "", billingTypeId: "", customerId: "",
      startDate: today, endDate: "", frequency: "Quarterly", nextVisitDate: "", totalVisits: 4
    },
  });

  const watchCompany = form.watch("companyId");
  const watchBilling = form.watch("billingTypeId");
  const watchCustomer = form.watch("customerId");
  const watchStartDate = form.watch("startDate");
  const watchFrequency = form.watch("frequency");

  useEffect(() => {
    const loadMasterData = async () => {
      const [comps, bills] = await Promise.all([getCompanies(), getMasterData("master_billing_types")]);
      setCompanies(comps.filter(c => c.isActive !== false));
      setBillingTypes(bills.filter(b => b.isActive !== false));
    };
    loadMasterData();
  }, []);

  useEffect(() => {
    const loadCustomers = async () => {
      if (watchCompany && watchBilling) {
        const custs = await getFilteredCustomers(watchCompany, watchBilling);
        setAvailableCustomers(custs.filter(c => c.isActive !== false));
      } else {
        setAvailableCustomers([]);
      }
      form.setValue("customerId", "");
      setSelectedCustomer(null);
    };
    loadCustomers();
  }, [watchCompany, watchBilling, form]);

  useEffect(() => {
    if (watchCustomer) {
      setSelectedCustomer(availableCustomers.find(c => c.id === watchCustomer) || null);
    } else {
      setSelectedCustomer(null);
    }
  }, [watchCustomer, availableCustomers]);

  // SMART AUTO-MATH: Calculate End Date and Next Visit Date
  useEffect(() => {
    if (watchStartDate && watchFrequency) {
      const start = new Date(watchStartDate);
      const freqObj = FREQUENCIES.find(f => f.id === watchFrequency);
      
      if (freqObj && !isNaN(start.getTime())) {
        // End date is 1 year from start
        const end = new Date(start);
        end.setFullYear(end.getFullYear() + 1);
        form.setValue("endDate", end.toISOString().split('T')[0]);

        // Next visit is based on frequency (e.g., 90 days)
        const next = new Date(start);
        next.setDate(next.getDate() + freqObj.days);
        form.setValue("nextVisitDate", next.toISOString().split('T')[0]);
        form.setValue("totalVisits", freqObj.visits);
      }
    }
  }, [watchStartDate, watchFrequency, form]);

  const onSubmit = async (data: AmcFormValues) => {
    if (!user?.email || !selectedCustomer) return;
    setLoading(true);
    try {
      const comp = companies.find(c => c.id === data.companyId);
      const bill = billingTypes.find(b => b.id === data.billingTypeId);

      const metadata = {
        companyName: comp?.name || "Unknown Company",
        companyPrefix: comp?.invoicePrefix || "",
        billingTypeName: bill?.name || "Unknown Billing",
        customerName: selectedCustomer.name,
        customerMobile: selectedCustomer.mobile,
        cityName: selectedCustomer.cityName,
        locationTypeName: selectedCustomer.locationTypeName,
      };

      await addAmc(data, metadata, user.email);
      toast.success("AMC created successfully!");
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error("Failed to create AMC");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[75vh] overflow-y-auto overflow-x-hidden pr-4 pb-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="companyId" render={({ field }) => (
              <FormItem><FormLabel className="text-lg font-bold text-blue-900">1. Company</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-14 text-lg bg-white"><SelectValue placeholder="Required" /></SelectTrigger></FormControl>
                  <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id} className="text-lg py-3">{c.name || "Unnamed"}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )}/>
            <FormField control={form.control} name="billingTypeId" render={({ field }) => (
              <FormItem><FormLabel className="text-lg font-bold text-blue-900">2. Billing Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-14 text-lg bg-white"><SelectValue placeholder="Required" /></SelectTrigger></FormControl>
                  <SelectContent>{billingTypes.map(b => <SelectItem key={b.id} value={b.id} className="text-lg py-3">{b.name || "Unnamed"}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )}/>
          </div>

          <FormField control={form.control} name="customerId" render={({ field }) => (
            <FormItem><FormLabel className="text-xl text-slate-800 font-bold">Select Customer</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!watchCompany || !watchBilling}>
                <FormControl><SelectTrigger className="h-14 text-xl border-2 border-slate-300"><SelectValue placeholder={watchCompany ? "Search/Select Customer..." : "Select Company & Billing First"} /></SelectTrigger></FormControl>
                <SelectContent>{availableCustomers.map(c => <SelectItem key={c.id} value={c.id} className="text-lg py-3">{c.name} ({c.customerId})</SelectItem>)}</SelectContent>
              </Select><FormMessage />
            </FormItem>
          )}/>

          {selectedCustomer && (
            <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 flex justify-between animate-in fade-in">
              <span className="text-lg font-medium text-slate-700">Mobile: {selectedCustomer.mobile}</span>
              <span className="text-lg font-medium text-slate-700">Location: {selectedCustomer.cityName}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-green-50 p-6 rounded-xl border border-green-100">
            <FormField control={form.control} name="startDate" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800 font-bold">Contract Start Date</FormLabel>
                <FormControl><Input type="date" className="h-14 text-lg border-green-300" {...field} /></FormControl><FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="frequency" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800 font-bold">Visit Frequency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-14 text-lg border-green-300"><SelectValue placeholder="Quarterly (4 Visits)" /></SelectTrigger></FormControl>
                  <SelectContent>{FREQUENCIES.map(f => <SelectItem key={f.id} value={f.id} className="text-lg py-3">{f.name}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="endDate" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800 text-slate-500">Auto End Date (1 Year)</FormLabel>
                <FormControl><Input type="date" className="h-14 text-lg bg-slate-100" readOnly {...field} /></FormControl><FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="nextVisitDate" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800 text-blue-700 font-bold">First Auto Follow-up Date</FormLabel>
                <FormControl><Input type="date" className="h-14 text-lg border-blue-300" {...field} /></FormControl><FormMessage />
              </FormItem>
            )}/>
          </div>

          <Button type="submit" disabled={loading || !selectedCustomer} className="w-full h-16 text-xl bg-blue-600 hover:bg-blue-700 shadow-lg mt-8">
            {loading ? "Registering AMC..." : "Register AMC"}
          </Button>
        </form>
      </Form>
    </div>
  );
}