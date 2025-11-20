// src/components/service-staff/BookingForm.jsx
import { useEffect, useState, useRef } from "react";
import { Form, InputNumber, DatePicker, Button, Select, Input } from "antd";

import { getCustomersService } from "../../services/customerService";
import { getServiceCentersService } from "../../services/serivceCenterService";
import { getVehiclesByCustomerService } from "../../services/vehicleService";
import { getVehicleStagesService } from "../../services/vehicleStageService";
import { fetchServiceStaff } from "../../services/staffsService";

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
  H17_18: "17:00 - 18:00",
};

const DEFAULT_TYPE = "MAINTENANCE_TYPE";

const BookingForm = ({ onSubmit, loading = false, initialValues, resetKey }) => {
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [centers, setCenters] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearchText, setCustomerSearchText] = useState("");

  // 👉 danh sách slot khả dụng sau khi filter theo center + ngày
  const [availableSlots, setAvailableSlots] = useState([]);

  // ✅ Danh sách mốc bảo dưỡng (vehicle stages)
  const [vehicleStages, setVehicleStages] = useState([]);
  const [loadingVehicleStages, setLoadingVehicleStages] = useState(false);

  // ✅ ServiceCenterId của nhân viên hiện tại
  const [currentServiceCenterId, setCurrentServiceCenterId] = useState(null);

  // ====== RESET FORM KHI resetKey THAY ĐỔI ======
  useEffect(() => {
    if (resetKey !== undefined) {
      form.resetFields();
      setVehicles([]);
      setAvailableSlots([]);
      setVehicleStages([]);
      setCustomerSearchText("");
    }
  }, [resetKey, form]);

  // ✅ Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Debounce timer ref
  const searchTimeoutRef = useRef(null);

  // ====== LOAD CUSTOMERS VỚI SEARCH ======
  const loadCustomers = async (searchText = "") => {
    try {
      setLoadingCustomers(true);
      const params = {};
      if (searchText && searchText.trim()) {
        params.search = searchText.trim();
      }
      const cusRes = await getCustomersService(params);
      const customersList = Array.isArray(cusRes) ? cusRes : [];
      setCustomers(customersList);
    } catch (err) {
      console.error("Lỗi load khách hàng:", err);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // ✅ Handle search với debounce
  const handleCustomerSearch = (value) => {
    setCustomerSearchText(value);
    
    // ✅ Clear timeout trước đó
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // ✅ Debounce: đợi 300ms sau khi user ngừng gõ mới gọi API
    searchTimeoutRef.current = setTimeout(() => {
      loadCustomers(value);
    }, 300);
  };

  // ====== LOAD SERVICE CENTER + STAFF INFO ======
  useEffect(() => {
    const fetchInit = async () => {
      try {
        // ✅ Lấy serviceCenterId từ staff hiện tại
        let staffServiceCenterId = null;
        try {
          const staffInfo = await fetchServiceStaff();
          const staffData = staffInfo?.data?.data || staffInfo?.data || staffInfo;
          staffServiceCenterId = staffData?.serviceCenterId || null;
          
          // Fallback: lấy từ localStorage nếu API fail
          if (!staffServiceCenterId) {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            staffServiceCenterId = 
              user?.accountResponse?.serviceCenterId || 
              user?.serviceCenterId || 
              null;
          }
        } catch (err) {
          console.error("Lỗi lấy serviceCenterId từ staff:", err);
          // Fallback: lấy từ localStorage
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          staffServiceCenterId = 
            user?.accountResponse?.serviceCenterId || 
            user?.serviceCenterId || 
            null;
        }

        setCurrentServiceCenterId(staffServiceCenterId);

        const cenRes = await getServiceCentersService();
        setCenters(Array.isArray(cenRes) ? cenRes : []);

        // ✅ Load customers lần đầu (không có search)
        await loadCustomers();

        // ✅ Set serviceCenterId mặc định từ staff
        if (staffServiceCenterId) {
          form.setFieldsValue({ serviceCenterId: staffServiceCenterId });
        }

        if (initialValues) {
          form.setFieldsValue({
            ...initialValues,
            // ✅ Override serviceCenterId từ initialValues nếu có, nếu không thì dùng từ staff
            serviceCenterId: initialValues.serviceCenterId || staffServiceCenterId,
          });

          // Nếu có sẵn customerId -> load xe luôn
          if (initialValues.customerId) {
            handleCustomerChange(initialValues.customerId, false);
          }

          // Nếu có sẵn center + date -> build slot luôn
          const centerId = initialValues.serviceCenterId || staffServiceCenterId;
          const date = initialValues.appointmentDate;
          if (centerId && date) {
            buildSlots(centerId, date);
          }

          // ✅ Nếu có sẵn vehicleId và type = MAINTENANCE_TYPE -> load vehicle stages
          // Sử dụng setTimeout để đảm bảo vehicles đã được load xong
          if (initialValues.vehicleId && initialValues.type === "MAINTENANCE_TYPE") {
            setTimeout(() => {
              loadVehicleStages(initialValues.vehicleId, initialValues.type);
            }, 500);
          }
        } else if (staffServiceCenterId) {
          // ✅ Nếu không có initialValues, set serviceCenterId từ staff
          form.setFieldsValue({ serviceCenterId: staffServiceCenterId });
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
        setVehicleStages([]); // ✅ Clear vehicle stages khi clear vehicle
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

  // ✅ Khi đổi ngày, tự động build slots với serviceCenterId hiện tại
  // (Không cần handleServiceCenterChange nữa vì không có field chọn trung tâm)

  // Khi đổi ngày
  const handleDateChange = (date) => {
    const centerId = form.getFieldValue("serviceCenterId") || currentServiceCenterId;
    if (centerId) {
      buildSlots(centerId, date);
    }
  };

  // ====== LOAD VEHICLE STAGES KHI CHỌN XE VÀ TYPE = BẢO DƯỠNG ======
  const loadVehicleStages = async (vehicleId, type) => {
    // ✅ Chỉ load khi type là MAINTENANCE_TYPE và có vehicleId
    if (type !== "MAINTENANCE_TYPE" || !vehicleId) {
      setVehicleStages([]);
      form.setFieldsValue({ vehicleStageId: undefined });
      return;
    }

    try {
      setLoadingVehicleStages(true);
      const stages = await getVehicleStagesService(vehicleId, {
        page: 1,
        pageSize: 100,
      });

      // ✅ Filter chỉ lấy status = "UPCOMING"
      const upcomingStages = (stages || []).filter(
        (stage) => stage.status === "UPCOMING"
      );

      setVehicleStages(upcomingStages);
    } catch (err) {
      console.error("Lỗi load mốc bảo dưỡng:", err);
      setVehicleStages([]);
    } finally {
      setLoadingVehicleStages(false);
    }
  };

  // ✅ Khi đổi xe
  const handleVehicleChange = (vehicleId) => {
    const type = form.getFieldValue("type");
    loadVehicleStages(vehicleId, type);
  };

  // ✅ Khi đổi loại dịch vụ
  const handleTypeChange = (type) => {
    const vehicleId = form.getFieldValue("vehicleId");
    loadVehicleStages(vehicleId, type);
    
    // ✅ Nếu không phải bảo dưỡng, clear vehicleStageId
    if (type !== "MAINTENANCE_TYPE") {
      form.setFieldsValue({ vehicleStageId: undefined });
    }
  };

  // ====== SUBMIT ======
  const handleFinish = (values) => {
    const appointmentDate = values.appointmentDate
      ? values.appointmentDate.format("YYYY-MM-DD")
      : null;

    // ✅ Đảm bảo serviceCenterId luôn có giá trị (từ staff hoặc form)
    const serviceCenterId = values.serviceCenterId || currentServiceCenterId;

    const payload = {
      serviceCenterId: serviceCenterId,
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
    
    // ✅ Reset form sau khi submit thành công
    form.resetFields();
    setVehicles([]);
    setAvailableSlots([]);
    setVehicleStages([]);
    
    // ✅ Set lại serviceCenterId sau khi reset
    if (currentServiceCenterId) {
      form.setFieldsValue({ serviceCenterId: currentServiceCenterId });
    }
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
          placeholder='Chọn khách hàng (có thể tìm theo tên hoặc SĐT)'
          showSearch
          filterOption={false} // ✅ Tắt filter ở frontend, dùng API search
          onSearch={handleCustomerSearch} // ✅ Gọi API search với debounce
          loading={loadingCustomers}
          onChange={(val) => handleCustomerChange(val, true)}>
          {customers.map((c) => {
            // ✅ Truy cập phone từ account object (nested property)
            const phone = c.account && c.account.phone ? c.account.phone : "";
            const displayName = c.customerCode
              ? `${c.customerCode} - ${c.firstName} ${c.lastName}`
              : `${c.firstName || ""} ${c.lastName || ""}`;
            const displayText = phone ? `${displayName} (${phone})` : displayName;
            
            return (
              <Option key={c.id} value={c.id}>
                {displayText}
              </Option>
            );
          })}
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
          disabled={!form.getFieldValue("customerId")}
          onChange={handleVehicleChange}>
          {vehicles.map((v) => (
            <Option key={v.id} value={v.id}>
              {`${v.modelName || "Xe"} - ${v.chassisNumber || ""}`}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* ✅ TRUNG TÂM DỊCH VỤ - Ẩn field, tự động set từ staff */}
      <Form.Item name='serviceCenterId' hidden>
        <Input type='hidden' />
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
        <Select
          allowClear
          placeholder='Chọn loại dịch vụ'
          onChange={handleTypeChange}>
          <Option value='MAINTENANCE_TYPE'>Bảo dưỡng</Option>
          <Option value='REPAIR_TYPE'>Sửa chữa</Option>
          <Option value='WARRANTY_TYPE'>Bảo hành</Option>
        </Select>
      </Form.Item>

      {/* ✅ MỐC BẢO DƯỠNG - Chỉ hiện khi type = MAINTENANCE_TYPE */}
      {form.getFieldValue("type") === "MAINTENANCE_TYPE" && (
        <Form.Item
          label='Mốc bảo dưỡng'
          name='vehicleStageId'
          tooltip='Chọn mốc bảo dưỡng cho xe (chỉ hiển thị các mốc sắp tới)'>
          <Select
            placeholder='Chọn mốc bảo dưỡng'
            loading={loadingVehicleStages}
            disabled={!form.getFieldValue("vehicleId")}>
            {vehicleStages.map((stage) => (
              <Option key={stage.id} value={stage.id}>
                {stage.maintenanceStage?.name || "Mốc bảo dưỡng"} -{" "}
                {stage.maintenanceStage?.mileage || ""}
                {stage.dateOfImplementation
                  ? ` (${new Date(stage.dateOfImplementation).toLocaleDateString("vi-VN")})`
                  : ""}
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}

      <Button type='primary' htmlType='submit' loading={loading} block>
        Tạo lịch hẹn
      </Button>
    </Form>
  );
};

export default BookingForm;
