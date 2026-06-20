import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { MasterDataItem, Employee, Company } from "@/types";

// Audit Logging
export const logAudit = async (userEmail: string, action: string, details: string) => {
  await addDoc(collection(db, "audit_logs"), {
    userEmail,
    action,
    details,
    timestamp: serverTimestamp(),
  });
};

// Generic Master Data Fetcher (FIXED: Now forgiving of manual Firebase entries)
export const getMasterData = async (collectionName: string): Promise<MasterDataItem[]> => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Forgive uppercase 'Name' or missing names
      name: data.name || data.Name || `Unnamed (${doc.id.substring(0,4)})`,
      // Forgive missing isActive field
      isActive: data.isActive !== false 
    } as MasterDataItem;
  });
};

export const addMasterData = async (collectionName: string, name: string, userEmail: string) => {
  const newDoc = await addDoc(collection(db, collectionName), {
    name,
    isActive: true,
    createdAt: serverTimestamp(),
  });
  await logAudit(userEmail, "Added Master Data", `Added ${name} to ${collectionName}`);
  return newDoc.id;
};

export const toggleRecordStatus = async (collectionName: string, id: string, currentStatus: boolean, itemName: string, userEmail: string) => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, { isActive: !currentStatus });
  const action = !currentStatus ? "Activated" : "Deactivated";
  await logAudit(userEmail, `${action} Record`, `Changed status of ${itemName} in ${collectionName}`);
};

export const getEmployees = async (): Promise<Employee[]> => {
  const snapshot = await getDocs(collection(db, "employees"));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      name: data.name || data.Name || "Unnamed Employee",
      isActive: data.isActive !== false
    } as Employee;
  });
};

export const addEmployee = async (employee: Omit<Employee, "id" | "isActive">, userEmail: string) => {
  await addDoc(collection(db, "employees"), {
    ...employee,
    isActive: true,
    createdAt: serverTimestamp(),
  });
  await logAudit(userEmail, "Added Employee", `Added employee ${employee.name}`);
};

// Company Fetcher (FIXED: Now forgiving of manual Firebase entries)
export const getCompanies = async (): Promise<Company[]> => {
  const snapshot = await getDocs(collection(db, "companies"));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      name: data.name || data.Name || `Unnamed Company`,
      isActive: data.isActive !== false
    } as Company;
  });
};

export const updateCompany = async (id: string, data: Partial<Company>, companyName: string, userEmail: string) => {
  const docRef = doc(db, "companies", id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  await logAudit(userEmail, "Updated Company", `Updated details for ${companyName}`);
};