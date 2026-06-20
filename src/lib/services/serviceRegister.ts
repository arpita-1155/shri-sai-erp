import { db } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, query, where, orderBy, serverTimestamp, runTransaction } from "firebase/firestore";
import { ServiceRecord, ServiceFormValues } from "@/types/service";
import { logAudit } from "./settingsService";
import { Customer } from "@/types/customer";

const generateNextServiceId = async (companyId: string, billingTypeId: string, companyPrefix: string, billingName: string): Promise<string> => {
  const counterId = `srv_${companyId}_${billingTypeId}`;
  const counterRef = doc(db, "counters", counterId);
  
  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let newSequence = 1001;

    if (counterDoc.exists()) {
      newSequence = counterDoc.data().sequence + 1;
    }

    transaction.set(counterRef, { sequence: newSequence }, { merge: true });

    let billCode = "SRV";
    const bName = billingName.toUpperCase();
    if (bName.includes("NON")) billCode = "NON";
    else if (bName.includes("GST")) billCode = "GST";
    else if (bName.includes("CASH")) billCode = "CSH";

    const prefix = companyPrefix ? `${companyPrefix.toUpperCase()}-` : "";
    return `${prefix}${billCode}-SRV-${newSequence}`;
  });
};

export const addService = async (data: ServiceFormValues, metadata: any, userEmail: string) => {
  const newServiceId = await generateNextServiceId(data.companyId, data.billingTypeId, metadata.companyPrefix, metadata.billingTypeName);
  const serviceRef = doc(collection(db, "services"));

  const serviceData: Omit<ServiceRecord, "id"> = {
    ...data,
    serviceId: newServiceId,
    ...metadata, // Spreads all the resolved names (Customer Name, Treatment Name, etc.)
    isActive: true,
    createdAt: serverTimestamp(),
  };

  await setDoc(serviceRef, serviceData);
  await logAudit(userEmail, "Added Service", `Created service ${newServiceId} for ${metadata.customerName}`);
  return newServiceId;
};

export const getFilteredServices = async (companyId: string, billingTypeId: string): Promise<ServiceRecord[]> => {
  if (!companyId || !billingTypeId) return [];
  
  const q = query(
    collection(db, "services"),
    where("companyId", "==", companyId),
    where("billingTypeId", "==", billingTypeId),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord));
};