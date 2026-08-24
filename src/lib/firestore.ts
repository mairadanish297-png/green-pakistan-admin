import { getAuth } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function fetchCollection(collectionName: string) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}
export async function fetchUsers() { return fetchCollection("users"); }
export async function banUser(uid: string, banned: boolean) { await updateDoc(doc(db, "users", uid), { isBanned: banned }); }
export async function verifyUser(uid: string, verified: boolean) { await updateDoc(doc(db, "users", uid), { isVerified: verified }); }
export async function deleteUser(uid: string) { await deleteDoc(doc(db, "users", uid)); }
export async function fetchPosts() { return fetchCollection("posts"); }
export async function deletePost(id: string) { await deleteDoc(doc(db, "posts", id)); }
export async function fetchTrees() { return fetchCollection("trees"); }
export async function fetchNotifications() { return fetchCollection("notifications"); }
export async function sendNotification(data: { title: string; description: string; type: "Reminder" | "Social" | "Milestone"; userId?: string }) {
  await addDoc(collection(db, "notifications"), {
    title: data.title.trim(),
    description: data.description.trim(),
    type: data.type,
    userId: data.userId?.trim() || "all",
    isRead: false,
    timestamp: Timestamp.now(),
  });
}
export async function fetchChallenges() { return fetchCollection("challenges"); }
export async function addChallenge(data: unknown) { await addDoc(collection(db, "challenges"), data); }
export async function deleteChallenge(id: string) { await deleteDoc(doc(db, "challenges", id)); }
export async function fetchEvents() { return fetchCollection("events"); }
export async function addEvent(data: unknown) { await addDoc(collection(db, "events"), data); }
export async function deleteEvent(id: string) { await deleteDoc(doc(db, "events", id)); }
export async function fetchRewardClaims() { return fetchCollection("reward_claims"); }
export async function updateClaimStatus(id: string, status: string) { await updateDoc(doc(db, "reward_claims", id), { status }); }
export async function fetchXPConfig() { const snapshot = await getDoc(doc(db, "system_config", "xp")); return snapshot.exists() ? snapshot.data() : {}; }
export async function updateXPConfig(config: Record<string, number>) { await setDoc(doc(db, "system_config", "xp"), config, { merge: true }); }
export async function claimFirstAdmin(uid: string, email: string) { await setDoc(doc(db, "system_config", "admin"), { uid, email, createdAt: Timestamp.now() }); }
export async function isAdminUser(uid: string) { const snapshot = await getDoc(doc(db, "system_config", "admin")); return snapshot.exists() && snapshot.data().uid === uid; }

export function currentAuthUid() { return getAuth().currentUser?.uid || null; }
export async function fetchCertificates() { return fetchCollection("certificates"); }
export async function deleteCertificate(id: string) { await deleteDoc(doc(db, "certificates", id)); }