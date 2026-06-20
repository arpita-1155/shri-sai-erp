"use client";

import { useState, useEffect } from "react";
import { getCompanies } from "@/lib/services/settingsService";
import { getDashboardStats, DashboardStats } from "@/lib/services/reportService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Wallet, Users, AlertTriangle, ShieldCheck, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ReportsPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  
  // Default to current year-month
  const currentMonth = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFilters = async () => {
      const comps = await getCompanies();
      setCompanies(comps.filter(c => c.isActive !== false));
    };
    loadFilters();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      if (!selectedCompany || !selectedMonth) return;
      setLoading(true);
      const data = await getDashboardStats(selectedCompany, selectedMonth);
      setStats(data);
      setLoading(false);
    };
    loadStats();
  }, [selectedCompany, selectedMonth]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Business Reports</h1>
        <p className="text-xl text-slate-600 mt-2">Financial and operational overview at a glance.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-lg font-bold text-slate-800">1. Select Company</label>
          <Select value={selectedCompany} onValueChange={(value) => setSelectedCompany(value || "")}>
            <SelectTrigger className="h-14 text-lg border-2 border-blue-200 bg-blue-50">
              <SelectValue placeholder="Choose a Company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map(c => <SelectItem key={c.id} value={c.id} className="text-lg py-3">{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-lg font-bold text-slate-800">2. Select Month</label>
          <Input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
            className="h-14 text-lg border-2 border-blue-200 bg-blue-50"
          />
        </div>
      </div>

      {!selectedCompany ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
          <h2 className="text-2xl font-bold text-slate-500">Please select a company above to view reports.</h2>
        </div>
      ) : loading ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
          <h2 className="text-2xl font-bold text-slate-500 animate-pulse">Calculating financials...</h2>
        </div>
      ) : stats ? (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
          
          {/* FINANCIAL ROW 1: The Big Three */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 rounded-3xl shadow-lg text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-100 text-lg font-semibold uppercase tracking-wider">Total Cash In</p>
                  <h2 className="text-5xl font-extrabold mt-2">₹{stats.totalRevenue.toLocaleString()}</h2>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl"><TrendingUp className="h-8 w-8 text-white" /></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 p-8 rounded-3xl shadow-lg text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-red-100 text-lg font-semibold uppercase tracking-wider">Total Cash Out</p>
                  <h2 className="text-5xl font-extrabold mt-2">₹{stats.totalExpenses.toLocaleString()}</h2>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl"><TrendingDown className="h-8 w-8 text-white" /></div>
              </div>
            </div>

            <div className={`p-8 rounded-3xl shadow-lg text-white ${stats.netProfit >= 0 ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gradient-to-br from-slate-700 to-slate-900'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-lg font-semibold uppercase tracking-wider">Net Monthly Profit</p>
                  <h2 className="text-5xl font-extrabold mt-2">₹{stats.netProfit.toLocaleString()}</h2>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl"><Wallet className="h-8 w-8 text-white" /></div>
              </div>
            </div>
          </div>

          {/* FINANCIAL ROW 2: Expense Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-6">
              <div className="bg-amber-100 p-4 rounded-full"><Briefcase className="h-8 w-8 text-amber-600" /></div>
              <div>
                <p className="text-slate-500 font-semibold text-lg uppercase">Material & Equip Expenses</p>
                <p className="text-3xl font-bold text-slate-800">₹{stats.materialCosts.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-6">
              <div className="bg-purple-100 p-4 rounded-full"><Users className="h-8 w-8 text-purple-600" /></div>
              <div>
                <p className="text-slate-500 font-semibold text-lg uppercase">Labour & Staff Payouts</p>
                <p className="text-3xl font-bold text-slate-800">₹{stats.labourCosts.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* OPERATIONAL ROW: Health Metrics */}
          <h2 className="text-2xl font-extrabold text-slate-900 mt-12 mb-4">Operational Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-l-blue-500 border-y border-r border-slate-200">
              <p className="text-slate-500 font-semibold text-lg uppercase">Services Completed</p>
              <div className="flex items-end gap-3 mt-2">
                <span className="text-5xl font-black text-slate-800">{stats.servicesCompleted}</span>
                <span className="text-lg text-slate-500 mb-1">this month</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-l-emerald-500 border-y border-r border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-slate-500 font-semibold text-lg uppercase">Active AMCs</p>
                <span className="text-5xl font-black text-slate-800 mt-2 block">{stats.activeAmcs}</span>
              </div>
              <ShieldCheck className="h-16 w-16 text-emerald-100" />
            </div>

            <div className={`bg-white p-6 rounded-2xl shadow-sm border-l-8 border-y border-r border-slate-200 flex justify-between items-center ${stats.openComplaints > 0 ? 'border-l-red-500' : 'border-l-slate-300'}`}>
              <div>
                <p className="text-slate-500 font-semibold text-lg uppercase">Open Complaints</p>
                <span className={`text-5xl font-black mt-2 block ${stats.openComplaints > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                  {stats.openComplaints}
                </span>
              </div>
              {stats.openComplaints > 0 && <AlertTriangle className="h-16 w-16 text-red-100" />}
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
}