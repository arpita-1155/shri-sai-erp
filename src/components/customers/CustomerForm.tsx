"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, CustomerFormValues } from "@/types/customer";
import { getCompanies, getMasterData } from "@/lib/services/settingsService";
import { addCustomer } from "@/lib/services/customerService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export function CustomerForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [billingTypes, setBillingTypes] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      companyId: "",
      billingTypeId: "",
      name: "",
      mobile: "",
      cityId: "",
      locationTypeId: "",
      address: "",
      gstApplicable: false,
      gstNumber: "",
    },
  });

  const isGstApplicable = form.watch("gstApplicable");

  useEffect(() => {
    const loadMasterData = async () => {
      const [comps, bills, cits, locs] = await Promise.all([
        getCompanies(),
        getMasterData("master_billing_types"),
        getMasterData("master_cities"),
        getMasterData("master_locations"),
      ]);
      setCompanies(comps.filter(c => c.isActive !== false));
      setBillingTypes(bills.filter(b => b.isActive !== false));
      setCities(cits.filter(c => c.isActive !== false));
      setLocations(locs.filter(l => l.isActive !== false));
    };
    loadMasterData();
  }, []);

  const onSubmit = async (data: CustomerFormValues) => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const comp = companies.find(c => c.id === data.companyId);
      const bill = billingTypes.find(b => b.id === data.billingTypeId);
      const city = cities.find(c => c.id === data.cityId);
      const loc = locations.find(l => l.id === data.locationTypeId);

      await addCustomer(data, {
        companyName: comp?.name || "Unknown Company",
        companyPrefix: comp?.invoicePrefix || "", // Passes the prefix (e.g., SS or BPC)
        billingTypeName: bill?.name || "Unknown Billing",
        cityName: city?.name || "Unknown City",
        locationTypeName: loc?.name || "Unknown Location",
      }, user.email);

      toast.success("Customer created successfully with Isolated Auto-ID!");
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden pr-4 pb-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg text-slate-800">Select Company</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-14 text-lg">
                        <SelectValue placeholder="Choose Company" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.map(c => <SelectItem key={c.id} value={c.id} className="text-lg py-3">{c.name || "Unnamed"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billingTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg text-slate-800">Billing Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-14 text-lg">
                        <SelectValue placeholder="GST / Non-GST / Cash" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {billingTypes.map(b => <SelectItem key={b.id} value={b.id} className="text-lg py-3">{b.name || "Unnamed"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg text-slate-800">Customer Name</FormLabel>
                  <FormControl>
                    <Input className="h-14 text-lg" placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg text-slate-800">Mobile Number</FormLabel>
                  <FormControl>
                    <Input type="tel" className="h-14 text-lg" placeholder="10-digit number" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg text-slate-800">City</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-14 text-lg">
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cities.map(c => <SelectItem key={c.id} value={c.id} className="text-lg py-3">{c.name || "Unnamed"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg text-slate-800">Location Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-14 text-lg">
                        <SelectValue placeholder="Flat / Bungalow / Office" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations.map(l => <SelectItem key={l.id} value={l.id} className="text-lg py-3">{l.name || "Unnamed"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel className="text-lg text-slate-800">Full Address</FormLabel>
                <FormControl>
                  <Textarea className="text-lg p-4 min-h-[100px]" placeholder="Building name, street, area..." {...field} />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gstApplicable"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-4 bg-slate-100 p-6 rounded-xl border border-slate-200 mt-6">
                <FormControl>
                  <Switch 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-blue-600 scale-125"
                  />
                </FormControl>
                <FormLabel className="text-xl font-semibold text-slate-800 cursor-pointer !mt-0">Has GST Number?</FormLabel>
              </FormItem>
            )}
          />

          {isGstApplicable && (
            <FormField
              control={form.control}
              name="gstNumber"
              render={({ field }) => (
                <FormItem className="animate-in fade-in slide-in-from-top-4 mt-4">
                  <FormLabel className="text-lg text-slate-800 text-blue-700 font-bold">GST Number</FormLabel>
                  <FormControl>
                    <Input className="h-14 text-lg uppercase border-blue-300" placeholder="e.g. 22AAAAA0000A1Z5" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" disabled={loading} className="w-full h-16 text-xl bg-blue-600 hover:bg-blue-700 shadow-lg mt-8">
            {loading ? "Saving..." : "Save Customer"}
          </Button>
        </form>
      </Form>
    </div>
  );
}