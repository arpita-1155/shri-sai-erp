"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { labourSchema, LabourFormValues } from "@/types/labour";
import { getEmployees, getMasterData } from "@/lib/services/settingsService";
import { addLabourRecord } from "@/lib/services/labourService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function LabourForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);

  const today = new Date().toISOString().split('T')[0];

  const form = useForm<LabourFormValues>({
    resolver: zodResolver(labourSchema),
    defaultValues: {
      date: today, employeeId: "", workerType: "Daily", status: "Present",
      baseWage: 0, hoursWorked: 0, hourlyRate: 0, 
      advanceGiven: 0, extraAllowance: 0, allowanceReason: "",
      netPayable: 0, paymentModeId: "none", remarks: ""
    },
  });

  const watchWorkerType = form.watch("workerType");
  const watchStatus = form.watch("status");
  const watchBaseWage = form.watch("baseWage");
  const watchHours = form.watch("hoursWorked");
  const watchRate = form.watch("hourlyRate");
  const watchAdvance = form.watch("advanceGiven");
  const watchAllowance = form.watch("extraAllowance");

  // Advanced Auto-Calculate Wage Logic
  useEffect(() => {
    let earned = 0;
    
    if (watchWorkerType === "Daily") {
      const base = Number(watchBaseWage) || 0;
      if (watchStatus === "Present") earned = base;
      else if (watchStatus === "Half Day") earned = base / 2;
      else if (watchStatus === "Absent") earned = 0;
    } else {
      earned = (Number(watchHours) || 0) * (Number(watchRate) || 0);
    }

    const advance = Number(watchAdvance) || 0;
    const extra = Number(watchAllowance) || 0;

    // Net = What they earned - What they took early + Reimbursements for food/petrol
    const net = earned - advance + extra;
    form.setValue("netPayable", Number(net.toFixed(2)));
  }, [watchWorkerType, watchStatus, watchBaseWage, watchHours, watchRate, watchAdvance, watchAllowance, form]);

  useEffect(() => {
    const loadData = async () => {
      const [emps, pModes] = await Promise.all([getEmployees(), getMasterData("master_payment_modes")]);
      setEmployees(emps.filter(e => e.isActive !== false));
      setPaymentModes(pModes.filter(p => p.isActive !== false));
    };
    loadData();
  }, []);

  const onSubmit = async (data: LabourFormValues) => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const emp = employees.find(e => e.id === data.employeeId);
      const pMode = paymentModes.find(p => p.id === data.paymentModeId);

      const metadata = {
        employeeName: emp?.name || "Unknown Staff",
        paymentModeName: data.paymentModeId === "none" ? "Unpaid / Pending" : (pMode?.name || "Unknown"),
      };

      await addLabourRecord(data, metadata, user.email);
      toast.success("Attendance & Wage recorded!");
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error("Failed to record labour entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto pr-4 pb-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-6 rounded-xl border border-blue-200">
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem><FormLabel className="text-lg font-bold text-blue-900">Date</FormLabel>
                <FormControl><Input type="date" className="h-14 text-lg bg-white" {...field} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="employeeId" render={({ field }) => (
              <FormItem><FormLabel className="text-lg font-bold text-blue-900">Select Technician / Staff</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-14 text-lg bg-white"><SelectValue placeholder="Required" /></SelectTrigger></FormControl>
                  <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id} className="text-lg py-3">{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )}/>
          </div>

          <FormField control={form.control} name="workerType" render={({ field }) => (
            <FormItem className="bg-slate-100 p-4 rounded-xl border border-slate-200">
              <FormLabel className="text-lg font-bold text-slate-800 mb-2 block">Wage Type for Today</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-6">
                  <FormItem className="flex items-center space-x-3 bg-white px-6 py-3 rounded-lg border border-slate-300 w-1/2 cursor-pointer">
                    <FormControl><RadioGroupItem value="Daily" /></FormControl>
                    <FormLabel className="text-lg font-bold text-blue-700 cursor-pointer">Fixed Daily Wage</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 bg-white px-6 py-3 rounded-lg border border-slate-300 w-1/2 cursor-pointer">
                    <FormControl><RadioGroupItem value="Hourly" /></FormControl>
                    <FormLabel className="text-lg font-bold text-amber-700 cursor-pointer">Hourly Wage</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}/>

          {watchWorkerType === "Daily" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel className="text-lg font-bold text-slate-800">Attendance</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="h-14 text-lg bg-white"><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Present" className="text-lg py-3 font-semibold text-green-700">Present (Full Day)</SelectItem>
                      <SelectItem value="Half Day" className="text-lg py-3 font-semibold text-amber-600">Half Day</SelectItem>
                      <SelectItem value="Absent" className="text-lg py-3 font-semibold text-red-600">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}/>
              <FormField control={form.control} name="baseWage" render={({ field }) => (
                <FormItem><FormLabel className="text-lg text-slate-800">Fixed Daily Wage (₹)</FormLabel>
                  <FormControl><Input type="number" className="h-14 text-lg" {...field} /></FormControl>
                </FormItem>
              )}/>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-amber-50 p-6 rounded-xl border border-amber-200">
              <FormField control={form.control} name="hoursWorked" render={({ field }) => (
                <FormItem><FormLabel className="text-lg font-bold text-amber-900">Total Hours Worked</FormLabel>
                  <FormControl><Input type="number" step="0.5" className="h-14 text-lg" {...field} /></FormControl>
                </FormItem>
              )}/>
              <FormField control={form.control} name="hourlyRate" render={({ field }) => (
                <FormItem><FormLabel className="text-lg font-bold text-amber-900">Rate per Hour (₹)</FormLabel>
                  <FormControl><Input type="number" className="h-14 text-lg" {...field} /></FormControl>
                </FormItem>
              )}/>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-purple-50 p-6 rounded-xl border border-purple-200">
            <FormField control={form.control} name="advanceGiven" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800 font-bold text-red-600">Advance Given (₹)</FormLabel>
                <FormControl><Input type="number" className="h-14 text-lg border-red-300" placeholder="Subtracts from total" {...field} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="extraAllowance" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800 font-bold text-purple-700">Reimbursement (₹)</FormLabel>
                <FormControl><Input type="number" className="h-14 text-lg border-purple-300" placeholder="Petrol, Lunch, etc." {...field} /></FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="allowanceReason" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800">Reason for Reimbursement</FormLabel>
                <FormControl><Input className="h-14 text-lg" placeholder="e.g. Petrol for site visit" {...field} /></FormControl>
              </FormItem>
            )}/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-green-50 p-6 rounded-xl border border-green-200 items-end">
            <FormField control={form.control} name="netPayable" render={({ field }) => (
              <FormItem><FormLabel className="text-lg font-bold text-green-800">Final Net Payable (₹)</FormLabel>
                <FormControl>
                  <Input type="number" readOnly className={`h-14 text-2xl font-extrabold ${field.value < 0 ? 'bg-red-100 text-red-700 border-red-300' : 'bg-green-100 border-green-300 text-green-800'}`} {...field} />
                </FormControl>
              </FormItem>
            )}/>
            <FormField control={form.control} name="paymentModeId" render={({ field }) => (
              <FormItem><FormLabel className="text-lg text-slate-800">Payment Mode</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-14 text-lg bg-white"><SelectValue placeholder="Mode" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none" className="text-lg py-3 italic text-slate-500">Unpaid / Add to Month Dues</SelectItem>
                    {paymentModes.map(p => <SelectItem key={p.id} value={p.id} className="text-lg py-3">{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )}/>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-16 text-xl bg-slate-900 hover:bg-black text-white shadow-lg mt-4">
            {loading ? "Saving..." : "Record Wage & Allowances"}
          </Button>
        </form>
      </Form>
    </div>
  );
}