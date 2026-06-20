"use client";

import { useState } from "react";
import { LabourForm } from "@/components/labour/LabourForm";
import { LabourList } from "@/components/labour/LabourList";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LabourPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Labour & Staff Register</h1>
          <p className="text-xl text-slate-600 mt-2">Manage daily attendance, wages, and advances.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className={cn(buttonVariants(), "h-14 px-8 text-xl bg-slate-900 hover:bg-slate-800 shadow-md flex items-center gap-3 cursor-pointer text-white")}>
            <Users className="h-6 w-6" />
            Log Attendance
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl w-[95vw] bg-white p-8">
            <DialogHeader className="pb-4 border-b border-slate-100">
              <DialogTitle className="text-3xl font-bold text-slate-800">Record Staff Attendance</DialogTitle>
            </DialogHeader>
            <LabourForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <LabourList refreshTrigger={refreshTrigger} />
    </div>
  );
}