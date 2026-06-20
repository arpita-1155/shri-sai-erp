"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  CalendarClock, 
  AlertTriangle, 
  Package, 
  HardHat, 
  FileBarChart, 
  Settings,
  LogOut,
  DownloadCloud,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Customers", icon: Users, href: "/customers" },
  { name: "Services", icon: Briefcase, href: "/services" },
  { name: "AMC", icon: CalendarClock, href: "/amc" },
  { name: "Complaints", icon: AlertTriangle, href: "/complaints" },
  { name: "Purchases", icon: Package, href: "/purchases" },
  { name: "Labour", icon: HardHat, href: "/labour" },
  { name: "Reports", icon: FileBarChart, href: "/reports" },
  { name: "Settings", icon: Settings, href: "/settings" },
  { name: "Export Data", href: "/backup", icon: DownloadCloud }
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="flex flex-col w-72 bg-slate-900 text-slate-100 min-h-screen">
      <div className="p-6 flex items-center space-x-3 bg-slate-950">
        <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">
          SS
        </div>
        <span className="text-2xl font-bold tracking-wide">Shri Sai ERP</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center space-x-4 px-4 py-4 rounded-xl transition-colors text-lg font-medium ${
                isActive 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 bg-slate-950">
        <button 
          onClick={logout}
          className="flex items-center w-full space-x-4 px-4 py-4 rounded-xl text-red-400 hover:bg-red-950 hover:text-red-300 transition-colors text-lg font-medium"
        >
          <LogOut className="h-6 w-6" />
          <span>Secure Logout</span>
        </button>
      </div>
    </div>
  );
}