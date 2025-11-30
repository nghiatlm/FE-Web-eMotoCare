// src/utils/firebaseUpload.js
import {
  getStorage,
  ref,
  uploadString,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "./firebase"; // ✅ chỉ import storage, KHÔNG import app

/** Upload một dataURL (ví dụ ảnh PNG từ QRCode.toDataURL) lên Storage */
export async function uploadDataUrl(path, dataUrl) {
  // path ví dụ: `appointments/${appointmentId}/checkin.png`
  const fileRef = ref(storage, path);
  await uploadString(fileRef, dataUrl, "data_url");
  return await getDownloadURL(fileRef);
}

/** Upload một file (ví dụ ảnh từ input file) lên Storage */
export async function uploadFile(path, file) {
  // path ví dụ: `campaigns/${campaignId}/attachment.jpg`
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}
