import { z } from "zod";
import { BaseRecord } from "./index";

export interface LabourRecord extends BaseRecord {
  date: string;
  employeeId: string;
  employeeName: string;
  
  workerType: "Daily" | "Hourly";
  status: "Present" | "Absent" | "Half Day";
  baseWage: number;
  
  hoursWorked: number;
  hourlyRate: number;
  
  advanceGiven: number;
  extraAllowance: number;
  allowanceReason: string;
  
  netPayable: number;
  paymentModeId?: string;
  paymentModeName?: string;
  remarks?: string;
}

export const labourSchema = z.object({
  date: z.string().min(1, "Date is required"),
  employeeId: z.string().min(1, "Required"),
  workerType: z.enum(["Daily", "Hourly"]).default("Daily"),
  
  status: z.enum(["Present", "Absent", "Half Day"]).default("Present"),
  baseWage: z.coerce.number().min(0).default(0),
  
  hoursWorked: z.coerce.number().min(0).default(0),
  hourlyRate: z.coerce.number().min(0).default(0),
  
  advanceGiven: z.coerce.number().min(0, "Cannot be negative").default(0),
  extraAllowance: z.coerce.number().min(0, "Cannot be negative").default(0),
  allowanceReason: z.string().optional(),
  
  netPayable: z.coerce.number(),
  paymentModeId: z.string().optional(),
  remarks: z.string().optional(),
});

export type LabourFormValues = z.infer<typeof labourSchema>;