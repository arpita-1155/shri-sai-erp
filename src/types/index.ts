export interface BaseRecord {
  id: string;
  isActive: boolean;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any;
}

export interface MasterDataItem extends BaseRecord {
  name: string;
}

export interface Employee extends BaseRecord {
  name: string;
  mobile: string;
  role: "Admin" | "Staff";
}

export interface Company extends BaseRecord {
  name: string;
  invoicePrefix: string;
  gstNumber: string;
  address: string;
  bankDetails: string;
}

export interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: any;
}