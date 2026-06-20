"use client";

import { useState, useEffect } from "react";
import { getAllLabourRecords } from "@/lib/services/labourService";
import { LabourRecord } from "@/types/labour";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function LabourList({ refreshTrigger }: { refreshTrigger: number }) {
  const [records, setRecords] = useState<LabourRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await getAllLabourRecords();
      setRecords(data);
      setLoading(false);
    };
    loadData();
  }, [refreshTrigger]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-100">
          <TableRow>
            <TableHead className="text-lg font-bold text-slate-700 py-4">Date</TableHead>
            <TableHead className="text-lg font-bold text-slate-700 py-4">Staff Name</TableHead>
            <TableHead className="text-lg font-bold text-slate-700 py-4">Work Detail</TableHead>
            <TableHead className="text-lg font-bold text-slate-700 py-4">Adv / Reimburse</TableHead>
            <TableHead className="text-lg font-bold text-slate-700 py-4 text-right">Net Paid</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={5} className="text-center py-12 text-xl">Loading data...</TableCell></TableRow>
          ) : records.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-12 text-xl text-slate-500">No records found.</TableCell></TableRow>
          ) : (
            records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-lg font-medium py-4 text-slate-600">{format(new Date(r.date), 'dd MMM yyyy')}</TableCell>
                <TableCell className="text-xl font-bold text-slate-800">{r.employeeName}</TableCell>
                <TableCell>
                  {r.workerType === "Hourly" ? (
                    <div className="text-amber-700 font-semibold">{r.hoursWorked} Hrs @ ₹{r.hourlyRate}/hr</div>
                  ) : (
                    <Badge variant="outline" className={`text-base py-1 px-3 ${r.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {r.status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {r.advanceGiven > 0 && <div className="text-red-600 font-semibold">Adv: -₹{r.advanceGiven}</div>}
                  {r.extraAllowance > 0 && <div className="text-purple-700 font-semibold text-sm">Extra: +₹{r.extraAllowance} ({r.allowanceReason})</div>}
                  {r.advanceGiven === 0 && r.extraAllowance === 0 && <span className="text-slate-400">-</span>}
                </TableCell>
                <TableCell className="text-right">
                  <div className={`text-xl font-extrabold ${r.netPayable < 0 ? 'text-red-600' : 'text-green-700'}`}>
                    ₹{r.netPayable}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">{r.paymentModeName}</div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}