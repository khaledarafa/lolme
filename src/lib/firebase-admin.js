import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

if (!admin.apps.length) {
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id, // 🔥 ده المهم
});
}

export const db = admin.firestore();