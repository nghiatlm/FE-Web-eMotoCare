import { useState, useEffect } from "react";

export const useBookings = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
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
  useEffect(() => {
    setLoading(true);
    // fake fetch
    setTimeout(() => {
      const fake = [
        {
          id: "B001",
          code: "BK-2025-001",
          customerName: "Nguyen Van A",
          phone: "0901234567",
          status: "Pending",
          vehicleType: "Evo 200Lite",
          serviceType: "Bảo dưỡng định kỳ",
          time: "09:00 14/10/2025",
          qrCode: "BK-2025-001",
          note: "Khách yêu cầu kiểm tra pin",
          details: [
            { item: "Tay phanh", note: "Bôi trơn", result: "OK" },
            { item: "Pin", note: "Yếu", result: "Replace soon" },
          ],
        },
        {
          id: "B002",
          code: "BK-2025-002",
          customerName: "Tran Thi B",
          phone: "0912345678",
          status: "Confirmed",
          vehicleType: "EvoGrand Line",
          serviceType: "Sửa chữa",
          time: "10:30 14/10/2025",
          qrCode: "BK-2025-002",
          note: "",
          details: [{ item: "Đèn", note: "Thay bóng", result: "Done" }],
        },
      ];
      setData(fake);
      setLoading(false);
    }, 250);
  }, []);

  const updateStatus = (id, newStatus, selectedTechnician = null) => {
    setData((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: newStatus,
              technician: selectedTechnician || b.technician || null,
            }
          : b
      )
    );
  };

  return { data, loading, updateStatus, technicians };
};
