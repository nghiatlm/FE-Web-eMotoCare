import { useState } from "react";
import { message, Card, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import BookingForm from "../../components/service-staff/BookingForm";
import { createAppointmentService } from "../../services/appointmentService";

const CreateBooking = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await createAppointmentService(values);
      message.success("Tạo lịch hẹn thành công!");
      // ✅ Redirect về danh sách sau khi tạo thành công
      setTimeout(() => {
        navigate("/staff/booking/list");
      }, 1000);
    } catch (error) {
      console.error("Lỗi tạo lịch hẹn:", error);
      message.error(error?.response?.data?.message || "Tạo lịch hẹn thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: "900px", margin: "0 auto" }}>
      <Card
        title={
          <Space>
            <Calendar size={20} style={{ color: "#ff4d4f" }} />
            <span>Tạo lịch hẹn mới</span>
          </Space>
        }
        style={{ borderRadius: 8 }}
        headStyle={{ borderBottom: "1px solid #f0f0f0", padding: "16px 24px" }}>
        <BookingForm onSubmit={handleSubmit} loading={loading} />
      </Card>
    </div>
  );
};

export default CreateBooking;
