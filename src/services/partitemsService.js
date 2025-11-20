import {
  getPartItem,
  getSuggestedPartItems,
  getPartItemById, // 🔥 thêm dòng này
  getPartItemsByServiceCenter,
} from "../api/partitemsApi";

/**
 * Tìm kiếm Part Items (GET /v1/part-items?search=keyword)
 */
export const searchPartItemsService = async (
  keyword = "",
  { page, pageSize } = {}
) => {
  const params = {};
  if (keyword?.trim()) params.search = keyword.trim();
  if (page) params.pageCurrent = page;
  if (pageSize) params.pageSize = pageSize;

  const res = await getPartItem({ params });
  const rows = res?.data?.data?.rowDatas || [];
  return rows.map((item) => ({
    id: item.id, // part-item id
    code: item.part?.code || "",
    name: item.part?.name || "",
    price: Number(item.price) || 0,
  }));
};
export const getPartItemByIdService = async (id) => {
  const res = await getPartItemById(id);
  return res?.data?.data || res?.data || res;
};

// Lấy danh sách gợi ý PartItem cho 1 EVCheckDetail
export const getSuggestedPartItemsByEvCheckDetailId = async (
  evCheckDetailId
) => {
  const res = await getSuggestedPartItems(evCheckDetailId);
  // BE có thể trả về {data:{data:[...]}} hoặc {data:[...]} hoặc [...]
  return res?.data?.data || res?.data || res || [];
};

// ✅ Lấy phụ tùng theo service center
export const getPartItemsByServiceCenterService = async (serviceCenterId) => {
  try {
    const res = await getPartItemsByServiceCenter(serviceCenterId);
    console.log("🔍 getPartItemsByServiceCenterService - Full response:", res);
    
    // ✅ Axios interceptor đã unwrap response.data, nên res = {statusCode, success, message, data: [...]}
    // Từ response user: { statusCode: 200, success: true, message: "...", data: [...] }
    let items = [];
    if (Array.isArray(res)) {
      // Nếu res là array trực tiếp
      items = res;
    } else if (Array.isArray(res?.data)) {
      // ✅ Trường hợp phổ biến: res.data là array
      items = res.data;
    } else if (Array.isArray(res?.data?.data)) {
      items = res.data.data;
    } else if (Array.isArray(res?.data?.rowDatas)) {
      items = res.data.rowDatas;
    }
    
    console.log("🔍 getPartItemsByServiceCenterService - Parsed items:", items);
    console.log("🔍 getPartItemsByServiceCenterService - First item:", items[0]);
    if (items[0]) {
      console.log("🔍 First item serialNumber:", items[0].serialNumber);
      console.log("🔍 First item part:", items[0].part);
    }
    
    // ✅ Normalize data để giống format cũ, bao gồm serialNumber
    const normalized = items.map((item) => {
      const result = {
        id: item.id || item.partItemId,
        name: item.part?.name || item.name || item.serialNumber || item.id,
        serialNumber: item.serialNumber || item.serial_number || "",
        price: Number(item.price ?? item.unitPrice ?? 0),
        partItemId: item.id || item.partItemId,
      };
      console.log("🔍 Normalized item:", result);
      return result;
    });
    
    console.log("🔍 getPartItemsByServiceCenterService - Final normalized:", normalized);
    return normalized;
  } catch (error) {
    console.error("Lỗi lấy phụ tùng theo service center:", error);
    throw error;
  }
};

export const getPartItemsService = async (params = {}) => {
  try {
    // 👈 GÓI VÀO params CHO AXIOS
    const res = await getPartItem({ params });

    const rowDatas =
      res?.data?.data?.rowDatas || res?.data?.rowDatas || res?.rowDatas || [];

    if (!Array.isArray(rowDatas) || rowDatas.length === 0) {
      console.warn("Không có dữ liệu part-items");
      return [];
    }

    return rowDatas.map((item) => {
      const part = item.part || {};
      return {
        value: item.id, // id của partItem
        label: part.name || "Không tên", // tên phụ tùng
        price: Number(item.price) || 0,
        partItemId: item.id,
      };
    });
  } catch (error) {
    console.error("Lỗi getPartItemsService:", error);
    return [];
  }
};
