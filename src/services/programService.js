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
        var res = await getProgramById(id);
        if (res && res.data) {
            return res.data;
        } else {
            return res?.data?.message || "No data found";
        }
    } catch (error) {
        console.error("Error fetching program details:", error);
    }
}