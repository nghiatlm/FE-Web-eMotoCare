import { getVehicleStages } from "../api/vehicleStageApi";

// Lấy danh sách mốc bảo dưỡng theo vehicleId
export const getVehicleStagesService = async (vehicleId, params = {}) => {
  try {
    const response = await getVehicleStages({ vehicleId, ...params });
    
    // ✅ Xử lý response structure
    const rowDatas =
      response?.data?.rowDatas || // Structure: { data: { rowDatas: [...] } }
      response?.rowDatas ||        // Fallback: { rowDatas: [...] }
      response?.data ||            // Fallback: { data: [...] }
      [];

    return rowDatas;
  } catch (error) {
    console.error("Error fetching vehicle stages:", error);
    throw error;
  }
};

