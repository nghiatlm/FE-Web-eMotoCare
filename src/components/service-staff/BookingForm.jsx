import { useEffect, useState } from "react";
import { Form, InputNumber, DatePicker, Button, Select } from "antd";

const BookingForm = ({ onSubmit, loading }) => {
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [centers, setCenters] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Load danh sách từ API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cusRes, cenRes, vehRes] = await Promise.all([
          getCustomers(),
          getServiceCenters(),
          getVehicleStages(),
        ]);
        setCustomers(cusRes.data || []);
        setCenters(cenRes.data || []);
        setVehicles(vehRes.data || []);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      }
    };
    fetchData();
  }, []);

  const handleFinish = (values) => {
    const payload = {
      ...values,
      appointmentDate: values.appointmentDate.toISOString(),
      estimatedCost: values.estimatedCost || 0,
      actualCost: 0,
      status: "PENDING",
      type: "MAINTENACE_TYPE",
    };
    onSubmit(payload);
  };

  return (
    <Form layout='vertical' form={form} onFinish={handleFinish}>
      {/* Khách hàng */}
      <Form.Item
        label='Khách hàng'
        name='customerId'
        rules={[{ required: true, message: "Chọn khách hàng!" }]}>
        <Select placeholder='Chọn khách hàng'>
          {customers.map((c) => (
            <Select.Option key={c.id} value={c.id}>
              {c.name || c.fullName}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* Trung tâm dịch vụ */}
      <Form.Item
        label='Trung tâm dịch vụ'
        name='serviceCenterId'
        rules={[{ required: true, message: "Chọn trung tâm!" }]}>
        <Select placeholder='Chọn trung tâm dịch vụ'>
          {centers.map((s) => (
            <Select.Option key={s.id} value={s.id}>
              {s.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* Xe / VehicleStage */}
      <Form.Item
        label='Xe cần bảo dưỡng'
        name='vehicleStageId'
        rules={[{ required: true, message: "Chọn xe cần bảo dưỡng!" }]}>
        <Select placeholder='Chọn xe'>
          {vehicles.map((v) => (
            <Select.Option key={v.id} value={v.id}>
              {v.licensePlate || v.modelName}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* Ngày hẹn */}
      <Form.Item
        label='Ngày hẹn'
        name='appointmentDate'
        rules={[{ required: true, message: "Chọn ngày hẹn!" }]}>
        <DatePicker />
      </Form.Item>

      {/* Khung giờ */}
      <Form.Item
        label='Khung giờ'
        name='timeSlot'
        rules={[{ required: true, message: "Chọn khung giờ!" }]}>
        <Select placeholder='Chọn khung giờ'>
          {[
            "08:00",
            "09:00",
            "10:00",
            "11:00",
            "13:00",
            "14:00",
            "15:00",
            "16:00",
          ].map((time) => (
            <Select.Option key={time} value={time}>
              {time}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* Chi phí dự kiến */}
      <Form.Item label='Chi phí dự kiến' name='estimatedCost'>
        <InputNumber
          min={0}
          style={{ width: "100%" }}
          placeholder='Nhập chi phí dự kiến (nếu có)'
        />
      </Form.Item>

      <Button type='primary' htmlType='submit' loading={loading}>
        Tạo lịch hẹn
      </Button>
    </Form>
  );
};

export default BookingForm;
