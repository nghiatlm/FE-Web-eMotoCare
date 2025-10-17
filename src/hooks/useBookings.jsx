import { useState, useEffect } from "react";

export const useBookings = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Danh sách kỹ thuật viên demo
  const technicians = [
    {
      id: 1,
      name: "Nguyễn Văn A",
      phone: "0901234567",
      experience: "5 năm",
      specialty: "Xe điện VinFast",
    },
    {
      id: 2,
      name: "Trần Văn B",
      phone: "0912345678",
      experience: "3 năm",
      specialty: "Bảo trì động cơ",
    },
    {
      id: 3,
      name: "Phạm Văn C",
      phone: "0934567890",
      experience: "2 năm",
      specialty: "Điện – Pin",
    },
  ];

  // Flow trạng thái hợp lệ - CHUẨN HÓA VỀ UPPERCASE
  const STATUS_FLOW = {
    PENDING: ["APPROVED", "CANCELED"],
    APPROVED: ["CHECKED_IN", "CANCELED"], // APPROVED chỉ chuyển sang CHECKED_IN
    CHECKED_IN: ["QUOTE_APPROVED"], // Giả định flow theo các nút hành động
    QUOTE_APPROVED: ["REPAIR_COMPLETED"],
    REPAIR_COMPLETED: ["COMPLETED"],
    COMPLETED: [],
    CANCELED: [],
  };

  // Kiểm tra trạng thái hợp lệ (Nếu cần dùng)
  const canUpdateStatus = (booking, newStatus) => {
    const currentStatus = booking.status?.toUpperCase();
    const nextList = STATUS_FLOW[currentStatus] || [];
    return nextList.includes(newStatus.toUpperCase());
  };

  // Giả lập fetch API
  const fetchBookings = async () => {
    setLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 600));

      // DỮ LIỆU MOCK ĐÃ ĐƯỢC CHUẨN HÓA VÀ SỬA LỖI LOGIC
      const mockData = [
        {
          id: "B001",
          code: "BK-2025-001",
          customerName: "Nguyễn Văn A",
          phone: "0901234567",
          status: "PENDING", // Trạng thái PENDING
          vehicleType: "Evo 200Lite",
          serviceType: "Maintenance",
          time: "09:00 14/10/2025",
          note: "Định kỳ 10.000km",
          qrCode: "BK-2025-001",
          // Đã xóa technician: technicians[0] để booking PENDING chưa có kỹ thuật viên
          details: [
            {
              item: "Phanh trước",
              check: "OK",
              result: "Bôi trơn",
              stage: "Cơ bản",
            },
            {
              item: "Phanh sau",
              check: "OK",
              result: "Không cần thay",
              stage: "Cơ bản",
            },
            {
              item: "Pin",
              check: "Yếu",
              result: "Đề xuất thay mới",
              stage: "Điện",
            },
            {
              item: "Lốp",
              check: "Mòn 60%",
              result: "Theo dõi",
              stage: "Cơ bản",
            },
            {
              item: "Đèn pha",
              check: "Sáng yếu",
              result: "Thay bóng LED",
              stage: "Điện",
            },
          ],
        },
        {
          id: "B002",
          code: "BK-2025-002",
          customerName: "Trần Thị B",
          phone: "0912345678",
          status: "APPROVED", // Đã duyệt, nhưng thiếu technician -> Sẽ hiển thị form Chọn Kỹ thuật viên
          vehicleType: "Evo GrandLine",
          serviceType: "Maintenance",
          time: "10:30 14/10/2025",
          note: "Đèn xe không sáng",
          qrCode: "BK-2025-002",
          // technician: technicians[1], // Giữ trống để minh họa trạng thái chờ gán KTV sau khi duyệt
          details: [
            {
              item: "Đèn pha",
              part: "Bóng LED",
              action: "Thay mới",
              price: 250000,
            },
          ],
        },
        {
          id: "B003",
          code: "BK-2025-003",
          customerName: "Phạm Văn C",
          phone: "0934567890",
          status: "CHECKED_IN", // Giả định đã CHECKED_IN
          vehicleType: "Klara S",
          serviceType: "Warranty",
          time: "11:00 14/10/2025",
          note: "Bảo hành pin mới thay",
          qrCode: "BK-2025-003",
          technician: technicians[2], // Đã có KTV
          details: [
            { item: "Pin", warranty: "12 tháng", result: "Đang kiểm tra" },
            {
              item: "Bộ sạc",
              warranty: "6 tháng",
              result: "Hoạt động bình thường",
            },
          ],
        },
        {
          id: "B004",
          code: "BK-2025-004",
          customerName: "Nguyễn Văn D",
          phone: "0909876543",
          status: "REPAIR_COMPLETED", // Đã sửa chữa xong
          vehicleType: "Klara S",
          serviceType: "Recall",
          time: "13:00 14/10/2025",
          note: "Thay cell pin theo chương trình recall",
          qrCode: "BK-2025-004",
          technician: technicians[1], // Đã có KTV
          details: [
            { item: "Cell pin module 1", status: "Đang thay" },
            { item: "Cell pin module 2", status: "Đang thay" },
            { item: "Bo mạch BMS", status: "Kiểm tra OK" },
          ],
        },
      ];

      setData(mockData);
    } catch (error) {
      console.error("Lỗi fetch booking:", error);
    } finally {
      setLoading(false);
    }
  };

  // Gọi fetch khi load trang
  useEffect(() => {
    fetchBookings();
  }, []);

  // Cập nhật trạng thái booking
  const updateStatus = (id, newStatus, selectedTechnician = null) => {
    // Đảm bảo trạng thái luôn được chuẩn hóa thành UPPERCASE
    const normalizedNewStatus = newStatus.toUpperCase();

    setData((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: normalizedNewStatus,
              // Gán KTV nếu có hoặc giữ nguyên KTV cũ
              technician: selectedTechnician || b.technician || null,
            }
          : b
      )
    );
  };

  return { data, loading, updateStatus, canUpdateStatus, technicians };
};
