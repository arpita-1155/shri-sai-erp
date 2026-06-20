"use client";

import { useState, useEffect } from "react";
import { getCompanies, getMasterData } from "@/lib/services/settingsService";
import { getFilteredServices } from "@/lib/services/serviceRegister";
import { ServiceRecord } from "@/types/service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function ServiceList({ refreshTrigger }: { refreshTrigger: number }) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [billingTypes, setBillingTypes] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedBilling, setSelectedBilling] = useState<string>("");
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFilters = async () => {
      const comps = await getCompanies();
      const bills = await getMasterData("master_billing_types");
      setCompanies(comps.filter(c => c.isActive !== false));
      setBillingTypes(bills.filter(b => b.isActive !== false));
    };
    loadFilters();
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      if (!selectedCompany || !selectedBilling) {
        setServices([]);
        return;
      }
      setLoading(true);
      const data = await getFilteredServices(selectedCompany, selectedBilling);
      setServices(data);
      setLoading(false);
    };
    loadServices();
  }, [selectedCompany, selectedBilling, refreshTrigger]);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2"><label className="text-lg font-bold text-blue-900">1. Select Company Filter</label>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="h-14 text-lg bg-white"><SelectValue placeholder="Select a Company to view services" /></SelectTrigger>
            <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id} className="text-lg py-3">{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><label className="text-lg font-bold text-blue-900">2. Select Billing Type Filter</label>
          <Select value={selectedBilling} onValueChange={setSelectedBilling}>
            <SelectTrigger className="h-14 text-lg bg-white"><SelectValue placeholder="Select a Category to view services" /></SelectTrigger>
            <SelectContent>{billingTypes.map(b => <SelectItem key={b.id} value={b.id} className="text-lg py-3">{b.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-100">
            <TableRow>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Service ID</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Date</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Customer</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Treatment</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Price</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!selectedCompany || !selectedBilling ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-xl text-slate-500 font-medium">Please select both filters above.</TableCell></TableRow>
            ) : loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-xl">Loading data...</TableCell></TableRow>
            ) : services.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-xl text-slate-500">No services found.</TableCell></TableRow>
            ) : (
              services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-lg font-bold text-blue-700 py-4">{s.serviceId}</TableCell>
                  <TableCell className="text-lg font-medium">{format(new Date(s.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-xl font-semibold text-slate-800">{s.customerName}</TableCell>
                  <TableCell className="text-lg">{s.treatmentTypeName}</TableCell>
                  <TableCell className="text-xl font-bold text-green-700">₹{s.price}</TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-blue-100 text-blue-800 border border-blue-300 text-base py-1 px-3">
                      {s.paymentStatusName}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}