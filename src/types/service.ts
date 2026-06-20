import { z } from "zod";
import { BaseRecord } from "./index";

export interface ServiceRecord extends BaseRecord {
  serviceId: string;
  companyId: string;
  companyName: string;
  billingTypeId: string;
  billingTypeName: string;
  
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  cityName: string;
  locationTypeName: string;

  date: string;
  area: string;
  treatmentTypeId: string;
  treatmentTypeName: string;
  employeeId: string;
  employeeName: string;
  
  price: number;
  paymentStatusId: string;
  paymentStatusName: string;
  paymentModeId: string;
  paymentModeName: string;
  
  billGiven: boolean;
  remarks: string;
  followUpDate: string;
}

export const serviceSchema = z.object({
  companyId: z.string().min(1, "Required"),
  billingTypeId: z.string().min(1, "Required"),
  customerId: z.string().min(1, "Required"),
  date: z.string().min(1, "Required"),
  area: z.string().min(1, "Area is required"),
  treatmentTypeId: z.string().min(1, "Required"),
  employeeId: z.string().min(1, "Required"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  paymentStatusId: z.string().min(1, "Required"),
  paymentModeId: z.string().min(1, "Required"),
  billGiven: z.boolean().default(false),
  remarks: z.string().optional(),
  followUpDate: z.string().min(1, "Required"),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;