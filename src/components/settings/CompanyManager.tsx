"use client";

import { useState, useEffect } from "react";
import { getCompanies, updateCompany } from "@/lib/services/settingsService";
import { Company } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CompanyManager() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await getCompanies();
      setCompanies(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleUpdate = async (company: Company) => {
    if (!user?.email) return;
    try {
      await updateCompany(company.id, company, company.name, user.email);
      toast.success(`${company.name} details updated successfully!`);
    } catch (error) {
      toast.error("Failed to update company");
    }
  };

  const handleChange = (index: number, field: keyof Company, value: string) => {
    const updated = [...companies];
    updated[index] = { ...updated[index], [field]: value };
    setCompanies(updated);
  };

  if (loading) return <div className="p-8 text-xl font-semibold text-blue-600">Loading Companies...</div>;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {companies.length === 0 ? (
        <div className="col-span-2 p-8 bg-amber-50 text-amber-800 rounded-xl text-lg">
          No companies found in database. Please create "Shri Sai" and "Bharamchetnya" in the Firestore `companies` collection to manage them here.
        </div>
      ) : (
        companies.map((company, index) => (
          <div key={company.id} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="text-3xl font-bold text-blue-900 border-b pb-4">{company.name}</h3>
            
            <div className="space-y-3">
              <label className="text-lg font-semibold text-slate-700">Invoice Prefix (e.g., SS or BPC)</label>
              <Input className="h-14 text-lg" value={company.invoicePrefix || ""} onChange={e => handleChange(index, 'invoicePrefix', e.target.value)} />
            </div>

            <div className="space-y-3">
              <label className="text-lg font-semibold text-slate-700">GST Number</label>
              <Input className="h-14 text-lg" value={company.gstNumber || ""} onChange={e => handleChange(index, 'gstNumber', e.target.value)} />
            </div>

            <div className="space-y-3">
              <label className="text-lg font-semibold text-slate-700">Official Address</label>
              <Textarea className="text-lg min-h-[100px] p-4" value={company.address || ""} onChange={e => handleChange(index, 'address', e.target.value)} />
            </div>

            <div className="space-y-3">
              <label className="text-lg font-semibold text-slate-700">Bank Details (For Invoices)</label>
              <Textarea className="text-lg min-h-[100px] p-4" value={company.bankDetails || ""} onChange={e => handleChange(index, 'bankDetails', e.target.value)} />
            </div>

            <Button onClick={() => handleUpdate(company)} className="w-full h-16 text-xl bg-blue-600 hover:bg-blue-700 shadow-md">
              Save {company.name} Settings
            </Button>
          </div>
        ))
      )}
    </div>
  );
}