import { db } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, query, where, orderBy, serverTimestamp, runTransaction } from "firebase/firestore";
import { AmcRecord, AmcFormValues } from "@/types/amc";
import { logAudit } from "./settingsService";

const generateNextAmcId = async (companyId: string, companyPrefix: string): Promise<string> => {
  const counterId = `amc_${companyId}`;
  const counterRef = doc(db, "counters", counterId);
  
  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let newSequence = 1001;

    if (counterDoc.exists()) {
      newSequence = counterDoc.data().sequence + 1;
    }

    transaction.set(counterRef, { sequence: newSequence }, { merge: true });

    const prefix = companyPrefix ? `${companyPrefix.toUpperCase()}-` : "";
    return `${prefix}AMC-${newSequence}`;
  });
};

export const addAmc = async (data: AmcFormValues, metadata: any, userEmail: string) => {
  const newAmcId = await generateNextAmcId(data.companyId, metadata.companyPrefix);
  const amcRef = doc(collection(db, "amcs"));

  const amcData: Omit<AmcRecord, "id"> = {
    ...data,
    amcId: newAmcId,
    ...metadata,
    visitsCompleted: 0,
    amcStatus: "Active",
    isActive: true,
    createdAt: serverTimestamp(),
  };

  await setDoc(amcRef, amcData);
  await logAudit(userEmail, "Created AMC", `Created AMC ${newAmcId} for ${metadata.customerName}`);
  return newAmcId;
};

export const getFilteredAmcs = async (companyId: string, billingTypeId: string): Promise<AmcRecord[]> => {
  if (!companyId || !billingTypeId) return [];
  
  const q = query(
    collection(db, "amcs"),
    where("companyId", "==", companyId),
    where("billingTypeId", "==", billingTypeId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AmcRecord));
};

export const toggleAmcStatus = async (amcId: string, currentStatus: boolean, amcName: string, userEmail: string) => {
  const docRef = doc(db, "amcs", amcId);
  await setDoc(docRef, { isActive: !currentStatus, updatedAt: serverTimestamp() }, { merge: true });
  await logAudit(userEmail, `${!currentStatus ? "Activated" : "Deactivated"} AMC`, `Changed status of AMC ${amcName}`);
};