import api from "./api";
const BASE_URL = "https://arabia-broad-celebrities-silicon.trycloudflare.com/api/v1/export-notes";
const token = localStorage.getItem("user").token;
export const getExportNotes = (page = 1, pageSize = 10) => {
  return api.get(`${BASE_URL}?page=${page}&pageSize=${pageSize}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const getExportNoteById = (exportNoteId) => {
  return api.get(`${BASE_URL}/${exportNoteId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const createExportNote = (exportNoteData) => {
  return api.post(BASE_URL, exportNoteData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const updateExportNote = (exportNoteId, exportNoteData) => {
  return api.put(`${BASE_URL}/${exportNoteId}`, exportNoteData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const deleteExportNote = (exportNoteId) => {
  return api.delete(`${BASE_URL}/${exportNoteId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

