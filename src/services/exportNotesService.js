import { getExportNotes, getExportNotePartItems, getExportStatusByAppointmentAndPart } from "../api/exportNotesApi";

/**
 * Lấy danh sách export notes
 */
export const fetchExportNotesService = async (params = {}) => {
  try {
    const { page = 1, pageSize = 100, ...rest } = params;
    const res = await getExportNotes({ page, pageSize, ...rest });
    
    // ✅ Axios interceptor đã unwrap response.data
    // Response structure: { data: { rowDatas: [...] } } hoặc { rowDatas: [...] }
    const data = res?.data?.data || res?.data || res;
    const rowDatas = data?.rowDatas || data || [];
    return Array.isArray(rowDatas) ? rowDatas : [];
  } catch (error) {
    console.error("Lỗi lấy danh sách export notes:", error);
    return [];
  }
};

/**
 * Lấy part items của một export note
 */
export const fetchExportNotePartItemsService = async (exportNoteId) => {
  try {
    const res = await getExportNotePartItems(exportNoteId);
    
    // Axios interceptor đã unwrap response.data
    const items = res?.data || res || [];
    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.error("Lỗi lấy part items của export note:", error);
    return [];
  }
};

/**
 * Tìm export note status theo partItemId
 * Tìm trong tất cả export notes và part items của chúng
 */
export const findExportNoteStatusByPartItemId = async (partItemId) => {
  if (!partItemId) return null;
  
  try {
    // Lấy tất cả export notes
    const exportNotes = await fetchExportNotesService({ pageSize: 1000 });
    
    // Tìm trong từng export note
    for (const exportNote of exportNotes) {
      // ✅ Kiểm tra xem export note có partItems trong response không (từ API getExportNotes)
      let partItems = exportNote.partItems || [];
      
      // ✅ Nếu không có partItems trong response, gọi API riêng để lấy
      if (!partItems || partItems.length === 0) {
        try {
          partItems = await fetchExportNotePartItemsService(exportNote.id);
        } catch (err) {
          console.error(`Lỗi lấy part items của export note ${exportNote.id}:`, err);
          continue;
        }
      }
      
      // ✅ Tìm partItemId trong part items
      // partItem có thể có: id, partItemId, hoặc partItem.id
      // ✅ Từ API response: partItems là array các object có id trực tiếp
      const foundItem = partItems.find(
        (item) => {
          const itemId = item.id || item.partItemId || item.partItem?.id || item.part?.id;
          return itemId === partItemId;
        }
      );
      
      if (foundItem) {
        // ✅ Trả về exportNoteStatus từ export note
        const status = exportNote.exportNoteStatus || exportNote.status;
        console.log(`✅ Tìm thấy export note status cho partItem ${partItemId}:`, status, "từ export note", exportNote.code);
        return status;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Lỗi tìm export note status:", error);
    return null;
  }
};

/**
 * ✅ Lấy export note status theo appointmentCode và proposedPartId (API mới)
 */
export const getExportStatusByAppointmentCodeAndPartId = async (appointmentCode, proposedPartId) => {
  if (!appointmentCode || !proposedPartId) {
    console.warn("⚠️ Thiếu appointmentCode hoặc proposedPartId để lấy export status");
    return null;
  }
  
  try {
    const res = await getExportStatusByAppointmentAndPart(appointmentCode, proposedPartId);
    
    // ✅ Parse response: có thể là string status hoặc object có status
    let status = null;
    if (typeof res === 'string') {
      status = res;
    } else if (res?.data) {
      status = res.data?.status || res.data?.exportNoteStatus || res.data;
    } else if (res?.status) {
      status = res.status;
    } else if (res?.exportNoteStatus) {
      status = res.exportNoteStatus;
    }
    
    console.log(`✅ Lấy export status cho appointmentCode ${appointmentCode}, proposedPartId ${proposedPartId}:`, status);
    return status;
  } catch (error) {
    console.error(`❌ Lỗi lấy export status cho appointmentCode ${appointmentCode}, proposedPartId ${proposedPartId}:`, error);
    // ✅ Không throw error, chỉ log và return null
    return null;
  }
};

