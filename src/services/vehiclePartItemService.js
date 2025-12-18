import { getVehiclePartItems } from "../api/vehiclePartItemApi";

export const fetchVehiclePartItems = async (params) => {
  try {
    const response = await getVehiclePartItems(params);
    
    // ✅ Debug: Log toàn bộ response để kiểm tra structure
    console.log("🔍 fetchVehiclePartItems - Full response (đã là data):", response);
    
    // ✅ Lấy rowDatas từ nhiều cấu trúc response có thể có
    // Vì interceptor đã trả về response.data, nên response ở đây là:
    // { statusCode, success, message, data: { rowDatas: [...] } }
    const rowDatas = 
      response?.data?.rowDatas ||  // ✅ Structure: response.data.rowDatas
      response?.rowDatas ||        // Fallback: response.rowDatas
      [];
    
    console.log("🔍 fetchVehiclePartItems - rowDatas:", rowDatas);
    console.log("🔍 fetchVehiclePartItems - First item:", rowDatas[0]);
    if (rowDatas[0]) {
      console.log("🔍 fetchVehiclePartItems - First item partItem:", rowDatas[0].partItem);
      console.log("🔍 fetchVehiclePartItems - First item partItem.part:", rowDatas[0].partItem?.part);
      console.log("🔍 fetchVehiclePartItems - First item partItem.part.name:", rowDatas[0].partItem?.part?.name);
    }
    
    return rowDatas;
  } catch (error) {
    console.error("Error fetching vehicle part items:", error);
    throw error;
  }
};
