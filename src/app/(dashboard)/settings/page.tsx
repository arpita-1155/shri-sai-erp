"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MasterDataManager } from "@/components/settings/MasterDataManager";
import { EmployeeManager } from "@/components/settings/EmployeeManager";
import { CompanyManager } from "@/components/settings/CompanyManager";

export default function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-xl text-slate-600 mt-2">Manage your master data, employees, and company details.</p>
      </div>

      <Tabs defaultValue="master" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-16 bg-slate-200 p-1 rounded-xl mb-8">
          <TabsTrigger value="master" className="text-xl font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
            Master Data Lists
          </TabsTrigger>
          <TabsTrigger value="employees" className="text-xl font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
            Employees
          </TabsTrigger>
          <TabsTrigger value="companies" className="text-xl font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
            Company Profiles
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="master" className="mt-4 focus-visible:outline-none">
          <MasterDataManager />
        </TabsContent>
        
        <TabsContent value="employees" className="mt-4 focus-visible:outline-none">
          <EmployeeManager />
        </TabsContent>
        
        <TabsContent value="companies" className="mt-4 focus-visible:outline-none">
          <CompanyManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}