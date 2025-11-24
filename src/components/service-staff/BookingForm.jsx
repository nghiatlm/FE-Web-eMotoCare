// src/components/service-staff/BookingForm.jsx
import { useEffect, useState, useRef } from "react";
import { Form, InputNumber, DatePicker, Button, Select, Input, Card, Divider, Row, Col, Space } from "antd";
import { User, Car, Calendar, Clock, FileText, Settings, Wrench } from "lucide-react";
import dayjs from "dayjs";

import { getCustomersService } from "../../services/customerService";
import { getServiceCentersService } from "../../services/serivceCenterService";
import { getVehiclesByCustomerService } from "../../services/vehicleService";
import { getVehicleStagesService } from "../../services/vehicleStageService";
import { fetchServiceStaff } from "../../services/staffsService";
import { getCampaignsService } from "../../services/campaignService";

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

  // ✅ Danh sách campaigns
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

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

        // ✅ Load campaigns lần đầu
        await loadCampaigns();

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

  // ✅ Disable các ngày quá khứ (chỉ cho chọn từ hôm nay trở đi)
  const disabledDate = (current) => {
    // Disable các ngày trước hôm nay
    return current && current < dayjs().startOf("day");
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

  // ✅ Load campaigns
  const loadCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const campaignsList = await getCampaignsService({
        page: 1,
        pageSize: 100,
        status: "ACTIVE", // Chỉ lấy campaigns đang active
      });
      setCampaigns(Array.isArray(campaignsList) ? campaignsList : []);
    } catch (err) {
      console.error("Lỗi load chiến dịch:", err);
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // ✅ Khi đổi loại dịch vụ
  const handleTypeChange = (type) => {
    const vehicleId = form.getFieldValue("vehicleId");
    loadVehicleStages(vehicleId, type);
    
    // ✅ Nếu không phải bảo dưỡng, clear vehicleStageId
    if (type !== "MAINTENANCE_TYPE") {
      form.setFieldsValue({ vehicleStageId: undefined });
    }
    
    // ✅ Nếu không phải campaign, clear campaignId
    if (type !== "CAMPAIGN_TYPE") {
      form.setFieldsValue({ campaignId: undefined });
    }
  };

  // ✅ Khi chọn campaign
  const handleCampaignChange = (campaignId) => {
    if (campaignId) {
      // ✅ Tự động set type = CAMPAIGN_TYPE khi chọn campaign
      form.setFieldsValue({ 
        type: "CAMPAIGN_TYPE",
        campaignId: campaignId 
      });
      // ✅ Clear vehicleStageId khi chọn campaign (vì không dùng cho campaign)
      form.setFieldsValue({ vehicleStageId: undefined });
    } else {
      // ✅ Clear campaignId khi bỏ chọn
      form.setFieldsValue({ campaignId: undefined });
    }
  };

  // ====== SUBMIT ======
  const handleFinish = (values) => {
    const appointmentDate = values.appointmentDate
      ? values.appointmentDate.format("YYYY-MM-DD")
      : null;

    // ✅ Đảm bảo serviceCenterId luôn có giá trị (từ staff hoặc form)
    const serviceCenterId = values.serviceCenterId || currentServiceCenterId;

    // ✅ Xác định type và campaignId
    let appointmentType = values.type || DEFAULT_TYPE;
    let campaignId = null;
    
    // ✅ Nếu có campaignId, đảm bảo type = CAMPAIGN_TYPE
    if (values.campaignId) {
      appointmentType = "CAMPAIGN_TYPE";
      campaignId = values.campaignId;
    }

    const payload = {
      serviceCenterId: serviceCenterId,
      customerId: values.customerId,
      vehicleStageId: values.vehicleStageId || null,
      vehicleId: values.vehicleId,
      slotTime: values.slotTime,
      campaignId: campaignId,
      appointmentDate, // ✅ dùng string local
      estimatedCost: values.estimatedCost || 0,
      actualCost: 0,
      // ✅ Không set status, để backend tự set mặc định là PENDING
      type: appointmentType,
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
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <Form
        layout='vertical'
        form={form}
        onFinish={handleFinish}
        initialValues={initialValues}
        size="large">
        
        {/* ✅ CARD 1: THÔNG TIN KHÁCH HÀNG VÀ XE */}
        <Card
          title={
            <Space>
              <User size={20} style={{ color: "#ff4d4f" }} />
              <span>Thông tin khách hàng và xe</span>
            </Space>
          }
          style={{ marginBottom: 24, borderRadius: 8 }}
          headStyle={{ borderBottom: "1px solid #f0f0f0", padding: "16px 24px" }}
          bodyStyle={{ padding: "24px" }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <User size={16} style={{ color: "#595959" }} />
                    <span>Khách hàng</span>
                  </Space>
                }
                name='customerId'
                rules={[{ required: true, message: "Chọn khách hàng!" }]}>
                <Select
                  placeholder='Tìm kiếm khách hàng (tên hoặc SĐT)'
                  showSearch
                  filterOption={false}
                  onSearch={handleCustomerSearch}
                  loading={loadingCustomers}
                  onChange={(val) => handleCustomerChange(val, true)}
                  style={{ width: "100%" }}>
                  {customers.map((c) => {
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
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <Car size={16} style={{ color: "#595959" }} />
                    <span>Xe</span>
                  </Space>
                }
                name='vehicleId'
                rules={[{ required: true, message: "Chọn xe!" }]}>
                <Select
                  placeholder='Chọn xe'
                  loading={loadingVehicles}
                  disabled={!form.getFieldValue("customerId")}
                  onChange={handleVehicleChange}
                  style={{ width: "100%" }}>
                  {vehicles.map((v) => (
                    <Option key={v.id} value={v.id}>
                      {`${v.modelName || "Xe"} - ${v.chassisNumber || ""}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ✅ TRUNG TÂM DỊCH VỤ - Ẩn field, tự động set từ staff */}
        <Form.Item name='serviceCenterId' hidden>
          <Input type='hidden' />
        </Form.Item>

        {/* ✅ CARD 2: THỜI GIAN HẸN */}
        <Card
          title={
            <Space>
              <Calendar size={20} style={{ color: "#ff4d4f" }} />
              <span>Thời gian hẹn</span>
            </Space>
          }
          style={{ marginBottom: 24, borderRadius: 8 }}
          headStyle={{ borderBottom: "1px solid #f0f0f0", padding: "16px 24px" }}
          bodyStyle={{ padding: "24px" }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <Calendar size={16} style={{ color: "#595959" }} />
                    <span>Ngày hẹn</span>
                  </Space>
                }
                name='appointmentDate'
                rules={[{ required: true, message: "Chọn ngày hẹn!" }]}>
                <DatePicker
                  style={{ width: "100%" }}
                  onChange={handleDateChange}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày hẹn"
                  disabledDate={disabledDate}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <Clock size={16} style={{ color: "#595959" }} />
                    <span>Khung giờ</span>
                  </Space>
                }
                name='slotTime'
                rules={[{ required: true, message: "Chọn khung giờ!" }]}>
                <Select
                  placeholder="Chọn khung giờ"
                  disabled={!availableSlots.length}
                  style={{ width: "100%" }}>
                  {availableSlots.map((slot) => (
                    <Option key={slot.id} value={slot.slotTime}>
                      {SLOT_LABEL_MAP[slot.slotTime] || slot.slotTime}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ✅ CARD 3: LOẠI DỊCH VỤ VÀ THÔNG TIN BỔ SUNG */}
        <Card
          title={
            <Space>
              <Settings size={20} style={{ color: "#ff4d4f" }} />
              <span>Loại dịch vụ và thông tin bổ sung</span>
            </Space>
          }
          style={{ marginBottom: 24, borderRadius: 8 }}
          headStyle={{ borderBottom: "1px solid #f0f0f0", padding: "16px 24px" }}
          bodyStyle={{ padding: "24px" }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <Wrench size={16} style={{ color: "#595959" }} />
                    <span>Loại dịch vụ</span>
                  </Space>
                }
                name='type'>
                <Select
                  allowClear
                  placeholder='Chọn loại dịch vụ'
                  onChange={handleTypeChange}
                  style={{ width: "100%" }}>
                  <Option value='MAINTENANCE_TYPE'>Bảo dưỡng</Option>
                  <Option value='REPAIR_TYPE'>Sửa chữa</Option>
                  <Option value='WARRANTY_TYPE'>Bảo hành</Option>
                  <Option value='CAMPAIGN_TYPE'>Chiến dịch</Option>
                </Select>
              </Form.Item>
            </Col>

            {/* ✅ CAMPAIGN - Chỉ hiện khi type = CAMPAIGN_TYPE hoặc đã chọn campaign */}
            {(form.getFieldValue("type") === "CAMPAIGN_TYPE" || form.getFieldValue("campaignId")) && (
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <FileText size={16} style={{ color: "#595959" }} />
                      <span>Chiến dịch</span>
                    </Space>
                  }
                  name='campaignId'
                  rules={form.getFieldValue("type") === "CAMPAIGN_TYPE" ? [{ required: true, message: "Chọn campaign!" }] : []}
                  tooltip='Chọn chiến dịch cho lịch hẹn'>
                  <Select
                    placeholder='Chọn chiến dịch'
                    loading={loadingCampaigns}
                    onChange={handleCampaignChange}
                    style={{ width: "100%" }}>
                    {campaigns.map((campaign) => {
                      // ✅ Lấy campaignId từ id (đã được map trong service)
                      const campaignId = campaign.id;
                      return (
                        <Option key={campaignId} value={campaignId}>
                          {campaign.name || campaign.code || campaignId}
                          {campaign.startDate && campaign.endDate
                            ? ` (${new Date(campaign.startDate).toLocaleDateString("vi-VN")} - ${new Date(campaign.endDate).toLocaleDateString("vi-VN")})`
                            : ""}
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              </Col>
            )}

            {/* ✅ MỐC BẢO DƯỠNG - Chỉ hiện khi type = MAINTENANCE_TYPE */}
            {form.getFieldValue("type") === "MAINTENANCE_TYPE" && (
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <FileText size={16} style={{ color: "#595959" }} />
                      <span>Mốc bảo dưỡng</span>
                    </Space>
                  }
                  name='vehicleStageId'
                  tooltip='Chọn mốc bảo dưỡng cho xe (chỉ hiển thị các mốc sắp tới)'>
                  <Select
                    placeholder='Chọn mốc bảo dưỡng'
                    loading={loadingVehicleStages}
                    disabled={!form.getFieldValue("vehicleId")}
                    style={{ width: "100%" }}>
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
              </Col>
            )}
          </Row>

          <Divider style={{ margin: "16px 0" }} />

          <Form.Item
            label={
              <Space>
                <FileText size={16} style={{ color: "#595959" }} />
                <span>Ghi chú</span>
              </Space>
            }
            name='note'>
            <Input.TextArea
              rows={4}
              placeholder='Nhập ghi chú thêm (nếu có)'
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Card>

        {/* ✅ BUTTON SUBMIT */}
        <Button
          type='primary'
          htmlType='submit'
          loading={loading}
          block
          size="large"
          style={{
            height: "48px",
            fontSize: "16px",
            fontWeight: 600,
            borderRadius: 8,
            marginTop: 8,
            backgroundColor: "#ff4d4f",
            borderColor: "#ff4d4f",
          }}>
          Tạo lịch hẹn
        </Button>
      </Form>
    </div>
  );
};

export default BookingForm;
