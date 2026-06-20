"use client";

import { useState, useEffect } from "react";
import { getCompanies, getMasterData } from "@/lib/services/settingsService";
import { getFilteredPurchases } from "@/lib/services/purchaseService";
import { PurchaseRecord } from "@/types/purchase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function PurchaseList({ refreshTrigger }: { refreshTrigger: number }) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [billingTypes, setBillingTypes] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedBilling, setSelectedBilling] = useState<string>("");
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
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
    const loadPurchases = async () => {
      if (!selectedCompany || !selectedBilling) {
        setPurchases([]);
        return;
      }
      setLoading(true);
      const data = await getFilteredPurchases(selectedCompany, selectedBilling);
      setPurchases(data);
      setLoading(false);
    };
    loadPurchases();
  }, [selectedCompany, selectedBilling, refreshTrigger]);

  const getCategoryBadge = (category: string) => {
    if (category === "Chemicals") return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Chem</Badge>;
    if (category === "Equipment") return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Equip</Badge>;
    return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Expense</Badge>;
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
              <TableHead className="text-lg font-bold text-slate-700 py-4">ID & Date</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Item & Payee</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Qty</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4 text-right">Total Bill</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4 text-right">Paid</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4 text-right">Dues</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!selectedCompany || !selectedBilling ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-xl text-slate-500 font-medium">Please select both filters above.</TableCell></TableRow>
            ) : loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-xl">Loading data...</TableCell></TableRow>
            ) : purchases.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-xl text-slate-500">No transactions found.</TableCell></TableRow>
            ) : (
              purchases.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="py-4">
                    <div className="font-bold text-slate-800 text-lg">{p.purchaseId}</div>
                    <div className="text-sm text-slate-500">{format(new Date(p.date), 'dd MMM yyyy')}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                      {getCategoryBadge(p.purchaseCategory)}
                      {p.materialName}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">{p.vendorName} {p.invoiceNumber && `(Inv: ${p.invoiceNumber})`}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-base py-1 border-slate-300 bg-slate-50">
                      {p.quantity} {p.unit.split(' ')[0]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xl font-bold text-slate-700">₹{p.totalPrice}</TableCell>
                  <TableCell className="text-right">
                    <div className="text-lg font-bold text-green-600">₹{p.amountPaid || 0}</div>
                    <div className="text-xs text-slate-500">{p.paymentModeName}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    {p.dues > 0 ? (
                      <span className="text-xl font-extrabold text-red-600">₹{p.dues}</span>
                    ) : (
                      <span className="text-lg font-medium text-slate-400">Clear</span>
                    )}
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