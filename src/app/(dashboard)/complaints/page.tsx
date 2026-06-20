"use client";

import { useState } from "react";
import { ComplaintForm } from "@/components/complaints/ComplaintForm";
import { ComplaintList } from "@/components/complaints/ComplaintList";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ComplaintsPage() {
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
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Complaints Register</h1>
          <p className="text-xl text-slate-600 mt-2">Log and track customer issues to resolution.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className={cn(buttonVariants(), "h-14 px-8 text-xl bg-red-600 hover:bg-red-700 shadow-md flex items-center gap-3 cursor-pointer text-white")}>
            <AlertTriangle className="h-6 w-6" />
            Log Complaint
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl w-[95vw] bg-white p-8">
            <DialogHeader className="pb-4 border-b border-slate-100">
              <DialogTitle className="text-3xl font-bold text-slate-800">Register New Complaint</DialogTitle>
            </DialogHeader>
            <ComplaintForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <ComplaintList refreshTrigger={refreshTrigger} />
    </div>
  );
}