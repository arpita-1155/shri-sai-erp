"use client";

import { useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { DownloadCloud, HardDriveDownload } from "lucide-react";
import { toast } from "sonner";

export default function BackupPage() {
  const [loading, setLoading] = useState(false);

  const generateExcel = async () => {
    setLoading(true);
    try {
      // 1. Fetch Data
      const servicesSnap = await getDocs(query(collection(db, "services"), orderBy("date", "asc")));
      const purchasesSnap = await getDocs(query(collection(db, "purchases"), orderBy("date", "asc")));

      const services = servicesSnap.docs.map(doc => doc.data());
      const purchases = purchasesSnap.docs.map(doc => doc.data());

      // 2. Create Workbook
      const wb = XLSX.utils.book_new();

      // 3. Helper function to group and sum data
      const processFinancials = (data: any[], type: "Service" | "Purchase") => {
        const grouped: any = {};
        
        data.forEach(item => {
          const key = `${item.companyPrefix || item.companyName} - ${item.billingTypeName}`;
          if (!grouped[key]) grouped[key] = [];
          
          if (type === "Service") {
            grouped[key].push({
              Date: item.date,
              ID: item.serviceId,
              Customer: item.customerName,
              Treatment: item.treatmentTypeName,
              Revenue: Number(item.price) || 0,
              Status: item.paymentStatusName
            });
          } else {
            grouped[key].push({
              Date: item.date,
              ID: item.purchaseId,
              Category: item.purchaseCategory,
              Item: item.materialName,
              Vendor: item.vendorName,
              Expense: Number(item.totalPrice) || 0,
              Dues: Number(item.dues) || 0
            });
          }
        });

        return grouped;
      };

      const groupedServices = processFinancials(services, "Service");
      const groupedPurchases = processFinancials(purchases, "Purchase");

      // 4. Create Sheets for Revenue (Services)
      Object.keys(groupedServices).forEach(groupName => {
        const sheetData = groupedServices[groupName];
        
        // Add Total Row
        const totalRevenue = sheetData.reduce((sum: number, row: any) => sum + row.Revenue, 0);
        sheetData.push({ Date: "TOTAL", Revenue: totalRevenue });

        const ws = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, `REV_${groupName.substring(0, 25)}`);
      });

      // 5. Create Sheets for Expenses (Purchases)
      Object.keys(groupedPurchases).forEach(groupName => {
        const sheetData = groupedPurchases[groupName];
        
        // Add Total Row
        const totalExpense = sheetData.reduce((sum: number, row: any) => sum + row.Expense, 0);
        sheetData.push({ Date: "TOTAL", Expense: totalExpense });

        const ws = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, `EXP_${groupName.substring(0, 25)}`);
      });

      // 6. Trigger Download
      const fileName = `ERP_Backup_Financials_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success("Excel Backup Downloaded Successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate backup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Data Backup & Export</h1>
        <p className="text-xl text-slate-600 mt-2">Generate isolated Excel reports and secure your data.</p>
      </div>

      <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center space-y-6">
        <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <HardDriveDownload className="h-12 w-12 text-blue-600" />
        </div>
        
        <h2 className="text-3xl font-bold text-slate-800">Financial Excel Export</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Click below to instantly generate a master Excel file. It will automatically create separate tabs at the bottom of the spreadsheet for <strong>Shri Sai (GST/Non-GST/Cash)</strong> and <strong>Bharamchetnya (GST/Non-GST/Cash)</strong> with calculated totals.
        </p>

        <div className="pt-8">
          <Button 
            onClick={generateExcel} 
            disabled={loading}
            className="h-16 px-10 text-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center gap-3 mx-auto"
          >
            <DownloadCloud className="h-6 w-6" />
            {loading ? "Generating Excel File..." : "Download Full Excel Report"}
          </Button>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl mt-8 text-left">
          <h3 className="font-bold text-amber-800 text-lg">💡 How to automate Cloud Backups for Free:</h3>
          <ol className="list-decimal list-inside text-amber-900 mt-2 space-y-2">
            <li>Download the <strong>Google Drive for Desktop</strong> app on your PC.</li>
            <li>Create a folder on your computer called "ERP Backups".</li>
            <li>Set that folder to sync with Google Drive.</li>
            <li>Whenever you download this Excel file, simply save it into that folder. It will instantly and securely back up to the cloud!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}