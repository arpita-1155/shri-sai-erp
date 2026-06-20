"use client";

import { useState, useEffect } from "react";
import { getMasterData, addMasterData, toggleRecordStatus } from "@/lib/services/settingsService";
import { MasterDataItem } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { id: "master_cities", label: "Cities" },
  { id: "master_treatments", label: "Treatment Types" },
  { id: "master_locations", label: "Location Types" },
  { id: "master_payment_modes", label: "Payment Modes" },
  { id: "master_payment_status", label: "Payment Status" },
  { id: "master_billing_types", label: "Billing Types" },
  { id: "master_chemicals", label: "Chemicals & Materials" },
  { id: "master_equipment", label: "Equipment & Tools" },
];

export function MasterDataManager() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [data, setData] = useState<MasterDataItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const result = await getMasterData(selectedCategory);
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleAdd = async () => {
    if (!newItemName.trim() || !user?.email) return;
    try {
      await addMasterData(selectedCategory, newItemName.trim(), user.email);
      toast.success("Item added successfully");
      setNewItemName("");
      loadData();
    } catch (error) {
      toast.error("Failed to add item");
    }
  };

  const handleToggle = async (item: MasterDataItem) => {
    if (!user?.email) return;
    try {
      await toggleRecordStatus(selectedCategory, item.id, item.isActive, item.name, user.email);
      toast.success(`Item ${item.isActive ? 'disabled' : 'enabled'}`);
      loadData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="w-full md:w-1/3 space-y-2">
          <label className="text-lg font-semibold text-slate-800">Select List to Manage</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-14 text-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="text-lg py-3">{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-2/3 flex gap-4">
          <Input 
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Type new entry here..." 
            className="h-14 text-lg"
          />
          <Button onClick={handleAdd} className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700">
            Add New
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-100">
            <TableRow>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Name</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4">Status</TableHead>
              <TableHead className="text-lg font-bold text-slate-700 py-4 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-lg">Loading data...</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-lg text-slate-500">No items found. Add one above.</TableCell></TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-xl font-medium text-slate-800 py-4">{item.name}</TableCell>
                  <TableCell>
                    <Badge className={item.isActive ? "bg-green-500 text-base py-1" : "bg-red-500 text-base py-1"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant={item.isActive ? "destructive" : "outline"}
                      onClick={() => handleToggle(item)}
                      className="text-md"
                    >
                      {item.isActive ? "Disable" : "Enable"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}