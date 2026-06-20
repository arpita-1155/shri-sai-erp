"use client";

import { useState, useEffect } from "react";
import { getCompanies, getMasterData } from "@/lib/services/settingsService";
import { getFilteredComplaints, updateComplaintStatus } from "@/lib/services/complaintService";
import { ComplaintRecord } from "@/types/complaint";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ComplaintList({ refreshTrigger }: { refreshTrigger: number }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [billingTypes, setBillingTypes] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedBilling, setSelectedBilling] = useState<string>("");
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Resolution State
  const [resolveOpen, setResolveOpen] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState<ComplaintRecord | null>(null);
  const [resolutionText, setResolutionText] = useState("");

  useEffect(() => {
    const loadFilters = async () => {
      const comps = await getCompanies();
      const bills = await getMasterData("master_billing_types");
      setCompanies(comps.filter(c => c.isActive !== false));
      setBillingTypes(bills.filter(b => b.isActive !== false));
    };
    loadFilters();
  }, []);

  const loadComplaints = async () => {
    if (!selectedCompany || !selectedBilling) {
      setComplaints([]);
      return;
    }
    setLoading(true);
    const data = await getFilteredComplaints(selectedCompany, selectedBilling);
    setComplaints(data);
    setLoading(false);
  };

  useEffect(() => { loadComplaints(); }, [selectedCompany, selectedBilling, refreshTrigger]);

  const handleResolve = async () => {
    if (!user?.email || !activeComplaint || !resolutionText) {
      toast.warning("Please provide resolution details.");
      return;
    }
    try {
      await updateComplaintStatus(activeComplaint.id, "Resolved", resolutionText, activeComplaint.complaintId, user.email);
      toast.success("Complaint marked as Resolved!");
      setResolveOpen(false);
      setResolutionText("");
      loadComplaints();
    } catch (error) {
      toast.error("Failed to update complaint");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "bg-red-100 text-red-800 border-red-300";
      case "In Progress": return "bg-amber-100 text-amber-800 border-amber-300";
      case "Resolved": return "bg-green-100 text-green-800 border-green-300";
      case "Closed": return "bg-slate-100 text-slate-800 border-slate-300";
      default: return "bg-slate-100 text-slate-800";
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
              <TableHead className="text-lg font-bold text-slate-700 py-4">Complaint ID</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Date</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Customer</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Assigned To</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Status</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!selectedCompany || !selectedBilling ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-xl text-slate-500 font-medium">Please select both filters above.</TableCell></TableRow>
            ) : loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-xl">Loading data...</TableCell></TableRow>
            ) : complaints.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-xl text-slate-500">No complaints found.</TableCell></TableRow>
            ) : (
              complaints.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-lg font-bold text-blue-700 py-4">{c.complaintId}</TableCell>
                  <TableCell className="text-lg font-medium">{format(new Date(c.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-xl font-semibold text-slate-800">{c.customerName}</TableCell>
                  <TableCell className="text-lg">{c.employeeName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-base py-1 px-3 ${getStatusColor(c.status)}`}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {c.status === "Open" || c.status === "In Progress" ? (
                      <Button 
                        onClick={() => { setActiveComplaint(c); setResolveOpen(true); }}
                        className="text-md bg-green-600 hover:bg-green-700 text-white"
                      >
                        Resolve
                      </Button>
                    ) : (
                      <span className="text-sm text-slate-500 italic">Closed</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Resolution Dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Resolve Complaint {activeComplaint?.complaintId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="font-semibold text-red-800">Issue Reported:</p>
              <p className="text-red-900 mt-1">{activeComplaint?.description}</p>
            </div>
            <div className="space-y-2">
              <label className="text-lg font-semibold">Resolution Actions Taken</label>
              <Textarea 
                className="text-lg p-4 min-h-[120px]" 
                placeholder="Describe how the issue was fixed..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
              />
            </div>
            <Button onClick={handleResolve} className="w-full h-14 text-xl bg-green-600 hover:bg-green-700 text-white shadow-md">
              Mark as Resolved & Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}