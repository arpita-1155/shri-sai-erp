"use client";

import { useState, useEffect } from "react";
import { getCompanies, getMasterData } from "@/lib/services/settingsService";
import { getFilteredCustomers, toggleCustomerStatus } from "@/lib/services/customerService";
import { Customer } from "@/types/customer";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function CustomerList({ refreshTrigger }: { refreshTrigger: number }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [billingTypes, setBillingTypes] = useState<any[]>([]);
  
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedBilling, setSelectedBilling] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFilters = async () => {
      // Because we fixed settingsService, this will safely load everything!
      const comps = await getCompanies();
      const bills = await getMasterData("master_billing_types");
      setCompanies(comps.filter(c => c.isActive));
      setBillingTypes(bills.filter(b => b.isActive));
    };
    loadFilters();
  }, []);

  useEffect(() => {
    const loadCustomers = async () => {
      if (!selectedCompany || !selectedBilling) {
        setCustomers([]);
        return;
      }
      setLoading(true);
      const data = await getFilteredCustomers(selectedCompany, selectedBilling);
      setCustomers(data);
      setLoading(false);
    };
    loadCustomers();
  }, [selectedCompany, selectedBilling, refreshTrigger]);

  const handleToggle = async (customer: Customer) => {
    if (!user?.email) return;
    try {
      await toggleCustomerStatus(customer.id, customer.isActive, customer.name, user.email);
      toast.success("Customer status updated");
      const updated = await getFilteredCustomers(selectedCompany, selectedBilling);
      setCustomers(updated);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-lg font-bold text-blue-900">1. Select Company Filter</label>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="h-14 text-lg bg-white">
              <SelectValue placeholder="Select a Company to view customers" />
            </SelectTrigger>
            <SelectContent>
              {companies.map(c => <SelectItem key={c.id} value={c.id} className="text-lg py-3">{c.name || "Unnamed - Fix in Settings"}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-lg font-bold text-blue-900">2. Select Billing Type Filter</label>
          <Select value={selectedBilling} onValueChange={setSelectedBilling}>
            <SelectTrigger className="h-14 text-lg bg-white">
              <SelectValue placeholder="Select a Category to view customers" />
            </SelectTrigger>
            <SelectContent>
              {billingTypes.map(b => <SelectItem key={b.id} value={b.id} className="text-lg py-3">{b.name || "Unnamed - Fix in Settings"}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-100">
            <TableRow>
              <TableHead className="text-lg font-bold text-slate-700 py-4">ID</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Name</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Mobile</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Location</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Status</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!selectedCompany || !selectedBilling ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-xl text-slate-500 font-medium">Please select both Company and Billing Type above to view customers.</TableCell></TableRow>
            ) : loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-xl">Loading data...</TableCell></TableRow>
            ) : customers.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-xl text-slate-500">No customers found for this exact combination.</TableCell></TableRow>
            ) : (
              customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-lg font-bold text-blue-700 py-4">{c.customerId}</TableCell>
                  <TableCell className="text-xl font-semibold text-slate-800">{c.name}</TableCell>
                  <TableCell className="text-lg">{c.mobile}</TableCell>
                  <TableCell className="text-lg">{c.cityName} - {c.locationTypeName}</TableCell>
                  <TableCell>
                    <Badge className={c.isActive ? "bg-green-500 text-base" : "bg-red-500 text-base"}>
                      {c.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant={c.isActive ? "destructive" : "outline"} onClick={() => handleToggle(c)} className="text-md cursor-pointer">
                      {c.isActive ? "Disable" : "Enable"}
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