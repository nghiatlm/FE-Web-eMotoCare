import { useState } from "react";
import { Card, Space } from "antd";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import BookingForm from "../../components/service-staff/BookingForm";
import { createAppointmentService, approveAppointmentService, checkinAppointmentService } from "../../services/appointmentService";
import { getAppointmentById } from "../../api/appointmentsApi";

const CreateBooking = () => {
  const [loading, setLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      // ✅ 1. Tạo appointment
      const newAppointment = await createAppointmentService(values);
      const appointmentId = newAppointment?.id || newAppointment?.data?.id;
      
      if (!appointmentId) {
        throw new Error("Không nhận được ID của lịch hẹn sau khi tạo");
      }

      // ✅ 2. FE phải gọi approve để tạo QR code
      try {
        await approveAppointmentService(appointmentId);
        
        // ✅ 3. Sau khi approve thành công, lấy thông tin appointment để checkin
        const appointmentRes = await getAppointmentById(appointmentId);
        const appointment = appointmentRes?.data || appointmentRes;
        const code = appointment?.code || appointment?.checkinCode;
        const checkinQRCode = appointment?.checkinQRCode;
        
        if (code && checkinQRCode) {
          // ✅ 4. Tự động checkin ngay sau khi approve
          await checkinAppointmentService(appointmentId, code, checkinQRCode);
          toast.success("Tạo lịch hẹn và check-in thành công!");
        } else {
          toast.success("Tạo lịch hẹn và mã QR check-in thành công!");
        }
      } catch (approveError) {
        console.error("Lỗi approve/checkin appointment:", approveError);
        toast.warning("Tạo lịch hẹn thành công nhưng chưa tạo được QR code. Vui lòng duyệt lại sau.");
      }

      // ✅ Reset form sau khi tạo lịch thành công
      setResetKey(prev => prev + 1);
      
      // ✅ Redirect đến detail page để xem QR code ngay
      if (appointmentId) {
        setTimeout(() => {
          navigate(`/staff/booking/${appointmentId}`);
        }, 500);
      } else {
        setTimeout(() => {
          navigate("/staff/booking/list");
        }, 1000);
      }
    } catch (error) {
      console.error("Lỗi tạo lịch hẹn:", error);
      toast.error((error?.response?.data?.message || error?.data?.message || error?.message || "Tạo lịch hẹn thất bại!"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, width: "100%", margin: "0 auto" }}>
      <Card
        title={
          <Space>
            <Calendar size={20} style={{ color: "#ff4d4f" }} />
            <span>Tạo lịch hẹn mới</span>
          </Space>
        }
        style={{ borderRadius: 8 }}
        headStyle={{ borderBottom: "1px solid #f0f0f0", padding: "16px 24px" }}>
        <BookingForm onSubmit={handleSubmit} loading={loading} resetKey={resetKey} />
      </Card>
    </div>
  );
};

export default CreateBooking;
