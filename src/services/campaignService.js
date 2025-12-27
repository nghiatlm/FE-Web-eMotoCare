import { getCampaigns } from "../api/campaignsApi";

export const getCampaignsService = async (params = {}) => {
  try {
    const res = await getCampaigns(params);
    
    let campaigns = [];
    
    if (res?.data?.data?.rowDatas && Array.isArray(res.data.data.rowDatas)) {
      campaigns = res.data.data.rowDatas;
    }
    else if (res?.data?.rowDatas && Array.isArray(res.data.rowDatas)) {
      campaigns = res.data.rowDatas;
    }
    else if (res?.data?.data && Array.isArray(res.data.data)) {
      campaigns = res.data.data;
    }
    else if (res?.data && Array.isArray(res.data)) {
      campaigns = res.data;
    }
    else if (Array.isArray(res)) {
      campaigns = res;
    }
    else if (res?.data && typeof res.data === 'object' && !Array.isArray(res.data) && res.data.id) {
      campaigns = [res.data];
    }
    
    return campaigns.map((campaign) => ({
      ...campaign,
      id: campaign.id || campaign.code,
      type: campaign.type || campaign.programType,
    }));
  } catch (error) {
    throw error;
  }
};

