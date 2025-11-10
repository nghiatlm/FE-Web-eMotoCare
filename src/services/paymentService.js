import { createPaymentLink } from "../api/paymentApi";

export const createPaymentLinkService = async (payload) => {
  try {
    const res = await createPaymentLink(payload);
    return res.data;
  } catch (error) {
    console.error("Lỗi tạo payment link:", error);
    throw error;
  }
};
