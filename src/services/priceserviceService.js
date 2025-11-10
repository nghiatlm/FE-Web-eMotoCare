// src/services/priceserviceService.js
import { getPriceServices } from "../api/priceserviceApi";

// Bộ nhớ tạm (cache) để tránh gọi API trùng
const laborCostCache = new Map();

/**
 * 🔹 Lấy danh sách tất cả bảng giá dịch vụ (đã format)
 * @param {object} params - ví dụ { page:1, pageSize:10, remedies:'REPAIR' }
 * @returns {Promise<Array>} danh sách rowDatas đã chuẩn hóa
 */
export const fetchPriceServices = async (params = {}) => {
  try {
    const res = await getPriceServices(params);
    const data =
      res?.data?.data?.rowDatas || res?.data?.rowDatas || res?.data || [];
    return data.map((item) => ({
      id: item.id,
      remedies: item.remedies,
      name: item.name,
      partTypeName: item.partTypeName,
      laborCost: Number(item.laborCost || 0),
      price: Number(item.price || 0),
      description: item.description,
      effectiveDate: item.effectiveDate,
    }));
  } catch (err) {
    console.error("❌ fetchPriceServices error:", err);
    return [];
  }
};

/**
 * 🔹 Lấy laborCost theo remedies ("REPAIR" hoặc "REPLACE")
 * - Dùng cache để tối ưu
 * - Lọc phần tử mới nhất theo effectiveDate nếu có nhiều bản ghi
 * @param {('REPAIR'|'REPLACE')} remedies
 * @returns {Promise<number>} laborCost hoặc 0 nếu không có
 */
export const getLaborCostByRemediesService = async (remedies) => {
  if (!remedies) return 0;

  // Nếu đã cache thì trả về luôn
  if (laborCostCache.has(remedies)) return laborCostCache.get(remedies);

  try {
    const res = await getPriceServices({ page: 1, pageSize: 50, remedies });
    const rows =
      res?.data?.data?.rowDatas || res?.data?.rowDatas || res?.data || [];

    const filtered = rows.filter((r) => r.remedies === remedies);
    if (filtered.length === 0) {
      laborCostCache.set(remedies, 0);
      return 0;
    }

    // Lấy bản mới nhất theo effectiveDate
    const latest = [...filtered].sort(
      (a, b) =>
        new Date(b.effectiveDate).getTime() -
        new Date(a.effectiveDate).getTime()
    )[0];

    const cost = Number(latest?.laborCost || 0);
    laborCostCache.set(remedies, cost);
    return cost;
  } catch (err) {
    console.error("❌ getLaborCostByRemediesService error:", err);
    return 0;
  }
};

/**
 * 🔄 Xóa cache nếu cần refresh lại dữ liệu
 */
export const clearLaborCostCache = () => laborCostCache.clear();
