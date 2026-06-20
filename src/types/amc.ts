import { z } from "zod";
import { BaseRecord } from "./index";

export interface AmcRecord extends BaseRecord {
  amcId: string;
  companyId: string;
  companyName: string;
  billingTypeId: string;
  billingTypeName: string;
  
  customerId: string;
  customerName: string;
  customerMobile: string;
  cityName: string;
  locationTypeName: string;

  startDate: string;
  endDate: string;
  frequency: string;
  visitsCompleted: number;
  totalVisits: number;
  nextVisitDate: string;
  amcStatus: "Active" | "Completed" | "Cancelled";
}

export const amcSchema = z.object({
  companyId: z.string().min(1, "Required"),
  billingTypeId: z.string().min(1, "Required"),
  customerId: z.string().min(1, "Required"),
  startDate: z.string().min(1, "Required"),
  endDate: z.string().min(1, "Required"),
  frequency: z.string().min(1, "Required"),
  nextVisitDate: z.string().min(1, "Required"),
  totalVisits: z.coerce.number().min(1, "Must have at least 1 visit"),
});

export type AmcFormValues = z.infer<typeof amcSchema>;