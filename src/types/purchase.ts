import { z } from "zod";
import { BaseRecord } from "./index";

export interface PurchaseRecord extends BaseRecord {
  purchaseId: string;
  companyId: string;
  companyName: string;
  billingTypeId: string;
  billingTypeName: string;
  
  purchaseCategory: "Chemicals" | "Equipment" | "General Expense";
  date: string;
  vendorName: string;
  invoiceNumber: string;
  
  materialName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  
  amountPaid: number;
  dues: number;
  
  paymentModeId: string;
  paymentModeName: string;
  remarks: string;
}

export const purchaseSchema = z.object({
  companyId: z.string().min(1, "Required"),
  billingTypeId: z.string().min(1, "Required"),
  purchaseCategory: z.enum(["Chemicals", "Equipment", "General Expense"]).default("Chemicals"),
  date: z.string().min(1, "Required"),
  vendorName: z.string().min(2, "Vendor name is required"),
  invoiceNumber: z.string().optional(), // Made optional for general expenses like tea/snacks
  materialName: z.string().min(2, "Item name is required"),
  quantity: z.coerce.number().min(0.1, "Must be greater than 0"),
  unit: z.string().min(1, "Required"),
  pricePerUnit: z.coerce.number().min(0, "Cannot be negative"),
  totalPrice: z.coerce.number().min(0),
  amountPaid: z.coerce.number().min(0, "Cannot be negative"),
  dues: z.coerce.number(),
  paymentModeId: z.string().min(1, "Required"),
  remarks: z.string().optional(),
});

export type PurchaseFormValues = z.infer<typeof purchaseSchema>;