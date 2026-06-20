import { db } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, query, where, orderBy, serverTimestamp, runTransaction } from "firebase/firestore";
import { Customer, CustomerFormValues } from "@/types/customer";
import { logAudit } from "./settingsService";

// Generates isolated sequences (e.g., SS-GST-1001, BPC-NON-1001, SS-CSH-1001)
const generateNextCustomerId = async (companyId: string, billingTypeId: string, companyPrefix: string, billingName: string): Promise<string> => {
  // Creates a unique counter for THIS specific company and billing type
  const counterId = `cust_${companyId}_${billingTypeId}`;
  const counterRef = doc(db, "counters", counterId);
  
  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let newSequence = 1001; // Start sequence at 1001

    if (counterDoc.exists()) {
      newSequence = counterDoc.data().sequence + 1;
    }

    transaction.set(counterRef, { sequence: newSequence }, { merge: true });

    // Generate a smart billing code (GST, NON, CSH) based on the dropdown text
    let billCode = "CUST";
    const bName = billingName.toUpperCase();
    
    if (bName.includes("NON")) {
      billCode = "NON";
    } else if (bName.includes("GST")) {
      billCode = "GST";
    } else if (bName.includes("CASH")) {
      billCode = "CSH";
    }

    // Combine for professional ID: SS-GST-1001
    const prefix = companyPrefix ? `${companyPrefix.toUpperCase()}-` : "";
    return `${prefix}${billCode}-${newSequence}`;
  });
};

export const addCustomer = async (
  data: CustomerFormValues, 
  metadata: { companyName: string, companyPrefix: string, billingTypeName: string, cityName: string, locationTypeName: string }, 
  userEmail: string
) => {
  // Pass the specific IDs to generate an isolated sequence
  const newCustomerId = await generateNextCustomerId(data.companyId, data.billingTypeId, metadata.companyPrefix, metadata.billingTypeName);
  const customerRef = doc(collection(db, "customers"));

  const customerData: Omit<Customer, "id"> = {
    ...data,
    customerId: newCustomerId,
    companyName: metadata.companyName,
    billingTypeName: metadata.billingTypeName,
    cityName: metadata.cityName,
    locationTypeName: metadata.locationTypeName,
    isActive: true,
    createdAt: serverTimestamp(),
  };

  await setDoc(customerRef, customerData);
  await logAudit(userEmail, "Added Customer", `Created customer ${data.name} (${newCustomerId}) for ${metadata.companyName}`);
  return newCustomerId;
};

export const getFilteredCustomers = async (companyId: string, billingTypeId: string): Promise<Customer[]> => {
  if (!companyId || !billingTypeId) return [];
  
  const q = query(
    collection(db, "customers"),
    where("companyId", "==", companyId),
    where("billingTypeId", "==", billingTypeId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
};

export const toggleCustomerStatus = async (customerId: string, currentStatus: boolean, customerName: string, userEmail: string) => {
  const docRef = doc(db, "customers", customerId);
  await setDoc(docRef, { isActive: !currentStatus, updatedAt: serverTimestamp() }, { merge: true });
  
  const action = !currentStatus ? "Activated" : "Deactivated";
  await logAudit(userEmail, `${action} Customer`, `Changed status of ${customerName}`);
};