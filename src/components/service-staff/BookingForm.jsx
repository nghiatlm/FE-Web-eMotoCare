// src/components/service-staff/BookingForm.jsx
import { useEffect, useState } from "react";
import { Form, InputNumber, DatePicker, Button, Select, Input } from "antd";

import { getCustomersService } from "../../services/customerService";
import { getServiceCentersService } from "../../services/serivceCenterService";
import { getVehiclesByCustomerService } from "../../services/vehicleService";

const { Option } = Select;

// Map code slot -> label đẹp
const SLOT_LABEL_MAP = {
  H07_08: "07:00 - 08:00",
  H08_09: "08:00 - 09:00",
  H09_10: "09:00 - 10:00",
  H10_11: "10:00 - 11:00",
  H13_14: "13:00 - 14:00",
  H14_15: "14:00 - 15:00",
  H15_16: "15:00 - 16:00",
  H16_17: "16:00 - 17:00",
};

const DEFAULT_TYPE = "MAINTENANCE_TYPE";

const BookingForm = ({ onSubmit, loading = false, initialValues }) => {
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [centers, setCenters] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // 👉 danh sách slot khả dụng sau khi filter theo center + ngày
  const [availableSlots, setAvailableSlots] = useState([]);

  // ====== LOAD CUSTOMER + SERVICE CENTER ======
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [cusRes, cenRes] = await Promise.all([
          getCustomersService(),
          getServiceCentersService(),
        ]);

        setCustomers(Array.isArray(cusRes) ? cusRes : []);
        setCenters(Array.isArray(cenRes) ? cenRes : []);

        if (initialValues) {
          form.setFieldsValue(initialValues);

          // Nếu có sẵn customerId -> load xe luôn
          if (initialValues.customerId) {
            handleCustomerChange(initialValues.customerId, false);
          }

          // Nếu có sẵn center + date -> build slot luôn
          const centerId = initialValues.serviceCenterId;
          const date = initialValues.appointmentDate;
          if (centerId && date) {
            buildSlots(centerId, date);
          }
        }
      } catch (err) {
        console.error("Lỗi load dữ liệu BookingForm:", err);
      }
    };

    fetchInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== LOAD VEHICLES THEO CUSTOMER ======
  const handleCustomerChange = async (customerId, clearVehicle = true) => {
    try {
      setLoadingVehicles(true);

      if (clearVehicle) {
        form.setFieldsValue({ vehicleId: undefined });
      }
      if (!customerId) {
        setVehicles([]);
        return;
      }

      const res = await getVehiclesByCustomerService(customerId, {
        page: 1,
        pageSize: 50,
      });

      setVehicles(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Lỗi load xe theo khách:", err);
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  // ====== BUILD SLOT TỪ serviceCenterSlots ======
  const buildSlots = (serviceCenterId, dateObj) => {
    if (!serviceCenterId || !dateObj) {
      setAvailableSlots([]);
      form.setFieldsValue({ slotTime: undefined });
      return;
    }

    const center = centers.find((c) => c.id === serviceCenterId);
    if (!center || !Array.isArray(center.serviceCenterSlots)) {
      setAvailableSlots([]);
      form.setFieldsValue({ slotTime: undefined });
      return;
    }

    // DatePicker (antd v5) dùng dayjs -> dùng format YYYY-MM-DD để so với BE
    const dateStr = dateObj.format("YYYY-MM-DD");

    const slots = center.serviceCenterSlots.filter(
      (s) => s.isActive && s.date === dateStr
    );

    setAvailableSlots(slots);
    form.setFieldsValue({ slotTime: undefined });
  };

  // Khi đổi trung tâm
  const handleServiceCenterChange = (centerId) => {
    const date = form.getFieldValue("appointmentDate");
    buildSlots(centerId, date);
  };

  // Khi đổi ngày
  const handleDateChange = (date) => {
    const centerId = form.getFieldValue("serviceCenterId");
    buildSlots(centerId, date);
  };

  // ====== SUBMIT ======
  const handleFinish = (values) => {
    const appointmentDate = values.appointmentDate
      ? values.appointmentDate.format("YYYY-MM-DD") // ← CHỈ LẤY NGÀY
      : null;

    const payload = {
      serviceCenterId: values.serviceCenterId,
      customerId: values.customerId,
      vehicleStageId: values.vehicleStageId || null,
      vehicleId: values.vehicleId,
      slotTime: values.slotTime,
      campaignId: values.campaignId || null,
      appointmentDate, // ✅ dùng string local
      estimatedCost: values.estimatedCost || 0,
      actualCost: 0,
      status: "PENDING",
      type: values.type || DEFAULT_TYPE,
      note: values.note || "",
    };

    onSubmit?.(payload);
  };

  return (
    <Form
      layout='vertical'
      form={form}
      onFinish={handleFinish}
      initialValues={initialValues}>
      {/* KHÁCH HÀNG */}
      <Form.Item
        label='Khách hàng'
        name='customerId'
        rules={[{ required: true, message: "Chọn khách hàng!" }]}>
        <Select
          placeholder='Chọn khách hàng'
          showSearch
          optionFilterProp='children'
          onChange={(val) => handleCustomerChange(val, true)}>
          {customers.map((c) => (
            <Option key={c.id} value={c.id}>
              {c.customerCode
                ? `${c.customerCode} - ${c.firstName} ${c.lastName}`
                : `${c.firstName || ""} ${c.lastName || ""}`}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* XE CỦA KHÁCH */}
      <Form.Item
        label='Xe'
        name='vehicleId'
        rules={[{ required: true, message: "Chọn xe!" }]}>
        <Select
          placeholder='Chọn xe'
          loading={loadingVehicles}
          disabled={!form.getFieldValue("customerId")}>
          {vehicles.map((v) => (
            <Option key={v.id} value={v.id}>
              {`${v.modelName || "Xe"} - ${v.chassisNumber || ""}`}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* TRUNG TÂM DỊCH VỤ */}
      <Form.Item
        label='Trung tâm dịch vụ'
        name='serviceCenterId'
        rules={[{ required: true, message: "Chọn trung tâm!" }]}>
        <Select
          placeholder='Chọn trung tâm'
          onChange={handleServiceCenterChange}>
          {centers.map((s) => (
            <Option key={s.id} value={s.id}>
              {s.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* NGÀY HẸN */}
      <Form.Item
        label='Ngày hẹn'
        name='appointmentDate'
        rules={[{ required: true, message: "Chọn ngày hẹn!" }]}>
        <DatePicker style={{ width: "100%" }} onChange={handleDateChange} />
      </Form.Item>

      {/* KHUNG GIỜ (từ serviceCenterSlots) */}
      <Form.Item
        label='Khung giờ'
        name='slotTime'
        rules={[{ required: true, message: "Chọn khung giờ!" }]}>
        <Select
          placeholder={"Chọn khung giờ"}
          disabled={!availableSlots.length}>
          {availableSlots.map((slot) => (
            <Option key={slot.id} value={slot.slotTime}>
              {SLOT_LABEL_MAP[slot.slotTime] || slot.slotTime}{" "}
              {slot.capacity != null ? ` (Sức chứa: ${slot.capacity})` : ""}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* GHI CHÚ */}
      <Form.Item label='Ghi chú' name='note'>
        <Input.TextArea rows={3} placeholder='Ghi chú thêm (nếu có)' />
      </Form.Item>

      {/* LOẠI DỊCH VỤ */}
      <Form.Item label='Loại dịch vụ' name='type'>
        <Select allowClear placeholder='Chọn loại dịch vụ '>
          <Option value='MAINTENANCE_TYPE'>Bảo dưỡng</Option>
          <Option value='REPAIR_TYPE'>Sửa chữa</Option>
          <Option value='WARRANTY_TYPE'>Bảo hành</Option>
        </Select>
      </Form.Item>

      <Button type='primary' htmlType='submit' loading={loading} block>
        Tạo lịch hẹn
      </Button>
    </Form>
  );
};

export default BookingForm;
