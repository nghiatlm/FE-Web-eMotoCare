import { useState } from "react";
import { message, Card } from "antd";
import BookingForm from "../../../components/service-staff/BookingForm";
import { createAppointmentService } from "../../../services/appointmentsService";

const CreateBooking = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await createAppointmentService(values);
      message.success("Tạo lịch hẹn thành công!");
    } catch (error) {
      message.error("Tạo lịch hẹn thất bại!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title='Tạo lịch hẹn mới'>
      <BookingForm onSubmit={handleSubmit} loading={loading} />
    </Card>
  );
};

export default CreateBooking;
