import api from "./api";

const BASE_URL = "/v1/import-notes";

export const getImportNotes = (page = 1, pageSize = 10) => {
  return api.get(`${BASE_URL}?page=${page}&pageSize=${pageSize}`);
};

export const getImportNoteById = (importNoteId) => {
  return api.get(`${BASE_URL}/${importNoteId}`);
};

export const createImportNote = (importNoteData) => {
  return api.post(BASE_URL, importNoteData);
};

export const updateImportNote = (importNoteId, importNoteData) => {
  return api.put(`${BASE_URL}/${importNoteId}`, importNoteData);
};

export const deleteImportNote = (importNoteId) => {
  return api.delete(`${BASE_URL}/${importNoteId}`);
};

