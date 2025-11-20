import { useState } from "react";
import { message, Card } from "antd";
import { useNavigate } from "react-router-dom";
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
    <div className="p-4">
      <Card title='Tạo lịch hẹn mới'>
        <BookingForm onSubmit={handleSubmit} loading={loading} />
      </Card>
    </div>
  );
};

export default CreateBooking;
