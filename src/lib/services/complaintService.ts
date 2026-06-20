import { db } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, query, where, orderBy, serverTimestamp, runTransaction } from "firebase/firestore";
import { ComplaintRecord, ComplaintFormValues } from "@/types/complaint";
import { logAudit } from "./settingsService";

const generateNextComplaintId = async (companyId: string, companyPrefix: string): Promise<string> => {
  const counterId = `cmp_${companyId}`;
  const counterRef = doc(db, "counters", counterId);
  
  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let newSequence = 1001;

    if (counterDoc.exists()) {
      newSequence = counterDoc.data().sequence + 1;
    }

    transaction.set(counterRef, { sequence: newSequence }, { merge: true });

    const prefix = companyPrefix ? `${companyPrefix.toUpperCase()}-` : "";
    return `${prefix}CMP-${newSequence}`;
  });
};

export const addComplaint = async (data: ComplaintFormValues, metadata: any, userEmail: string) => {
  const newComplaintId = await generateNextComplaintId(data.companyId, metadata.companyPrefix);
  const complaintRef = doc(collection(db, "complaints"));

  const complaintData: Omit<ComplaintRecord, "id"> = {
    ...data,
    complaintId: newComplaintId,
    ...metadata,
    isActive: true,
    createdAt: serverTimestamp(),
  };

  await setDoc(complaintRef, complaintData);
  await logAudit(userEmail, "Registered Complaint", `Registered ${newComplaintId} for ${metadata.customerName}`);
  return newComplaintId;
};

export const getFilteredComplaints = async (companyId: string, billingTypeId: string): Promise<ComplaintRecord[]> => {
  if (!companyId || !billingTypeId) return [];
  
  const q = query(
    collection(db, "complaints"),
    where("companyId", "==", companyId),
    where("billingTypeId", "==", billingTypeId),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ComplaintRecord));
};

export const updateComplaintStatus = async (complaintId: string, status: ComplaintRecord["status"], resolution: string, complaintName: string, userEmail: string) => {
  const docRef = doc(db, "complaints", complaintId);
  
  const updateData: any = { 
    status, 
    resolution,
    updatedAt: serverTimestamp() 
  };

  if (status === "Closed" || status === "Resolved") {
    updateData.closedDate = new Date().toISOString().split('T')[0];
  } else {
    updateData.closedDate = null;
  }

  await setDoc(docRef, updateData, { merge: true });
  await logAudit(userEmail, `Updated Complaint`, `Marked ${complaintName} as ${status}`);
};