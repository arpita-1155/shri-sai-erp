import { db } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, query, where, orderBy, serverTimestamp, runTransaction } from "firebase/firestore";
import { PurchaseRecord, PurchaseFormValues } from "@/types/purchase";
import { logAudit } from "./settingsService";

const generateNextPurchaseId = async (companyId: string, companyPrefix: string): Promise<string> => {
  const counterId = `pur_${companyId}`;
  const counterRef = doc(db, "counters", counterId);
  
  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let newSequence = 1001;

    if (counterDoc.exists()) {
      newSequence = counterDoc.data().sequence + 1;
    }

    transaction.set(counterRef, { sequence: newSequence }, { merge: true });

    const prefix = companyPrefix ? `${companyPrefix.toUpperCase()}-` : "";
    return `${prefix}PUR-${newSequence}`;
  });
};

export const addPurchase = async (data: PurchaseFormValues, metadata: any, userEmail: string) => {
  const newPurchaseId = await generateNextPurchaseId(data.companyId, metadata.companyPrefix);
  const purchaseRef = doc(collection(db, "purchases"));

  const purchaseData: Omit<PurchaseRecord, "id"> = {
    ...data,
    purchaseId: newPurchaseId,
    ...metadata,
    isActive: true,
    createdAt: serverTimestamp(),
  };

  await setDoc(purchaseRef, purchaseData);
  await logAudit(userEmail, "Added Purchase Entry", `Recorded purchase ${newPurchaseId} from ${data.vendorName}`);
  return newPurchaseId;
};

export const getFilteredPurchases = async (companyId: string, billingTypeId: string): Promise<PurchaseRecord[]> => {
  if (!companyId || !billingTypeId) return [];
  
  const q = query(
    collection(db, "purchases"),
    where("companyId", "==", companyId),
    where("billingTypeId", "==", billingTypeId),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseRecord));
};