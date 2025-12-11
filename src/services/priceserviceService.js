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
 * 🔹 Lấy giá dịch vụ hoặc phí gia công theo partTypeId và remedies
 * - Dùng cache để tối ưu
 * - Lọc phần tử mới nhất theo effectiveDate nếu có nhiều bản ghi
 * - Có thể lấy "price" (giá dịch vụ) hoặc "laborCost" (phí gia công)
 * @param {string} partTypeId - ID của loại phụ tùng
 * @param {('NONE'|'CLEAN'|'TUNE'|'REPAIR'|'REPLACE'|'WARRANTY')} remedies - Biện pháp sửa chữa
 * @param {string} field - Field cần lấy: "laborCost" (mặc định) hoặc "price"
 * @returns {Promise<number>} laborCost hoặc price hoặc 0 nếu không có
 */
export const getLaborCostByRemediesService = async (partTypeId, remedies, field = "laborCost") => {
  if (!remedies) return 0;
  if (!partTypeId) {
    console.warn("⚠️ getLaborCostByRemediesService: thiếu partTypeId, trả về 0");
    return 0;
  }

  // ✅ Tạo cache key từ partTypeId, remedies và field
  const cacheKey = `${partTypeId}_${remedies}_${field}`;
  if (laborCostCache.has(cacheKey)) return laborCostCache.get(cacheKey);

  try {
    // ✅ Gọi API với partTypeId và remedies
    console.log(`📞 [getLaborCostByRemediesService] Gọi API với partTypeId: ${partTypeId}, remedies: ${remedies}, field: ${field}`);
    const res = await getPriceServices({ 
      page: 1, 
      pageSize: 50, 
      partTypeId,
      remedies 
    });
    console.log(`📥 [getLaborCostByRemediesService] API Response:`, res);
    
    const rows =
      res?.data?.data?.rowDatas || res?.data?.rowDatas || res?.data || [];
    console.log(`📋 [getLaborCostByRemediesService] Tổng số rows: ${rows.length}`);

    // ✅ Filter theo cả partTypeId và remedies
    const filtered = rows.filter(
      (r) => r.partTypeId === partTypeId && r.remedies === remedies
    );
    console.log(`🔍 [getLaborCostByRemediesService] Sau khi filter: ${filtered.length} rows`);
    
    if (filtered.length === 0) {
      console.warn(`⚠️ [getLaborCostByRemediesService] Không tìm thấy price service cho partTypeId: ${partTypeId}, remedies: ${remedies}`);
      laborCostCache.set(cacheKey, 0);
      return 0;
    }

    // ✅ Lấy bản mới nhất theo effectiveDate
    const latest = [...filtered].sort(
      (a, b) =>
        new Date(b.effectiveDate || 0).getTime() -
        new Date(a.effectiveDate || 0).getTime()
    )[0];

    // ✅ Lấy giá trị theo field được chỉ định (mặc định là laborCost)
    const cost = Number(latest?.[field] || latest?.laborCost || latest?.price || 0);
    console.log(`✅ [getLaborCostByRemediesService] Đã lấy được ${field}: ${cost} từ price service:`, latest);
    laborCostCache.set(cacheKey, cost);
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
