import { getCampaigns } from "../api/campaignsApi";

// Lấy danh sách campaigns
export const getCampaignsService = async (params = {}) => {
  try {
    const res = await getCampaigns(params);
    const data = res?.data?.data || res?.data || res;
    
    // Trả về danh sách campaigns từ response
    // API response có thể có structure: { data: { rowDatas: [...] } } hoặc { rowDatas: [...] }
    const campaigns = data?.rowDatas || data?.data?.rowDatas || data || [];
    
    // ✅ Đảm bảo mỗi campaign có id (dùng id từ API, nếu không có thì dùng code)
    return campaigns.map((campaign) => ({
      ...campaign,
      id: campaign.id || campaign.code, // Ưu tiên id, nếu không có thì dùng code
    }));
  } catch (error) {
    console.error("Lỗi lấy danh sách campaigns:", error);
    throw error;
  }
};

