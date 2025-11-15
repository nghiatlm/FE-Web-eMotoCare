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

// export const getPartItemsService = async (config = {}) => {
//   try {
//     const res = await getPartItem(config);

//     const rowDatas = res?.data?.rowDatas || [];

//     if (rowDatas.length === 0) {
//       console.warn("Không có dữ liệu part-items");
//       return [];
//     }

//     return rowDatas.map((item) => {
//       const part = item.part || {};
//       return {
//         value: part.code || item.id,
//         label: part.name || "Không tên",
//         price: Number(item.price) || 0,
//         partItemId: item.id,
//       };
//     });
//   } catch (error) {
//     console.error("Lỗi getPartItemsService:", error);
//     return [];
//   }
// };

const MODEL_TO_CODE_KEYWORD = {
  "VinFast Evo200": "EVO200",
  "VinFast Klara S": "KLARAS",

  // Thêm xe mới ở đây
};

/**
 * LẤY PARTITEM THEO MODEL (EVO200, Klara S,...)
 * Lọc theo prefix trong part.code
 */
export const getPartItemsByModelService = async (
  modelName = "VinFast Evo200",
  config = {}
) => {
  try {
    const res = await getPartItem(config);
    const rowDatas = res?.data?.rowDatas || [];

    // LẤY KEYWORD TỪ modelName
    const keyword = MODEL_TO_CODE_KEYWORD[modelName] || "EVO200";

    // LỌC: code CHỨA keyword (case-insensitive)
    const filtered = rowDatas.filter((item) => {
      const part = item.part || {};
      const code = (part.code || "").toUpperCase();
      return code.includes(keyword);
    });

    console.log(
      `Lọc được ${filtered.length} PartItem cho xe "${modelName}" (tìm: "${keyword}")`
    );

    return filtered.map((item) => {
      const part = item.part || {};
      return {
        value: item.id,
        label: `${part.name || "Không tên"} (${part.code || "N/A"})`,
        price: Number(item.price) || 0,
        partItemId: item.id,
        partCode: part.code,
      };
    });
  } catch (error) {
    console.error("Lỗi getPartItemsByModelService:", error);
    return [];
  }
};
