import { db } from "@/lib/firebase";
import { collection, getDocs, setDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { LabourRecord, LabourFormValues } from "@/types/labour";
import { logAudit } from "./settingsService";

export const addLabourRecord = async (data: LabourFormValues, metadata: any, userEmail: string) => {
  const recordRef = doc(collection(db, "labour_records"));

  const recordData: Omit<LabourRecord, "id"> = {
    ...data,
    ...metadata,
    isActive: true,
    createdAt: serverTimestamp(),
  };

  await setDoc(recordRef, recordData);
  await logAudit(userEmail, "Added Labour Record", `Recorded attendance for ${metadata.employeeName}`);
  return recordRef.id;
};

export const getAllLabourRecords = async (): Promise<LabourRecord[]> => {
  const q = query(
    collection(db, "labour_records"),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LabourRecord));
};