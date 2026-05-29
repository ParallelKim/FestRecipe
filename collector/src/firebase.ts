import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath as admin.ServiceAccount),
  });
}

export const db = getFirestore();
