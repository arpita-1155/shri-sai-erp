"use client";

import { useState, useEffect } from "react";
import { getEmployees, addEmployee, toggleRecordStatus } from "@/lib/services/settingsService";
import { Employee } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function EmployeeManager() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", mobile: "", role: "Staff" as "Admin" | "Staff" });

  const loadData = async () => {
    const data = await getEmployees();
    setEmployees(data);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.mobile || !user?.email) {
      toast.warning("Please fill all fields");
      return;
    }
    try {
      await addEmployee(formData, user.email);
      toast.success("Employee added");
      setIsOpen(false);
      setFormData({ name: "", mobile: "", role: "Staff" });
      loadData();
    } catch (error) {
      toast.error("Failed to add employee");
    }
  };

  const handleToggle = async (emp: Employee) => {
    if (!user?.email) return;
    await toggleRecordStatus("employees", emp.id, emp.isActive, emp.name, user.email);
    toast.success("Status updated");
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-2xl font-bold text-slate-800">Team Members</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          {/* FIXED: Removed asChild and applied buttonVariants directly */}
          <DialogTrigger className={cn(buttonVariants(), "h-12 px-6 text-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer")}>
            Add Employee
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">New Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-lg font-semibold">Full Name</label>
                <Input className="h-12 text-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-lg font-semibold">Mobile Number</label>
                <Input type="tel" className="h-12 text-lg" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-lg font-semibold">System Role</label>
                <Select value={formData.role} onValueChange={(val: "Admin" | "Staff") => setFormData({...formData, role: val})}>
                  <SelectTrigger className="h-12 text-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Staff" className="text-lg py-2">Staff (Limited Access)</SelectItem>
                    <SelectItem value="Admin" className="text-lg py-2">Admin (Full Access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full h-14 text-xl bg-blue-600">Save Employee</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-100">
            <TableRow>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Name</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Mobile</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Role</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Status</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="text-xl font-medium py-4">{emp.name}</TableCell>
                <TableCell className="text-lg">{emp.mobile}</TableCell>
                <TableCell className="text-lg">{emp.role}</TableCell>
                <TableCell>
                  <Badge className={emp.isActive ? "bg-green-500 text-base" : "bg-red-500 text-base"}>
                    {emp.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant={emp.isActive ? "destructive" : "outline"} onClick={() => handleToggle(emp)}>
                    {emp.isActive ? "Disable" : "Enable"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}