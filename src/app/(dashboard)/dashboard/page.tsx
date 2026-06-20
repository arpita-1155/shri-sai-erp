"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, Briefcase, AlertTriangle, ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function HomeDashboard() {
  const { user } = useAuth();

  // Quick Action Buttons Data
  const quickActions = [
    { title: "Add Customer", icon: Users, href: "/customers", color: "bg-blue-100 text-blue-700", border: "border-blue-200" },
    { title: "Log Service", icon: Briefcase, href: "/services", color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
    { title: "Record Expense", icon: ShoppingCart, href: "/purchases", color: "bg-amber-100 text-amber-700", border: "border-amber-200" },
    { title: "Log Complaint", icon: AlertTriangle, href: "/complaints", color: "bg-red-100 text-red-700", border: "border-red-200" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12 animate-in fade-in zoom-in duration-500">
      
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.email?.split('@')[0] || "Admin"}! 👋
          </h1>
          <p className="text-xl text-slate-300 mt-2">
            Shri Sai & Bharamchetnya ERP System is running smoothly.
          </p>
        </div>
        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 text-center">
          <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Today's Date</p>
          <p className="text-2xl font-bold text-white mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <Card className={`hover:shadow-lg transition-all cursor-pointer border-2 hover:scale-105 duration-200 ${action.border}`}>
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                    <div className={`p-4 rounded-full ${action.color}`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">{action.title}</h3>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Analytics Call to Action */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-blue-900">Ready to see the numbers?</h2>
          <p className="text-lg text-blue-700 mt-2">
            Head over to the Reports module to view your complete Profit & Loss, expenses, and operational health.
          </p>
        </div>
        <Link href="/reports">
          <button className="h-16 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold shadow-lg flex items-center gap-3 transition-all hover:scale-105">
            View Analytics <ArrowRight className="h-6 w-6" />
          </button>
        </Link>
      </div>

    </div>
  );
}