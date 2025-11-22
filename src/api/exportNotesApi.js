import api from "./api";
const BASE_URL = "/v1/export-notes";
const user = JSON.parse(localStorage.getItem("user"));
const token = user?.token;
export const getExportNotes = (page = 1, pageSize = 10, serviceCenterId = null) => {
  const params = { page, pageSize };
  if (serviceCenterId) {
    params.serviceCenterId = serviceCenterId;
  }
  const queryString = new URLSearchParams(params).toString();
  return api.get(`${BASE_URL}?${queryString}`, {
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

export const getExportNotePartItems = (exportNoteId) => {
  return api.get(`${BASE_URL}/${exportNoteId}/part-items`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

