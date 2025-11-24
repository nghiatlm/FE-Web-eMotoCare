import { getExportNotes, getExportNotePartItems } from "../api/exportNotesApi";

/**
 * Lấy danh sách export notes
 */
export const fetchExportNotesService = async (params = {}) => {
  try {
    const { page = 1, pageSize = 100 } = params;
    const res = await getExportNotes(page, pageSize);
    
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

