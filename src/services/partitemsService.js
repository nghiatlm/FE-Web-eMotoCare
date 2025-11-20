import { getPartItem, getSuggestedPartItems } from "../api/partitemsApi";

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
