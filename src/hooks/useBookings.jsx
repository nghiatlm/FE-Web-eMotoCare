import { useState, useEffect } from "react";

/**
 * Hook quản lý dữ liệu và flow trạng thái cho Booking (Service Staff)
 */
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

  // Định nghĩa flow chuyển trạng thái hợp lệ
  const STATUS_FLOW = {
    Pending: ["Accepted", "Cancelled"], // Chờ xác nhận -> có thể nhận hoặc huỷ
    Accepted: ["InProgress"], // Đã nhận -> chuyển sang đang làm
    InProgress: ["Completed"], // Đang làm -> hoàn tất
    Completed: [], // Xong rồi, hết flow
    Cancelled: [], // Bị huỷ, dừng flow
  };

  // Kiểm tra trạng thái có thể cập nhật hợp lệ không
  const canUpdateStatus = (booking, newStatus) => {
    const nextList = STATUS_FLOW[booking.status] || [];
    return nextList.includes(newStatus);
  };

  // Mock dữ liệu ban đầu
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const fakeData = [
        {
          id: "B001",
          code: "BK-2025-001",
          customerName: "Nguyễn Văn A",
          phone: "0901234567",
          status: "Pending",
          vehicleType: "Evo 200Lite",
          serviceType: "Bảo dưỡng",
          time: "09:00 14/10/2025",
          qrCode: "BK-2025-001",
          note: "Kiểm tra pin, phanh trước kêu nhẹ",
          details: [
            { item: "Tay phanh", note: "Bôi trơn", result: "OK" },
            { item: "Pin", note: "Yếu", result: "Replace soon" },
          ],
        },
        {
          id: "B002",
          code: "BK-2025-002",
          customerName: "Trần Thị B",
          phone: "0912345678",
          status: "Accepted",
          vehicleType: "Evo GrandLine",
          serviceType: "Sửa chữa",
          time: "10:30 14/10/2025",
          qrCode: "BK-2025-002",
          note: "Đèn xe không sáng",
          details: [
            {
              issue: "Đèn pha",
              part: "Bóng đèn LED",
              price: 250000,
              done: false,
            },
          ],
        },
        {
          id: "B003",
          code: "BK-2025-003",
          customerName: "Phạm Văn C",
          phone: "0934567890",
          status: "Accepted",
          vehicleType: "Klara S",
          serviceType: "Bảo hành",
          time: "11:00 14/10/2025",
          qrCode: "BK-2025-003",
          note: "Bảo hành pin mới thay",
          details: [
            { item: "Pin", warranty: "12 tháng", result: "Đang kiểm tra" },
          ],
        },
        {
          id: "B004",
          code: "BK-2025-004",
          customerName: "Nguyễn Văn D",
          phone: "0909876543",
          status: "InProgress",
          vehicleType: "Klara S",
          serviceType: "Recall",
          time: "11:00 14/10/2025",
          qrCode: "BK-2025-004",
          note: "Bảo hành pin mới thay",
          details: [
            { item: "Pin", warranty: "12 tháng", result: "Đang kiểm tra" },
          ],
        },
      ];
      setData(fakeData);
      setLoading(false);
    }, 300);
  }, []);

  // Cập nhật trạng thái booking (theo flow)
  const updateStatus = (id, newStatus, selectedTechnician = null) => {
    setData((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;

        // Kiểm tra trạng thái hợp lệ

        return {
          ...b,
          status: newStatus,
          technician: selectedTechnician || b.technician || null,
        };
      })
    );
  };

  return { data, loading, updateStatus, canUpdateStatus, technicians };
};
