import { z } from "zod";
import { BaseRecord } from "./index";

export interface ComplaintRecord extends BaseRecord {
  complaintId: string;
  companyId: string;
  companyName: string;
  billingTypeId: string;
  billingTypeName: string;
  
  customerId: string;
  customerName: string;
  customerMobile: string;
  cityName: string;
  locationTypeName: string;

  date: string;
  description: string;
  employeeId: string;
  employeeName: string;
  
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  resolution?: string;
  closedDate?: string | null;
}

export const complaintSchema = z.object({
  companyId: z.string().min(1, "Required"),
  billingTypeId: z.string().min(1, "Required"),
  customerId: z.string().min(1, "Required"),
  date: z.string().min(1, "Required"),
  description: z.string().min(5, "Please provide complaint details"),
  employeeId: z.string().min(1, "Required"),
  status: z.enum(["Open", "In Progress", "Resolved", "Closed"]).default("Open"),
});

export type ComplaintFormValues = z.infer<typeof complaintSchema>;