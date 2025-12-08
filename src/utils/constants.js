// src/constants/statusConstants.js
import { colorBase } from "../styles/colorBase";

// --- STATUS ---
export const STATUS_MAP = {
  PENDING: "Chờ xử lý",
  APPROVED: "Đã phê duyệt",
  PROCESSING: "Đang xử lý",
  APPOINTMENT_BOOKED: "Đã đặt lịch",
  CANCELED: "Đã hủy",
  CHECKED_IN: "Đã check-in",
  QUOTE_APPROVED: "Đã xác nhận",
  REPAIR_COMPLETED: "Hoàn tất sửa chữa",
  COMPLETED: "Đã hoàn thành",
  REJECTED: "Bị từ chối",
  ASSIGNED: "Đã phân công",
  // IN_SERVICE: "Đang thực hiện",
  IN_PROGRESS: "Đang sửa chữa",
};

// 🎨 Màu trạng thái (theo flow bạn gửi)
export const STATUS_COLORS = {
  PENDING: colorBase.warning,
  APPROVED: colorBase.info,
  PROCESSING: "processing", // Màu xanh dương (processing) của Ant Design
  APPOINTMENT_BOOKED: "cyan", // Màu xanh lơ cho trạng thái đã đặt lịch
  CHECKED_IN: "#a855f7",
  IN_PROGRESS: "#06b6d4",
  QUOTE_APPROVED: "#06b6d4",
  REPAIR_COMPLETED: "#10b981",
  COMPLETED: colorBase.success,
  CANCELED: colorBase.danger,
  REJECTED: colorBase.danger,
  // IN_SERVICE: "#f59e0b",
};

// --- SERVICE TYPE ---
export const SERVICE_TYPE_MAP = {
  MAINTENANCE_TYPE: "Bảo dưỡng",
  REPAIR_TYPE: "Sửa chữa",
  WARRANTY_TYPE: "Bảo hành",
  RECALL_TYPE: "Triệu hồi",
  RMA_TYPE: "RMA",
  CAMPAIGN_TYPE: "Chiến dịch",
};

export const SERVICE_TYPE_COLORS = {
  MAINTENANCE_TYPE: "geekblue",
  REPAIR_TYPE: "volcano",
  WARRANTY_TYPE: "green",
  RECALL_TYPE: "magenta",
  RMA_TYPE: "gold",
  CAMPAIGN_TYPE: "purple",
};

// --- UI COLORS ---
export const UI_COLORS = {
  PRIMARY_RED: "#ff4d4f",          // Màu đỏ chính cho icon, button
  PRIMARY_RED_DARK: "#d4380d",     // Màu đỏ đậm cho title, heading
  TEXT_PRIMARY: "#262626",          // Màu text chính
  TEXT_SECONDARY: "#8c8c8c",        // Màu text phụ
  BORDER_LIGHT: "#f0f0f0",          // Màu border nhẹ
  TAG_RED: "red",                   // Màu tag đỏ (Ant Design)
};
