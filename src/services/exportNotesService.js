import { getExportNotes, getExportNotePartItems } from "../api/exportNotesApi";

/**
 * Lấy danh sách export notes
 */
export const fetchExportNotesService = async (params = {}) => {
  try {
    const { page = 1, pageSize = 100, ...rest } = params;
    const res = await getExportNotes({ page, pageSize, ...rest });
    
    // Axios interceptor đã unwrap response.data
    const rowDatas = res?.data?.rowDatas || res?.rowDatas || res?.data || [];
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
      try {
        const partItems = await fetchExportNotePartItemsService(exportNote.id);
        
        // Tìm partItemId trong part items
        const foundItem = partItems.find(
          (item) => item.partItemId === partItemId || item.partItem?.id === partItemId
        );
        
        if (foundItem) {
          // Trả về status của export note
          return exportNote.exportNoteStatus || exportNote.status || null;
        }
      } catch (err) {
        console.error(`Lỗi lấy part items của export note ${exportNote.id}:`, err);
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Lỗi tìm export note status:", error);
    return null;
  }
};

