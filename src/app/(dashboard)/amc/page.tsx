"use client";

import { useState } from "react";
import { AmcForm } from "@/components/amc/AmcForm";
import { AmcList } from "@/components/amc/AmcList";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AmcPage() {
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
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">AMC Contracts</h1>
          <p className="text-xl text-slate-600 mt-2">Manage annual maintenance and visit schedules.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className={cn(buttonVariants(), "h-14 px-8 text-xl bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-3 cursor-pointer text-white")}>
            <CalendarClock className="h-6 w-6" />
            New AMC
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl w-[95vw] bg-white p-8">
            <DialogHeader className="pb-4 border-b border-slate-100">
              <DialogTitle className="text-3xl font-bold text-slate-800">Register Annual Contract</DialogTitle>
            </DialogHeader>
            <AmcForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <AmcList refreshTrigger={refreshTrigger} />
    </div>
  );
}