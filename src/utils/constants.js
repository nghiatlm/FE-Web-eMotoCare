import { colorBase } from "../styles/colorBase";

// --- STATUS ---
export const STATUS_MAP = {
  pending: "Đang chờ xử lý",
  accepted: "Đã xác nhận",
  checkedin: "Đã check-in",
  inprogress: "Đang thực hiện",
  completed: "Hoàn thành",
  canceled: "Đã hủy",
};

export const STATUS_COLORS = {
  pending: colorBase.warning,
  accepted: colorBase.info,
  checkedin: "#a855f7", // tím nhạt
  inprogress: "#06b6d4", // cyan
  completed: colorBase.success,
  canceled: colorBase.danger,
};

// --- SERVICE TYPE ---
export const SERVICE_TYPE_MAP = {
  maintenance: "Bảo dưỡng",
  repair: "Sửa chữa",
  warranty: "Bảo hành",
  recall: "Triệu hồi",
};

export const SERVICE_TYPE_COLORS = {
  maintenance: "geekblue",
  repair: "volcano",
  warranty: "green",
  recall: "magenta",
};
