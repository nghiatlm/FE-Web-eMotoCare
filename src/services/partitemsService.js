import { getPartItem } from "../api/partitemsApi";

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
// Lấy chi tiết 1 part-item theo id
export const getPartItemByIdService = async (id) => {
  const res = await getPartItemById(id);
  const data = res?.data?.data || {};
  return {
    id: data.id,
    serialNumber: data.serialNumber || "",
    price: Number(data.price) || 0,
    // BE của bạn có thể trả part = null -> name fallback sẽ xử lý ở component
    part: data.part || null,
  };
};
