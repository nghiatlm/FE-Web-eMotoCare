// src/constants/statusConstants.js
import { colorBase } from "../styles/colorBase";

// --- STATUS ---
export const STATUS_MAP = {
  PENDING: "Chờ xử lý",
  APPROVED: "Đã phê duyệt",
  CANCELED: "Đã hủy",
  CHECKED_IN: "Đã check-in",
  QUOTE_APPROVED: "Báo giá được duyệt",
  REPAIR_COMPLETED: "Hoàn tất sửa chữa",
  COMPLETED: "Đã hoàn thành",
  REJECTED: "Bị từ chối",
  ASSIGNED: "Đã phân công",
  IN_SERVICE: "Đang thực hiện",
};

// 🎨 Màu trạng thái (theo flow bạn gửi)
export const STATUS_COLORS = {
  PENDING: colorBase.warning,
  APPROVED: colorBase.info,
  CHECKED_IN: "#a855f7",
  INPROGRESS: "#06b6d4",
  QUOTE_APPROVED: "#06b6d4",
  REPAIR_COMPLETED: "#10b981",
  COMPLETED: colorBase.success,
  CANCELED: colorBase.danger,
  IN_SERVICE: "#f59e0b",
};

// --- SERVICE TYPE ---
export const SERVICE_TYPE_MAP = {
  MAINTENANCE_TYPE: "Bảo dưỡng",
  REPAIR_TYPE: "Sửa chữa",
  WARRANTY_TYPE: "Bảo hành",
  RECALL_TYPE: "Triệu hồi",
  RMA_TYPE: "RMA",
};

export const SERVICE_TYPE_COLORS = {
  MAINTENANCE_TYPE: "geekblue",
  REPAIR_TYPE: "volcano",
  WARRANTY_TYPE: "green",
  RECALL_TYPE: "magenta",
  RMA_TYPE: "gold",
};
