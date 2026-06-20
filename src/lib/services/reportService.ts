import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  labourCosts: number;
  materialCosts: number;
  netProfit: number;
  activeAmcs: number;
  openComplaints: number;
  servicesCompleted: number;
}

export const getDashboardStats = async (companyId: string, monthPrefix: string): Promise<DashboardStats> => {
  // monthPrefix format: "YYYY-MM" (e.g., "2026-06")
  
  let stats: DashboardStats = {
    totalRevenue: 0, totalExpenses: 0, labourCosts: 0, materialCosts: 0,
    netProfit: 0, activeAmcs: 0, openComplaints: 0, servicesCompleted: 0
  };

  if (!companyId) return stats;

  try {
    // 1. Fetch Services (Revenue)
    const srvQuery = query(collection(db, "services"), where("companyId", "==", companyId));
    const srvDocs = await getDocs(srvQuery);
    srvDocs.forEach(doc => {
      const data = doc.data();
      if (data.date && data.date.startsWith(monthPrefix) && data.isActive !== false) {
        stats.totalRevenue += Number(data.price) || 0;
        stats.servicesCompleted += 1;
      }
    });

    // 2. Fetch Purchases (Expenses)
    const purQuery = query(collection(db, "purchases"), where("companyId", "==", companyId));
    const purDocs = await getDocs(purQuery);
    purDocs.forEach(doc => {
      const data = doc.data();
      if (data.date && data.date.startsWith(monthPrefix) && data.isActive !== false) {
        stats.materialCosts += Number(data.totalPrice) || 0;
      }
    });

    // 3. Fetch Labour (Expenses)
    // Note: Labour doesn't have companyId directly, but we fetch all for the month
    const labQuery = query(collection(db, "labour_records"));
    const labDocs = await getDocs(labQuery);
    labDocs.forEach(doc => {
      const data = doc.data();
      if (data.date && data.date.startsWith(monthPrefix) && data.isActive !== false) {
        stats.labourCosts += Number(data.netPayable) || 0;
      }
    });

    // 4. Fetch AMCs (Operational)
    const amcQuery = query(collection(db, "amcs"), where("companyId", "==", companyId));
    const amcDocs = await getDocs(amcQuery);
    amcDocs.forEach(doc => {
      if (doc.data().isActive !== false) stats.activeAmcs += 1; // Count all active AMCs
    });

    // 5. Fetch Complaints (Operational)
    const cmpQuery = query(collection(db, "complaints"), where("companyId", "==", companyId));
    const cmpDocs = await getDocs(cmpQuery);
    cmpDocs.forEach(doc => {
      const data = doc.data();
      if (data.status === "Open" || data.status === "In Progress") {
        stats.openComplaints += 1;
      }
    });

    // Calculate Totals
    stats.totalExpenses = stats.materialCosts + stats.labourCosts;
    stats.netProfit = stats.totalRevenue - stats.totalExpenses;

    return stats;
  } catch (error) {
    console.error("Error generating reports:", error);
    return stats;
  }
};