import api from "./api";
const BASE_URL = "/v1/export-notes";
const user = JSON.parse(localStorage.getItem("user"));
const token = user?.token;

export const getExportNotes = (params = {}) => {
  const {
    page = 1,
    pageSize = 10,
    status,
    serviceCenterId,
    code,
    outOfStock
  } = typeof params === "object" ? params : {};

  const queryParams = {
    page,
    pageSize,
    ...(status && { status }),
    ...(serviceCenterId && { serviceCenterId }),
    ...(code && { code }),
    ...(typeof outOfStock !== "undefined" && { outOfStock })
  };

  return api.get(BASE_URL, {
    params: queryParams,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const getExportNoteOutOfStockById = (id) => {
  return api.get(`${BASE_URL}/out-of-stock/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

// ✅ Lấy export status theo appointmentCode và proposedPartId
export const getExportStatusByAppointmentAndPart = (appointmentCode, proposedPartId) => {
  return api.get(`/v1/export-note-details/export-status`, {
    params: {
      appointmentCode,
      proposedPartId
    },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};


export const updateExportNoteDetail = (detailId, detailData) => {
  return api.put(`/v1/export-note-details/${detailId}`, detailData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};
