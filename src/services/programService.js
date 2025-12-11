import { getAllPrograms, getProgramById } from "../api/program";

export const getPrograms = async (params) => {
    try {
        var res = await getAllPrograms(params);
        if (res && res.data) {
            return res?.data?.rowDatas;
        } else {
            return res?.data?.message || "No data found";
        }
    } catch (error) {
        console.error("Error fetching programs:", error);
    }
}

export const getProgramDetails = async (id) => {
  try {
    const res = await getProgramById(id);
    // Axios interceptor returns response.data, but backend nests data inside "data"
    if (res?.data) return res.data;
    if (res?.data?.data) return res.data.data;
    if (res?.data?.rowDatas) return res.data.rowDatas;
    return res;
  } catch (error) {
    console.error("Error fetching program details:", error);
    throw error;
  }
};