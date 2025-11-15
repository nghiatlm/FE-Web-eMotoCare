import {
  createEVCheck,
  updateEVCheck,
  getEVCheckById,
  getEVCheckDetails,
  getEVCheckDetailById,
  updateEVCheckDetail,
  createEVCheckDetail,
  getEVCheckByAppointmentId,
} from "../api/evcheck";

// ============== EV CHECK ==============
export const createEVCheckService = async (payload) => {
  const { data } = await createEVCheck(payload);
  return data?.data;
};

export const updateEVCheckService = async (id, payload) => {
  const { data } = await updateEVCheck(id, payload);
  return data?.data;
};

export const fetchEVCheckByAppointmentService = async (appointmentId) => {
  const { data } = await getEVCheckByAppointmentId(appointmentId);
  console.log("🐞 [fetchEVCheckByAppointmentService] API response DATA:", data);

  const evCheckList = data?.rowDatas;

  if (Array.isArray(evCheckList) && evCheckList.length > 0) {
    return evCheckList[0];
  }

  return undefined;
};

// ============== DETAIL ==============

/**
 * Lấy danh sách EV Check Details theo evCheckId
 * Thử gọi GET /v1/evchecks/{id} trước, nếu fail thì fallback sang GET /v1/ev-check-details
 */
export const fetchEVCheckDetailsServiceRe = async (checkId) => {
  try {
    // OPTION 1: Lấy từ EVCheck cha (endpoint /v1/evchecks/{id})
    console.log("🔍 Fetching EVCheck details from /v1/evchecks/{id}...");
    const { data } = await getEVCheckById(checkId);

    console.log(
      "✅ fetchEVCheckDetailsService (from EVCheck) RAW DATA:",
      JSON.stringify(data, null, 2)
    );

    let evCheckDetails = [];

    // Xử lý nested evCheckDetails từ EVCheck object
    if (data?.data?.evCheckDetails && Array.isArray(data.data.evCheckDetails)) {
      evCheckDetails = data.data.evCheckDetails;
    } else if (Array.isArray(data?.evCheckDetails)) {
      evCheckDetails = data.evCheckDetails;
    }

    // Lọc bỏ null/undefined
    evCheckDetails = evCheckDetails.filter((item) => item != null);

    console.log("✅ Parsed evCheckDetails:", evCheckDetails);
    console.log("✅ Total items:", evCheckDetails.length);

    return {
      odometer: data?.data?.odometer || data?.odometer || 0,
      evCheckDetails: evCheckDetails,
    };
  } catch (error) {
    console.error("❌ fetchEVCheckDetailsService ERROR:", error);

    // FALLBACK: Thử gọi API list details với filter eVCheckId
    try {
      console.log(
        "🔄 Fallback: Trying GET /v1/ev-check-details with filter..."
      );
      const { data } = await getEVCheckDetails({
        eVCheckId: checkId,
        pageSize: 100,
      });

      console.log("✅ Fallback response:", JSON.stringify(data, null, 2));

      let evCheckDetails = [];

      // Xử lý response từ API list
      if (data?.data?.rowDatas && Array.isArray(data.data.rowDatas)) {
        evCheckDetails = data.data.rowDatas;
      } else if (Array.isArray(data?.rowDatas)) {
        evCheckDetails = data.rowDatas;
      } else if (Array.isArray(data?.data)) {
        evCheckDetails = data.data;
      } else if (Array.isArray(data)) {
        evCheckDetails = data;
      }

      evCheckDetails = evCheckDetails.filter((item) => item != null);

      console.log("✅ Fallback parsed evCheckDetails:", evCheckDetails);

      return {
        odometer: 0,
        evCheckDetails: evCheckDetails,
      };
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError);
      throw error; // Throw original error
    }
  }
};

export const fetchEVCheckDetailsServiceMain = async (checkId) => {
  const { data } = await getEVCheckDetails({ params: { eVCheckId: checkId } });
  console.log("fetchEVCheckDetailsService RAW DATA:", data);

  const rowDatas = data?.data?.rowDatas || data?.rowDatas || [];

  // Lấy odometer từ EVCheck cha (nếu API trả kèm)
  // Giả sử API trả kèm thông tin EVCheck: data?.odometer
  const odometer = data?.odometer || data?.data?.odometer || "";

  // Trả về object giống như GET /evchecks/{id}
  return {
    odometer,
    evCheckDetails: rowDatas, // ← quan trọng
  };
};

export const fetchEVCheckDetailByIdService = async (id) => {
  const { data } = await getEVCheckDetailById(id);
  return data?.data;
};

export const updateEVCheckDetailService = async (id, payload) => {
  const { data } = await updateEVCheckDetail(id, payload);
  return data?.data;
};

export const createEVCheckDetailService = async (payload) => {
  const { data } = await createEVCheckDetail(payload);
  return data?.data;
};
