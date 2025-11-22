// src/utils/firebaseUpload.js
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "./firebase";

export async function uploadDataUrl(path, dataUrl) {
  const fileRef = ref(storage, path);
  await uploadString(fileRef, dataUrl, "data_url");
  return await getDownloadURL(fileRef);
}
