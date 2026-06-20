import { z } from "zod";
import { BaseRecord } from "./index";

export interface Customer extends BaseRecord {
  customerId: string;
  companyId: string;
  companyName: string;
  billingTypeId: string;
  billingTypeName: string;
  name: string;
  mobile: string;
  address: string;
  cityId: string;
  cityName: string;
  locationTypeId: string;
  locationTypeName: string;
  gstApplicable: boolean;
  gstNumber?: string;
}

export const customerSchema = z.object({
  companyId: z.string().min(1, "Please select a company"),
  billingTypeId: z.string().min(1, "Please select a billing type"),
  name: z.string().min(2, "Customer name must be at least 2 characters"),
  mobile: z.string().min(10, "Please enter a valid 10-digit mobile number"),
  address: z.string().min(5, "Please enter the full address"),
  cityId: z.string().min(1, "Please select a city"),
  locationTypeId: z.string().min(1, "Please select a location type"),
  gstApplicable: z.boolean().default(false),
  gstNumber: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;