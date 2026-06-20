"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { purchaseSchema, PurchaseFormValues } from "@/types/purchase";
import { getCompanies, getMasterData } from "@/lib/services/settingsService";
import { addPurchase } from "@/lib/services/purchaseService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const UNITS = ["Liters (L)", "Milliliters (ml)", "Kilograms (Kg)", "Grams (g)", "Pieces / Units", "Lump Sum / Fixed"];

export function PurchaseForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [billingTypes, setBillingTypes] = useState<any[]>([]);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [chemicals, setChemicals] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);

  const today = new Date().toISOString().split('T')[0];

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      companyId: "", billingTypeId: "", purchaseCategory: "Chemicals", 
      date: today, vendorName: "", invoiceNumber: "",
      materialName: "", quantity: 1, unit: "Liters (L)", pricePerUnit: 0, 
      totalPrice: 0, amountPaid: 0, dues: 0,
      paymentModeId: "", remarks: ""
    },
  });

  const watchCategory = form.watch("purchaseCategory");
  const watchQty = form.watch("quantity");
  const watchPrice = form.watch("pricePerUnit");
  const watchPaid = form.watch("amountPaid");

  // Smart defaults when switching to General Expense
  useEffect(() => { 
    form.setValue("materialName", ""); 
    if (watchCategory === "General Expense") {
      form.setValue("quantity", 1);
      form.setValue("unit", "Lump Sum / Fixed");
    }
  }, [watchCategory, form]);

  useEffect(() => {
    const total = (Number(watchQty) || 0) * (Number(watchPrice) || 0);
    const paid = Number(watchPaid) || 0;
    const dues = total - paid;
    form.setValue("totalPrice", Number(total.toFixed(2)));
    form.setValue("dues", Number(dues.toFixed(2)));
  }, [watchQty, watchPrice, watchPaid, form]);

  useEffect(() => {
    const loadMasterData = async () => {
      const [comps, bills, pModes, chems, equips] = await Promise.all([
        getCompanies(), getMasterData("master_billing_types"), getMasterData("master_payment_modes"),
        getMasterData("master_chemicals"), getMasterData("master_equipment")
      ]);
      setCompanies(comps.filter(c => c.isActive !== false));
      setBillingTypes(bills.filter(b => b.isActive !== false));
      setPaymentModes(pModes.filter(p => p.isActive !== false));
      setChemicals(chems.filter(c => c.isActive !== false));
      setEquipment(equips.filter(e => e.isActive !== false));
    };
    loadMasterData();
  }, []);

  const onSubmit = async (data: PurchaseFormValues) => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const comp = companies.find(c => c.id === data.companyId);
      const bill = billingTypes.find(b => b.id === data.billingTypeId);
      const pMode = paymentModes.find(p => p.id === data.paymentModeId);

      let finalMaterialName = data.materialName;
      if (data.purchaseCategory === "Chemicals") {
        const selectedChem = chemicals.find(c => c.id === data.materialName);
        if (selectedChem) finalMaterialName = selectedChem.name;
      } else if (data.purchaseCategory === "Equipment") {
        const selectedEquip = equipment.find(e => e.id === data.materialName);
        if (selectedEquip) finalMaterialName = selectedEquip.name;
      }

      const metadata = {
        companyName: comp?.name || "Unknown", companyPrefix: comp?.invoicePrefix || "",
        billingTypeName: bill?.name || "Unknown", paymentModeName: pMode?.name || "Unknown",
      };

      await addPurchase({ ...data, materialName: finalMaterialName }, metadata, user.email);
      toast.success(`${data.purchaseCategory} recorded successfully!`);
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error("Failed to record expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto overflow-x-hidden pr-4 pb-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <FormField control={form.control} name="purchaseCategory" render={({ field }) => (
            <FormItem className="bg-slate-100 p-4 rounded-xl border border-slate-200">
              <FormLabel className="text-xl font-bold text-slate-800 mb-2 block">Select Transaction Type</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col md:flex-row gap-4">
                  <FormItem className="flex items-center space-x-3 bg-white px-4 py-3 rounded-lg border border-slate-300 flex-1 cursor-pointer hover:border-blue-500">
                    <FormControl><RadioGroupItem value="Chemicals" /></FormControl>
                    <FormLabel className="text-lg font-bold text-blue-700 cursor-pointer">Chemicals</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 bg-white px-4 py-3 rounded-lg border border-slate-300 flex-1 cursor-pointer hover:border-amber-500">
                    <FormControl><RadioGroupItem value="Equipment" /></FormControl>
                    <FormLabel className="text-lg font-bold text-amber-700 cursor-pointer">Equipment</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 bg-white px-4 py-3 rounded-lg border border-slate-300 flex-1 cursor-pointer hover:border-purple-500">
                    <FormControl><RadioGroupItem value="General Expense" /></FormControl>
                    <FormLabel className="text-lg font-bold text-purple-700 cursor-pointer">General Expense</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}/>

          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="companyId" render={({ field }) => (
              <FormItem><FormLabel className="text-lg font-bold text-blue-900">1. Company Account</FormLabel>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800 font-bold">Date</FormLabel>
                <FormControl><Input type="date" className="h-14 text-lg" {...field} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="vendorName" render={({ field }) => (
              <FormItem className="md:col-span-2"><FormLabel className="text-lg text-slate-800 font-bold">Vendor / Payee Name</FormLabel>
                <FormControl><Input className="h-14 text-lg" placeholder="e.g. MSEB, Stationer, Staff..." {...field} /></FormControl>
              </FormItem>
            )}/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {watchCategory === "Chemicals" && (
              <FormField control={form.control} name="materialName" render={({ field }) => (
                <FormItem><FormLabel className="text-lg font-bold text-blue-700">Select Chemical</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="h-14 text-lg border-blue-300"><SelectValue placeholder="Choose" /></SelectTrigger></FormControl>
                    <SelectContent>{chemicals.map(c => <SelectItem key={c.id} value={c.id} className="text-lg py-3">{c.name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
            )}
            {watchCategory === "Equipment" && (
              <FormField control={form.control} name="materialName" render={({ field }) => (
                <FormItem><FormLabel className="text-lg font-bold text-amber-700">Select Equipment</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="h-14 text-lg border-amber-300"><SelectValue placeholder="Choose" /></SelectTrigger></FormControl>
                    <SelectContent>{equipment.map(e => <SelectItem key={e.id} value={e.id} className="text-lg py-3">{e.name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
            )}
            {watchCategory === "General Expense" && (
              <FormField control={form.control} name="materialName" render={({ field }) => (
                <FormItem><FormLabel className="text-lg font-bold text-purple-700">Expense Details</FormLabel>
                  <FormControl><Input className="h-14 text-lg border-purple-300" placeholder="e.g. Office Rent, Electricity Bill..." {...field} /></FormControl><FormMessage />
                </FormItem>
              )}/>
            )}
            
            <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800">Invoice / Bill Number (If Any)</FormLabel>
                <FormControl><Input className="h-14 text-lg" placeholder="e.g. INV-2026-001" {...field} /></FormControl>
              </FormItem>
            )}/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <FormField control={form.control} name="quantity" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800">Quantity</FormLabel>
                <FormControl><Input type="number" step="0.1" className="h-14 text-lg" {...field} disabled={watchCategory === "General Expense"} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="unit" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800">Unit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={watchCategory === "General Expense"}>
                  <FormControl><SelectTrigger className="h-14 text-lg bg-white"><SelectValue placeholder="Select Unit" /></SelectTrigger></FormControl>
                  <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u} className="text-lg py-3">{u}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )}/>
            <FormField control={form.control} name="pricePerUnit" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800">{watchCategory === "General Expense" ? "Total Bill Amount (₹)" : "Price per Unit (₹)"}</FormLabel>
                <FormControl><Input type="number" className="h-14 text-lg" {...field} /></FormControl>
              </FormItem>
            )}/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-green-50 p-6 rounded-xl border border-green-200 items-end">
            <FormField control={form.control} name="totalPrice" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800 font-bold">Total Bill (₹)</FormLabel>
                <FormControl><Input type="number" readOnly className="h-14 text-xl font-bold bg-slate-200 border-slate-300 text-slate-600" {...field} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="amountPaid" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800 font-bold text-green-700">Amount Paid (₹)</FormLabel>
                <FormControl><Input type="number" className="h-14 text-xl font-bold border-green-400 text-green-800" {...field} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="dues" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800 font-bold text-red-600">Dues / Pending (₹)</FormLabel>
                <FormControl><Input type="number" readOnly className={`h-14 text-xl font-bold ${field.value > 0 ? 'bg-red-100 border-red-300 text-red-700' : 'bg-slate-100 border-slate-200'}`} {...field} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="paymentModeId" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800">Paid Via</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-14 text-lg bg-white"><SelectValue placeholder="Mode" /></SelectTrigger></FormControl>
                  <SelectContent>{paymentModes.map(p => <SelectItem key={p.id} value={p.id} className="text-lg py-3">{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )}/>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-16 text-xl bg-slate-900 hover:bg-black text-white shadow-lg mt-8">
            {loading ? "Saving..." : "Record Transaction"}
          </Button>
        </form>
      </Form>
    </div>
  );
}