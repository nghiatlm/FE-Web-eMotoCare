import api from "./api";

const BASE_URL = "/v1/import-notes";
const user = JSON.parse(localStorage.getItem("user"));
const token = user?.token;
export const getImportNotes = (page = 1, pageSize = 10) => {
  return api.get(`${BASE_URL}?page=${page}&pageSize=${pageSize}`, { headers: { Authorization: `Bearer ${token}` } });
};

export const getImportNoteById = (importNoteId) => {
  return api.get(`${BASE_URL}/${importNoteId}`, { headers: { Authorization: `Bearer ${token}` } });
};

export const createImportNote = (importNoteData) => {
  return api.post(BASE_URL, importNoteData, { headers: { Authorization: `Bearer ${token}` } });
};

export const updateImportNote = (importNoteId, importNoteData) => {
  return api.put(`${BASE_URL}/${importNoteId}`, importNoteData, { headers: { Authorization: `Bearer ${token}` } });
};

export const deleteImportNote = (importNoteId) => {
  return api.delete(`${BASE_URL}/${importNoteId}`, { headers: { Authorization: `Bearer ${token}` } });
};

