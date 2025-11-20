import {
  getPartItem,
  getSuggestedPartItems,
  getPartItemById, // 🔥 thêm dòng này
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
