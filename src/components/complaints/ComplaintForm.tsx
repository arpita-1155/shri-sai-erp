"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { complaintSchema, ComplaintFormValues } from "@/types/complaint";
import { getCompanies, getMasterData, getEmployees } from "@/lib/services/settingsService";
import { getFilteredCustomers } from "@/lib/services/customerService";
import { addComplaint } from "@/lib/services/complaintService";
import { Customer } from "@/types/customer";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export function ComplaintForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [billingTypes, setBillingTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      companyId: "", billingTypeId: "", customerId: "",
      date: today, description: "", employeeId: "", status: "Open"
    },
  });

  const watchCompany = form.watch("companyId");
  const watchBilling = form.watch("billingTypeId");
  const watchCustomer = form.watch("customerId");

  useEffect(() => {
    const loadMasterData = async () => {
      const [comps, bills, emps] = await Promise.all([
        getCompanies(), getMasterData("master_billing_types"), getEmployees()
      ]);
      setCompanies(comps.filter(c => c.isActive !== false));
      setBillingTypes(bills.filter(b => b.isActive !== false));
      setEmployees(emps.filter(e => e.isActive !== false));
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

  const onSubmit = async (data: ComplaintFormValues) => {
    if (!user?.email || !selectedCustomer) return;
    setLoading(true);
    try {
      const comp = companies.find(c => c.id === data.companyId);
      const bill = billingTypes.find(b => b.id === data.billingTypeId);
      const emp = employees.find(e => e.id === data.employeeId);

      const metadata = {
        companyName: comp?.name || "Unknown Company",
        companyPrefix: comp?.invoicePrefix || "",
        billingTypeName: bill?.name || "Unknown Billing",
        customerName: selectedCustomer.name,
        customerMobile: selectedCustomer.mobile,
        cityName: selectedCustomer.cityName,
        locationTypeName: selectedCustomer.locationTypeName,
        employeeName: emp?.name || "Unknown Technician",
      };

      await addComplaint(data, metadata, user.email);
      toast.success("Complaint registered successfully!");
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error("Failed to register complaint");
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800 font-bold">Date of Complaint</FormLabel>
                <FormControl><Input type="date" className="h-14 text-lg" {...field} /></FormControl><FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="employeeId" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800 font-bold">Assign To</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-14 text-lg"><SelectValue placeholder="Select Technician" /></SelectTrigger></FormControl>
                  <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id} className="text-lg py-3">{e.name}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}/>
          </div>

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel className="text-lg text-slate-800 font-bold">Complaint Details</FormLabel>
              <FormControl><Textarea className="text-lg p-4 min-h-[120px] border-red-200 bg-red-50" placeholder="Describe the issue faced by the customer..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>

          <Button type="submit" disabled={loading || !selectedCustomer} className="w-full h-16 text-xl bg-red-600 hover:bg-red-700 text-white shadow-lg mt-8">
            {loading ? "Registering..." : "Register Complaint"}
          </Button>
        </form>
      </Form>
    </div>
  );
}