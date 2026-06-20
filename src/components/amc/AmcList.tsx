"use client";

import { useState, useEffect } from "react";
import { getCompanies, getMasterData } from "@/lib/services/settingsService";
import { getFilteredAmcs, toggleAmcStatus } from "@/lib/services/amcService";
import { AmcRecord } from "@/types/amc";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function AmcList({ refreshTrigger }: { refreshTrigger: number }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [billingTypes, setBillingTypes] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedBilling, setSelectedBilling] = useState<string>("");
  const [amcs, setAmcs] = useState<AmcRecord[]>([]);
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
    const loadAmcs = async () => {
      if (!selectedCompany || !selectedBilling) {
        setAmcs([]);
        return;
      }
      setLoading(true);
      const data = await getFilteredAmcs(selectedCompany, selectedBilling);
      setAmcs(data);
      setLoading(false);
    };
    loadAmcs();
  }, [selectedCompany, selectedBilling, refreshTrigger]);

  const handleToggle = async (amc: AmcRecord) => {
    if (!user?.email) return;
    try {
      await toggleAmcStatus(amc.id, amc.isActive, amc.amcId, user.email);
      toast.success("AMC status updated");
      const updated = await getFilteredAmcs(selectedCompany, selectedBilling);
      setAmcs(updated);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2"><label className="text-lg font-bold text-blue-900">1. Select Company Filter</label>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="h-14 text-lg bg-white"><SelectValue placeholder="Select a Company" /></SelectTrigger>
            <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id} className="text-lg py-3">{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><label className="text-lg font-bold text-blue-900">2. Select Billing Type Filter</label>
          <Select value={selectedBilling} onValueChange={setSelectedBilling}>
            <SelectTrigger className="h-14 text-lg bg-white"><SelectValue placeholder="Select a Category" /></SelectTrigger>
            <SelectContent>{billingTypes.map(b => <SelectItem key={b.id} value={b.id} className="text-lg py-3">{b.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-100">
            <TableRow>
              <TableHead className="text-lg font-bold text-slate-700 py-4">AMC ID</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Customer</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Validity</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Next Visit</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Progress</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!selectedCompany || !selectedBilling ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-xl text-slate-500 font-medium">Please select both filters above.</TableCell></TableRow>
            ) : loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-xl">Loading data...</TableCell></TableRow>
            ) : amcs.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-xl text-slate-500">No AMCs found.</TableCell></TableRow>
            ) : (
              amcs.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-lg font-bold text-blue-700 py-4">{a.amcId}</TableCell>
                  <TableCell className="text-xl font-semibold text-slate-800">{a.customerName}</TableCell>
                  <TableCell className="text-lg">{format(new Date(a.startDate), 'MMM yyyy')} - {format(new Date(a.endDate), 'MMM yyyy')}</TableCell>
                  <TableCell className="text-lg font-bold text-red-600">{format(new Date(a.nextVisitDate), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-lg">
                    <Badge variant="outline" className="text-base py-1 border-blue-300">{a.visitsCompleted} / {a.totalVisits} Visits</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant={a.isActive ? "destructive" : "outline"} onClick={() => handleToggle(a)} className="text-md">
                      {a.isActive ? "Disable" : "Enable"}
                    </Button>
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