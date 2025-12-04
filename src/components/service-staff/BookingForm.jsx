// src/components/service-staff/BookingForm.jsx
import { useEffect, useState, useRef } from "react";
import { Form, InputNumber, DatePicker, Button, Select, Input, Card, Divider, Row, Col, Space, Descriptions, Tag, Spin } from "antd";
import { User, Car, Calendar, Clock, FileText, Settings, Wrench, Search, Phone, Mail, MapPin, Hash } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import dayjs from "dayjs";

import { getCustomersService } from "../../services/customerService";
import { getServiceCentersService } from "../../services/serivceCenterService";
import { getVehiclesByCustomerService } from "../../services/vehicleService";
import { getVehicleStagesService } from "../../services/vehicleStageService";
import { fetchServiceStaff } from "../../services/staffsService";
import { getCampaignsService } from "../../services/campaignService";
import { getVehicleInfoFromChassisService } from "../../services/appointmentService";

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

const BookingForm = ({ onSubmit, loading = false, initialValues, resetKey, skipChassisNumber = false }) => {
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

  // ✅ Danh sách campaigns và recalls
  const [campaigns, setCampaigns] = useState([]);
  const [recalls, setRecalls] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // ✅ ServiceCenterId của nhân viên hiện tại
  const [currentServiceCenterId, setCurrentServiceCenterId] = useState(null);

  // ✅ State để track xem đã load thông tin từ số khung chưa
  const [isChassisNumberLoaded, setIsChassisNumberLoaded] = useState(skipChassisNumber);
  const [vehicleInfo, setVehicleInfo] = useState(null);

  // ====== RESET FORM KHI resetKey THAY ĐỔI ======
  useEffect(() => {
    if (resetKey !== undefined) {
      form.resetFields();
      setVehicles([]);
      setAvailableSlots([]);
      setVehicleStages([]);
      setCustomerSearchText("");
      // ✅ Reset các state liên quan đến số khung
      setVehicleInfo(null);
      setIsChassisNumberLoaded(skipChassisNumber);
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
  
  // ====== SET INITIAL VALUES VÀ TỰ ĐỘNG LOAD THÔNG TIN NẾU CÓ TỪ RMA ======
  useEffect(() => {
    if (skipChassisNumber && initialValues?.customerId && initialValues?.vehicleId && initialValues?.chassisNumber) {
      // ✅ Tự động set vehicleInfo từ initialValues (từ RMA) với đầy đủ thông tin
      setVehicleInfo({
        customer: initialValues.customer || {
          id: initialValues.customerId,
        },
        vehicle: initialValues.vehicle || {
          id: initialValues.vehicleId,
          chassisNumber: initialValues.chassisNumber,
        },
      });
      setIsChassisNumberLoaded(true);
      form.setFieldsValue({
        customerId: initialValues.customerId,
        vehicleId: initialValues.vehicleId,
        chassisNumber: initialValues.chassisNumber,
        ...initialValues,
      });
    } else if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, skipChassisNumber, form]);

  // ✅ Hàm gọi API để lấy thông tin từ số khung
  const handleChassisNumberLookup = async (chassisNumber) => {
    if (!chassisNumber || chassisNumber.trim() === "") {
      toast.warning("Vui lòng nhập số khung để tìm kiếm!");
      return;
    }

    try {
      const response = await getVehicleInfoFromChassisService(chassisNumber.trim());
      
      console.log("📦 API Response:", response);
      
      // ✅ Response structure có thể là:
      // 1. { statusCode, success, message, data: { customer, vehicle, vehicleStage } }
      // 2. { customer, vehicle, vehicleStage } (trực tiếp)
      let customer, vehicle, vehicleStage;
      
      if (response && response.success && response.data) {
        // Case 1: Có wrapper { success, data }
        ({ customer, vehicle, vehicleStage } = response.data);
      } else if (response && (response.customer || response.vehicle || response.vehicleStage)) {
        // Case 2: Trực tiếp { customer, vehicle, vehicleStage }
        ({ customer, vehicle, vehicleStage } = response);
      } else {
        throw new Error("Không tìm thấy thông tin từ số khung. Response structure không đúng.");
      }
      
      console.log("✅ Customer:", customer);
      console.log("✅ Vehicle:", vehicle);
      console.log("✅ VehicleStage:", vehicleStage);
      
        // ✅ Lưu thông tin để hiển thị
        setVehicleInfo({ customer, vehicle, vehicleStage });
        
        // ✅ Set giá trị vào form (giữ lại chassisNumber để submit)
        form.setFieldsValue({ 
          chassisNumber: chassisNumber.trim(),
          ...(customer?.id && { customerId: customer.id }),
          ...(vehicle?.id && { vehicleId: vehicle.id }),
          ...(vehicleStage?.id && { vehicleStageId: vehicleStage.id }),
        });
        
        // ✅ Load vehicle stages nếu có vehicleId
        if (vehicle?.id) {
          loadVehicleStages(vehicle.id);
        }
        
        // ✅ Enable các form items khác
        setIsChassisNumberLoaded(true);
        console.log("✅ isChassisNumberLoaded set to true");
        
        // ✅ Toast thành công
        toast.success("Tìm thấy thông tin xe và khách hàng!");
    } catch (error) {
      console.error("❌ Lỗi lấy thông tin từ số khung:", error);
      setVehicleInfo(null);
      setIsChassisNumberLoaded(false);
      
      // ✅ Toast lỗi
      const errorMessage = error?.response?.data?.message || error?.message || "Không tìm thấy thông tin từ số khung. Vui lòng kiểm tra lại!";
      toast.error(errorMessage);
    }
  };

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

  // ✅ Load campaigns và recalls (programs)
  const loadCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const programsList = await getCampaignsService({
        page: 1,
        pageSize: 100,
        status: "ACTIVE", // Chỉ lấy programs đang active
      });
      
      // ✅ Tách ra thành campaigns và recalls dựa trên type
      const allPrograms = Array.isArray(programsList) ? programsList : [];
      const campaignsList = allPrograms.filter(p => p.type === "CAMPAIGN" || !p.type); // ✅ Fallback: nếu không có type thì coi như campaign
      const recallsList = allPrograms.filter(p => p.type === "RECALL");
      
      setCampaigns(campaignsList);
      setRecalls(recallsList);
    } catch (err) {
      console.error("Lỗi load chiến dịch và triệu hồi:", err);
      setCampaigns([]);
      setRecalls([]);
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
    
    // ✅ Nếu không phải campaign, clear programId
    if (type !== "CAMPAIGN_TYPE") {
      form.setFieldsValue({ programId: undefined });
    }
    
    // ✅ Nếu không phải recall, clear recallId
    if (type !== "RECALL_TYPE") {
      form.setFieldsValue({ recallId: undefined });
    }
  };

  // ✅ Khi chọn campaign
  const handleCampaignChange = (programId) => {
    if (programId) {
      // ✅ Tự động set type = CAMPAIGN_TYPE khi chọn campaign
      form.setFieldsValue({ 
        type: "CAMPAIGN_TYPE",
        programId: programId,
        recallId: undefined // ✅ Clear recallId khi chọn campaign
      });
      // ✅ Clear vehicleStageId khi chọn campaign (vì không dùng cho campaign)
      form.setFieldsValue({ vehicleStageId: undefined });
    } else {
      // ✅ Clear programId khi bỏ chọn
      form.setFieldsValue({ programId: undefined });
    }
  };

  // ✅ Khi chọn recall
  const handleRecallChange = (recallId) => {
    if (recallId) {
      // ✅ Tự động set type = RECALL_TYPE khi chọn recall
      form.setFieldsValue({ 
        type: "RECALL_TYPE",
        recallId: recallId,
        programId: undefined // ✅ Clear programId khi chọn recall
      });
      // ✅ Clear vehicleStageId khi chọn recall (vì không dùng cho recall)
      form.setFieldsValue({ vehicleStageId: undefined });
    } else {
      // ✅ Clear recallId khi bỏ chọn
      form.setFieldsValue({ recallId: undefined });
    }
  };

  // ====== SUBMIT ======
  const handleFinish = (values) => {
    const appointmentDate = values.appointmentDate
      ? values.appointmentDate.format("YYYY-MM-DD")
      : null;

    // ✅ Đảm bảo serviceCenterId luôn có giá trị (từ staff hoặc form)
    const serviceCenterId = values.serviceCenterId || currentServiceCenterId;

    // ✅ Xác định type và programId (dùng programId cho cả campaign và recall)
    let appointmentType = values.type || DEFAULT_TYPE;
    let programId = null;
    
    // ✅ Nếu có programId, đảm bảo type = CAMPAIGN_TYPE
    if (values.programId) {
      appointmentType = "CAMPAIGN_TYPE";
      programId = values.programId;
    }
    
    // ✅ Nếu có recallId, đảm bảo type = RECALL_TYPE (nhưng vẫn gửi vào programId)
    if (values.recallId) {
      appointmentType = "RECALL_TYPE";
      programId = values.recallId; // ✅ Dùng programId cho cả recall, chỉ khác type
    }

    // ✅ Lấy customerId và vehicleId từ form (đã được set khi load thông tin từ số khung)
    const customerId = values.customerId || form.getFieldValue("customerId");
    const vehicleId = values.vehicleId || form.getFieldValue("vehicleId");
    
    // ✅ Chỉ gửi chassisNumber, BE sẽ tự động map customerId và vehicleId
    if (!values.chassisNumber || values.chassisNumber.trim() === "") {
      throw new Error("Vui lòng nhập số khung!");
    }

    // ✅ Chỉ gửi vehicleStageId khi type là MAINTENANCE_TYPE
    const vehicleStageId = appointmentType === "MAINTENANCE_TYPE" 
      ? (values.vehicleStageId || form.getFieldValue("vehicleStageId") || null)
      : null;

    const payload = {
      serviceCenterId: serviceCenterId,
      customerId: customerId || null, // ✅ Gửi customerId từ API response
      vehicleId: vehicleId || null, // ✅ Gửi vehicleId từ API response
      vehicleStageId: vehicleStageId, // ✅ Chỉ gửi khi type là MAINTENANCE_TYPE
      slotTime: values.slotTime,
      campaignId: programId, // ✅ Tên field là campaignId (theo backend), giá trị là id của program
      appointmentDate, // ✅ dùng string local
      estimatedCost: values.estimatedCost || 0,
      actualCost: 0,
      status: "PENDING", // ✅ Set status mặc định
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
    <div style={{ padding: "24px", width: "100%", margin: "0 auto" }}>
    <Form
      layout='vertical'
      form={form}
      onFinish={handleFinish}
        initialValues={initialValues}
        size="large">
        
        {/* ✅ CARD 1: THÔNG TIN KHÁCH HÀNG VÀ XE - CHỈ NHẬP SỐ KHUNG */}
        <Card
          title={
            <Space>
              <Car size={20} style={{ color: "#ff4d4f" }} />
              <span>Thông tin khách hàng và xe</span>
            </Space>
          }
          style={{ marginBottom: 24, borderRadius: 8 }}
          headStyle={{ borderBottom: "1px solid #f0f0f0", padding: "16px 24px" }}
          bodyStyle={{ padding: "24px" }}>
          <Row gutter={[16, 0]}>
            <Col xs={24}>
              {/* ✅ Ẩn input số khung sau khi đã load thông tin */}
              {!isChassisNumberLoaded && (
      <Form.Item
                  label={
                    <Space>
                      <Car size={16} style={{ color: "#595959" }} />
                      <span>Số khung</span>
                    </Space>
                  }
                  name='chassisNumber'
                  rules={[{ required: !isChassisNumberLoaded, message: "Nhập số khung!" }]}>
                  <Row gutter={[8, 0]}>
                    <Col flex="auto">
                      <Input
                        placeholder='Nhập số khung'
                        allowClear
                        size="large"
                        onPressEnter={(e) => {
                          const chassisNumber = e.target.value;
                          handleChassisNumberLookup(chassisNumber);
                        }}
                      />
                    </Col>
                    <Col>
                      <Button
                        type="primary"
                        icon={<Search size={16} />}
                        size="large"
                        danger
                        onClick={() => {
                          const chassisNumber = form.getFieldValue("chassisNumber");
                          handleChassisNumberLookup(chassisNumber);
                        }}
                        style={{
                          height: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          whiteSpace: "nowrap",
                          backgroundColor: "#ff4d4f",
                          borderColor: "#ff4d4f",
                        }}>
                        Tìm kiếm
                      </Button>
                    </Col>
                  </Row>
      </Form.Item>
              )}
              
              {/* ✅ Hidden field để giữ chassisNumber khi đã load thông tin */}
              {isChassisNumberLoaded && (
                <Form.Item name='chassisNumber' hidden>
                  <Input type='hidden' />
      </Form.Item>
              )}
              
              {/* ✅ Hiển thị thông tin sau khi nhập số khung */}
              {vehicleInfo ? (
                <div style={{ marginTop: 16 }}>
                  <Row gutter={[16, 16]} style={{ display: "flex" }}>
                    {/* Thông tin khách hàng */}
                    {vehicleInfo.customer && (
                      <Col xs={24} md={12} style={{ display: "flex" }}>
                        <Card 
                          title={
                            <Space>
                              <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#e6f7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <User size={20} style={{ color: "#1890ff" }} />
                              </div>
                              <span style={{ fontWeight: 600, fontSize: 16 }}>Thông tin khách hàng</span>
                            </Space>
                          }
                          style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", width: "100%", display: "flex", flexDirection: "column" }}
                          headStyle={{ borderBottom: "1px solid #f0f0f0", padding: "18px 24px", backgroundColor: "#fafafa" }}
                          bodyStyle={{ padding: "24px", flex: 1 }}>
                          <Descriptions column={1} size="middle" colon={false} style={{ margin: 0 }}>
                            <Descriptions.Item 
                              label={
                                <Space size={6}>
                                  <User size={16} style={{ color: "#595959" }} />
                                  <span style={{ fontWeight: 500 }}>Họ tên</span>
                                </Space>
                              }
                              style={{ paddingBottom: 12 }}>
                              <span style={{ fontWeight: 500, fontSize: 15 }}>
                                {vehicleInfo.customer.firstName} {vehicleInfo.customer.lastName}
                              </span>
                            </Descriptions.Item>
                            <Descriptions.Item 
                              label={
                                <Space size={6}>
                                  <Hash size={16} style={{ color: "#595959" }} />
                                  <span style={{ fontWeight: 500 }}>Mã KH</span>
                                </Space>
                              }
                              style={{ paddingBottom: 12 }}>
                              <Tag color="blue" style={{ fontSize: 13, padding: "4px 12px" }}>
                                {vehicleInfo.customer.customerCode}
                              </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item 
                              label={
                                <Space size={6}>
                                  <Phone size={16} style={{ color: "#595959" }} />
                                  <span style={{ fontWeight: 500 }}>SĐT</span>
                                </Space>
                              }
                              style={{ paddingBottom: 12 }}>
                              {vehicleInfo.customer.account?.phone || "N/A"}
                            </Descriptions.Item>
                            <Descriptions.Item 
                              label={
                                <Space size={6}>
                                  <Mail size={16} style={{ color: "#595959" }} />
                                  <span style={{ fontWeight: 500 }}>Email</span>
                                </Space>
                              }
                              style={{ paddingBottom: 0 }}>
                              {vehicleInfo.customer.account?.email || "N/A"}
                            </Descriptions.Item>
                          </Descriptions>
                        </Card>
                      </Col>
                    )}
                    
                    {/* Thông tin xe */}
                    {vehicleInfo.vehicle && (
                      <Col xs={24} md={12} style={{ display: "flex" }}>
                        <Card 
                          title={
                            <Space>
                              <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#fff7e6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Car size={20} style={{ color: "#fa8c16" }} />
                              </div>
                              <span style={{ fontWeight: 600, fontSize: 16 }}>Thông tin xe</span>
                            </Space>
                          }
                          style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", width: "100%", display: "flex", flexDirection: "column" }}
                          headStyle={{ borderBottom: "1px solid #f0f0f0", padding: "18px 24px", backgroundColor: "#fafafa" }}
                          bodyStyle={{ padding: "24px", flex: 1 }}>
                          <Descriptions column={1} size="middle" colon={false} style={{ margin: 0 }}>
                            <Descriptions.Item 
                              label={
                                <Space size={6}>
                                  <Car size={16} style={{ color: "#595959" }} />
                                  <span style={{ fontWeight: 500 }}>Mẫu xe</span>
                                </Space>
                              }
                              style={{ paddingBottom: 12 }}>
                              <span style={{ fontWeight: 500, fontSize: 15 }}>{vehicleInfo.vehicle.modelName || "N/A"}</span>
                            </Descriptions.Item>
                            <Descriptions.Item 
                              label={
                                <Space size={6}>
                                  <Hash size={16} style={{ color: "#595959" }} />
                                  <span style={{ fontWeight: 500 }}>Số khung</span>
                                </Space>
                              }
                              style={{ paddingBottom: 12 }}>
                              <Tag color="orange" style={{ fontSize: 13, padding: "4px 12px" }}>
                                {vehicleInfo.vehicle.chassisNumber || "N/A"}
                              </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item 
                              label={
                                <Space size={6}>
                                  <Hash size={16} style={{ color: "#595959" }} />
                                  <span style={{ fontWeight: 500 }}>Số máy</span>
                                </Space>
                              }
                              style={{ paddingBottom: 12 }}>
                              {vehicleInfo.vehicle.engineNumber || "N/A"}
                            </Descriptions.Item>
                            <Descriptions.Item 
                              label={
                                <Space size={6}>
                                  <Car size={16} style={{ color: "#595959" }} />
                                  <span style={{ fontWeight: 500 }}>Màu sắc</span>
                                </Space>
                              }
                              style={{ paddingBottom: 0 }}>
                              <Tag color="purple" style={{ fontSize: 13, padding: "4px 12px" }}>
                                {vehicleInfo.vehicle.color || "N/A"}
                              </Tag>
                            </Descriptions.Item>
                          </Descriptions>
                        </Card>
                      </Col>
                    )}
                    
                   
                  </Row>
                </div>
              ) : null}
            </Col>
          </Row>
        </Card>

        {/* ✅ TRUNG TÂM DỊCH VỤ - Ẩn field, tự động set từ staff */}
        <Form.Item name='serviceCenterId' hidden>
          <Input type='hidden' />
      </Form.Item>

        {/* ✅ Ẩn tất cả form items khi chưa nhập số khung */}
        {isChassisNumberLoaded && (
          <>
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
                  disabled={!isChassisNumberLoaded}
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
                  disabled={!isChassisNumberLoaded || !availableSlots.length}
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
                  disabled={!isChassisNumberLoaded}
                  style={{ width: "100%" }}>
          <Option value='MAINTENANCE_TYPE'>Bảo dưỡng</Option>
          <Option value='REPAIR_TYPE'>Sửa chữa</Option>
          <Option value='WARRANTY_TYPE'>Bảo hành</Option>
                  <Option value='CAMPAIGN_TYPE'>Chiến dịch</Option>
                  <Option value='RECALL_TYPE'>Triệu hồi</Option>
                </Select>
              </Form.Item>
            </Col>

            {/* ✅ CAMPAIGN - Chỉ hiện khi type = CAMPAIGN_TYPE hoặc đã chọn campaign */}
            {(form.getFieldValue("type") === "CAMPAIGN_TYPE" || form.getFieldValue("programId")) && (
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <FileText size={16} style={{ color: "#595959" }} />
                      <span>Chiến dịch</span>
                    </Space>
                  }
                  name='programId'
                  rules={form.getFieldValue("type") === "CAMPAIGN_TYPE" ? [{ required: true, message: "Chọn campaign!" }] : []}
                  tooltip='Chọn chiến dịch cho lịch hẹn'>
                  <Select
                    placeholder='Chọn chiến dịch'
                    loading={loadingCampaigns}
                    onChange={handleCampaignChange}
                    disabled={!isChassisNumberLoaded}
                    style={{ width: "100%" }}>
                    {campaigns.map((campaign) => {
                      // ✅ Lấy programId từ id (đã được map trong service)
                      const programId = campaign.id;
                      return (
                        <Option key={programId} value={programId}>
                          {campaign.title || campaign.name || campaign.code || programId}
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

            {/* ✅ RECALL - Chỉ hiện khi type = RECALL_TYPE hoặc đã chọn recall */}
            {(form.getFieldValue("type") === "RECALL_TYPE" || form.getFieldValue("recallId")) && (
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <FileText size={16} style={{ color: "#595959" }} />
                      <span>Triệu hồi</span>
                    </Space>
                  }
                  name='recallId'
                  rules={form.getFieldValue("type") === "RECALL_TYPE" ? [{ required: true, message: "Chọn triệu hồi!" }] : []}
                  tooltip='Chọn chương trình triệu hồi cho lịch hẹn'>
                  <Select
                    placeholder='Chọn chương trình triệu hồi'
                    loading={loadingCampaigns}
                    onChange={handleRecallChange}
                    disabled={!isChassisNumberLoaded}
                    style={{ width: "100%" }}>
                    {recalls.map((recall) => {
                      // ✅ Lấy recallId từ id
                      const recallId = recall.id;
                      return (
                        <Option key={recallId} value={recallId}>
                          {recall.title || recall.name || recall.code || recallId}
                          {recall.startDate && recall.endDate
                            ? ` (${new Date(recall.startDate).toLocaleDateString("vi-VN")} - ${new Date(recall.endDate).toLocaleDateString("vi-VN")})`
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
                    disabled={!isChassisNumberLoaded || !form.getFieldValue("vehicleId")}
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
                <span>{form.getFieldValue("type") === "REPAIR_TYPE" ? "Tình trạng xe" : "Ghi chú"}</span>
              </Space>
            }
            name='note'>
            <Input.TextArea
              rows={4}
              placeholder={form.getFieldValue("type") === "REPAIR_TYPE" ? "Nhập tình trạng xe" : "Nhập ghi chú thêm (nếu có)"}
              showCount
              maxLength={500}
              disabled={!isChassisNumberLoaded}
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
          disabled={!isChassisNumberLoaded}
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
          </>
        )}
    </Form>
    </div>
  );
};

export default BookingForm;
