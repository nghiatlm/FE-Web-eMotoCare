
import { useEffect, useState, useRef } from "react";
import { Form, InputNumber, DatePicker, Button, Select, Input, Card, Divider, Row, Col, Space, Descriptions, Tag, Typography } from "antd";
import Loading from "../Loading";
import { User, Car, CarFront, Calendar, Clock, FileText, Settings, Wrench, Search, Phone, Mail, MapPin, Hash, Palette } from "lucide-react";

const { Text, Title } = Typography;
import { toast } from "react-toastify";
import dayjs from "dayjs";

import { getCustomersService } from "../../services/customerService";
import { getServiceCentersService } from "../../services/serivceCenterService";
import { getServiceCenterById } from "../../api/serviceCentersApi";
import { getVehiclesByCustomerService } from "../../services/vehicleService";
import { getVehicleStagesService } from "../../services/vehicleStageService";
import { getStaffByAccountId } from "../../api/staffsApi";
import { getCampaignsService } from "../../services/campaignService";
import { getVehicleInfoFromChassisService } from "../../services/appointmentService";

const { Option } = Select;


const SLOT_LABEL_MAP = {
  H07_08: "07:00 - 08:00",
  H08_09: "08:00 - 09:00",
  H09_10: "09:00 - 10:00",
  H10_11: "10:00 - 11:00",
  H11_12: "11:00 - 12:00",
  H12_13: "12:00 - 13:00",
  H13_14: "13:00 - 14:00",
  H14_15: "14:00 - 15:00",
  H15_16: "15:00 - 16:00",
  H16_17: "16:00 - 17:00",
  H17_18: "17:00 - 18:00",
};

const DEFAULT_TYPE = "MAINTENANCE_TYPE";


const translateColor = (color) => {
  if (!color) return "N/A";
  const colorUpper = String(color).trim().toUpperCase();
  const colorMap = {
    "BLUE": "Xanh dương",
    "RED": "Đỏ",
    "GREEN": "Xanh lá",
    "YELLOW": "Vàng",
    "BLACK": "Đen",
    "WHITE": "Trắng",
    "GRAY": "Xám",
    "GREY": "Xám",
    "SILVER": "Bạc",
    "GOLD": "Vàng",
    "ORANGE": "Cam",
    "PURPLE": "Tím",
    "PINK": "Hồng",
    "BROWN": "Nâu",
  };
  return colorMap[colorUpper] || color;
};

const getColorHex = (color) => {
  if (!color) return "#999999"; 
  const colorUpper = String(color).trim().toUpperCase();
  const colorHexMap = {
    BLUE: "#1890ff",
    RED: "#ff4d4f",
    GREEN: "#52c41a",
    YELLOW: "#fadb14",
    BLACK: "#000000",
    WHITE: "#ffffff",
    GRAY: "#8c8c8c",
    GREY: "#8c8c8c",
    SILVER: "#c0c0c0",
    GOLD: "#ffd700",
    ORANGE: "#fa8c16",
    PURPLE: "#722ed1",
    PINK: "#eb2f96",
    BROWN: "#8b4513",
  };
  return colorHexMap[colorUpper] || color; // Nếu không tìm thấy, trả về giá trị gốc (có thể đã là hex)
};

const BookingForm = ({ onSubmit, loading = false, initialValues, resetKey, skipChassisNumber = false, hideServiceTypeCard = false }) => {
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [centers, setCenters] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearchText, setCustomerSearchText] = useState("");


  const [availableSlots, setAvailableSlots] = useState([]);


  const [vehicleStages, setVehicleStages] = useState([]);
  const [loadingVehicleStages, setLoadingVehicleStages] = useState(false);


  const [campaigns, setCampaigns] = useState([]);
  const [recalls, setRecalls] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);


  const [currentServiceCenterId, setCurrentServiceCenterId] = useState(null);


  const [isChassisNumberLoaded, setIsChassisNumberLoaded] = useState(skipChassisNumber);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [isSearchingChassis, setIsSearchingChassis] = useState(false);


  useEffect(() => {
    if (resetKey !== undefined) {
      form.resetFields();
      setVehicles([]);
      setAvailableSlots([]);
      setVehicleStages([]);
      setCustomerSearchText("");

      setVehicleInfo(null);
      setIsChassisNumberLoaded(skipChassisNumber);
    }
  }, [resetKey, form]);


  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);


  const searchTimeoutRef = useRef(null);
  

  useEffect(() => {
    if (skipChassisNumber && initialValues?.customerId && initialValues?.vehicleId && initialValues?.chassisNumber) {

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


  const handleChassisNumberLookup = async (chassisNumber, e) => {

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }


    if (isSearchingChassis) {
      return;
    }

    if (!chassisNumber || chassisNumber.trim() === "") {
      toast.warning("Vui lòng nhập số khung để tìm kiếm!");
      return;
    }

    setIsSearchingChassis(true);
    try {
      const response = await getVehicleInfoFromChassisService(chassisNumber.trim());
      
      



      let customer, vehicle, vehicleStages;
      
      if (response && response.success && response.data) {

        ({ customer, vehicle, vehicleStages } = response.data);

        if (!vehicleStages && response.data.vehicleStage) {
          vehicleStages = [response.data.vehicleStage];
        }
      } else if (response && (response.customer || response.vehicle || response.vehicleStages || response.vehicleStage)) {

        ({ customer, vehicle, vehicleStages } = response);

        if (!vehicleStages && response.vehicleStage) {
          vehicleStages = [response.vehicleStage];
        }
      } else {
        throw new Error("Không tìm thấy thông tin từ số khung. Response structure không đúng.");
      }
      

      if (!Array.isArray(vehicleStages)) {
        vehicleStages = vehicleStages ? [vehicleStages] : [];
      }
      
      

      const vehicleStage = vehicleStages.find(s => s.status === "UPCOMING") || vehicleStages[0] || null;
      

        setVehicleInfo({ customer, vehicle, vehicleStage, vehicleStages });
        

        form.setFieldsValue({ 
          chassisNumber: chassisNumber.trim(),
          ...(customer?.id && { customerId: customer.id }),
          ...(vehicle?.id && { vehicleId: vehicle.id }),
          ...(vehicleStage?.id && { vehicleStageId: vehicleStage.id }),

          ...(vehicleStage?.maintenanceStageId && { maintenanceStageId: vehicleStage.maintenanceStageId }),
        });
        


        if (vehicle?.id) {
          const currentType = form.getFieldValue("type");

          if (currentType === "MAINTENANCE_TYPE") {
            loadVehicleStages(vehicle.id, "MAINTENANCE_TYPE");
          }
        }
        

        if (vehicleStage?.id) {
          const currentType = form.getFieldValue("type");

          if (currentType === "MAINTENANCE_TYPE" && vehicle?.id) {
            loadVehicleStages(vehicle.id, "MAINTENANCE_TYPE");
          }

        }
        

        setIsChassisNumberLoaded(true);
        

        toast.success("Tìm thấy thông tin xe và khách hàng!");
    } catch (error) {
      setVehicleInfo(null);
      setIsChassisNumberLoaded(false);
      

      const errorMessage = error?.response?.data?.message || error?.data?.message || error?.message || "Không tìm thấy thông tin từ số khung. Vui lòng kiểm tra lại!";
      toast.error(errorMessage);
    } finally {
      setIsSearchingChassis(false);
      setIsSearchingChassis(false);
    }
  };


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
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };


  const handleCustomerSearch = (value) => {
    setCustomerSearchText(value);
    

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    

    searchTimeoutRef.current = setTimeout(() => {
      loadCustomers(value);
    }, 300);
  };


  useEffect(() => {
    const fetchInit = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const accountId = user?.accountResponse?.id;
        
        let staffServiceCenterId = 
          user?.accountResponse?.serviceCenterId || 
          user?.serviceCenterId || 
          user?.staff?.serviceCenterId ||
          user?.accountResponse?.staff?.serviceCenterId ||
          null;

        // ✅ Lấy serviceCenterId từ staff của user hiện tại
        if (!staffServiceCenterId && accountId) {
          try {
            const staffResponse = await getStaffByAccountId(accountId);
            const staffData = staffResponse?.data?.rowDatas?.[0] || 
                              staffResponse?.data?.[0] ||
                              staffResponse?.data?.data ||
                              staffResponse?.data ||
                              staffResponse;
            staffServiceCenterId = staffData?.serviceCenterId || 
                                   staffData?.serviceCenter?.id ||
                                   null;
          } catch (err) {
            console.error("Error fetching staff service center:", err);
          }
        }

        setCurrentServiceCenterId(staffServiceCenterId);

        // ✅ Load service center: ưu tiên center của staff, nhưng vẫn merge với tất cả center và center trong initialValues
        let centersList = [];

        // Ưu tiên center của staff
        if (staffServiceCenterId) {
          try {
            const centerRes = await getServiceCenterById(staffServiceCenterId);
            const centerData = centerRes?.data?.data || centerRes?.data || centerRes;
            if (centerData) centersList = [centerData];
          } catch (err) {
            console.error("Error fetching service center:", err);
          }
        }

        // Luôn load tất cả center để đảm bảo dropdown có đủ
        try {
          const cenRes = await getServiceCentersService();
          const allCenters = Array.isArray(cenRes) ? cenRes : [];
          const merged = [...centersList];
          allCenters.forEach((c) => {
            if (!merged.find((m) => m.id === c.id)) merged.push(c);
          });
          centersList = merged;
        } catch (err) {
          console.error("Error fetching all service centers:", err);
        }

        // Nếu initialValues có serviceCenterId khác staff, fetch thêm để chắc chắn có trong danh sách
        const initialCenterId = initialValues?.serviceCenterId;
        if (initialCenterId && !centersList.find((c) => c.id === initialCenterId)) {
          try {
            const extraCenterRes = await getServiceCenterById(initialCenterId);
            const extraCenter = extraCenterRes?.data?.data || extraCenterRes?.data || extraCenterRes;
            if (extraCenter) centersList = [...centersList, extraCenter];
          } catch (err) {
            console.error("Error fetching initial service center:", err);
          }
        }

        setCenters(centersList);

        await loadCustomers();
        await loadCampaigns();

        if (staffServiceCenterId) {
          form.setFieldsValue({ serviceCenterId: staffServiceCenterId });
        }

        if (initialValues) {
          const initialCenterId = initialValues.serviceCenterId || staffServiceCenterId;
          form.setFieldsValue({
            ...initialValues,
            serviceCenterId: initialCenterId,
          });

          if (initialValues.customerId) {
            handleCustomerChange(initialValues.customerId, false);
          }

          const date = initialValues.appointmentDate;
          if (initialCenterId && date) {
            buildSlots(initialCenterId, date);
          }

          if (initialValues.vehicleId && initialValues.type === "MAINTENANCE_TYPE") {
            setTimeout(() => {
              loadVehicleStages(initialValues.vehicleId, initialValues.type);
            }, 500);
          }
        } else if (staffServiceCenterId) {
          form.setFieldsValue({ serviceCenterId: staffServiceCenterId });
        }
      } catch (err) {
        console.error("Error in fetchInit:", err);
      }
    };

    fetchInit();

  }, []);


  const handleCustomerChange = async (customerId, clearVehicle = true) => {
    try {
      setLoadingVehicles(true);

      if (clearVehicle) {
        form.setFieldsValue({ vehicleId: undefined });
        setVehicleStages([]);
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
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };


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

    const dateStr = dateObj.format("YYYY-MM-DD");
    const isSameDate = (slotDate) => {
      if (!slotDate) return false;
      const d = dayjs(slotDate);
      if (!d.isValid()) return false;
      return d.format("YYYY-MM-DD") === dateStr;
    };
    const now = dayjs();
    const isToday = dateObj.isSame(now, "day");

    let slots = center.serviceCenterSlots.filter(
      (s) => s.isActive && isSameDate(s.date)
    );

    if (isToday) {
      const currentHour = now.hour();
      const currentMinute = now.minute();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      
      slots = slots.filter((slot) => {
        const slotTime = slot.slotTime || "";
        const match = slotTime.match(/H(\d{2})_(\d{2})/);
        if (!match) return false; 
        
        const startHour = parseInt(match[1], 10);
        const startTimeInMinutes = startHour * 60;
        
        const bufferMinutes = 30;
        return startTimeInMinutes > (currentTimeInMinutes + bufferMinutes);
      });
    }

    // ✅ Sort slots theo thứ tự thời gian từ nhỏ đến lớn
    slots.sort((a, b) => {
      const getStartHour = (slotTime) => {
        const match = slotTime?.match(/H(\d{2})_(\d{2})/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return getStartHour(a.slotTime) - getStartHour(b.slotTime);
    });

    setAvailableSlots(slots);
    form.setFieldsValue({ slotTime: undefined });
  };





  const handleDateChange = (date) => {
    const centerId = form.getFieldValue("serviceCenterId") || currentServiceCenterId;
    if (centerId && date) {
      buildSlots(centerId, date);
    } else {
      setAvailableSlots([]);
      form.setFieldsValue({ slotTime: undefined });
    }
  };

  useEffect(() => {
    const selectedDate = form.getFieldValue("appointmentDate");
    const centerId = form.getFieldValue("serviceCenterId") || currentServiceCenterId;
    
    if (centers.length > 0 && centerId && selectedDate) {
      buildSlots(centerId, selectedDate);
    }
  }, [centers, currentServiceCenterId]);


  const disabledDate = (current) => {
    if (!current) return false;
    
    const now = dayjs();
    const today = now.startOf("day");
    const currentHour = now.hour();
    
   
    if (current.isBefore(today, "day")) {
      return true;
    }
    
    
    if (current.isSame(today, "day") && currentHour >= 18) {
      return true;
    }
    
    return false;
  };


  const loadVehicleStages = async (vehicleId, type) => {

    if (type !== "MAINTENANCE_TYPE" || !vehicleId) {
      setVehicleStages([]);
      form.setFieldsValue({ vehicleStageId: undefined });
      return;
    }

    try {
      setLoadingVehicleStages(true);
      const currentVehicleStageId = form.getFieldValue("vehicleStageId");
      if (currentVehicleStageId) {
        form.setFieldsValue({ vehicleStageId: undefined });
      }
      
      const stages = await getVehicleStagesService(vehicleId, {
        page: 1,
        pageSize: 100,
      });

      


      const availableStages = (stages || []).filter(
        (stage) => {
          const status = stage.status?.toUpperCase();
          const isAvailable = status === "UPCOMING" || status === "NO_START";
          return isAvailable;
        }
      );


      setVehicleStages(availableStages);
      

      const upcomingStage = availableStages.find(s => (s.status || "").toUpperCase() === "UPCOMING");
      
      if (currentVehicleStageId) {
        const stageExists = availableStages.find(s => s.id === currentVehicleStageId);
        if (stageExists) {
          setTimeout(() => {
            form.setFieldsValue({ vehicleStageId: currentVehicleStageId });
          }, 100);
        }
      } else if (upcomingStage?.id) {
        setTimeout(() => {
          form.setFieldsValue({ vehicleStageId: upcomingStage.id });
        }, 100);
      }
    } catch (err) {
      setVehicleStages([]);
      form.setFieldsValue({ vehicleStageId: undefined });
    } finally {
      setLoadingVehicleStages(false);
    }
  };


  const handleVehicleChange = (vehicleId) => {
    const type = form.getFieldValue("type");
    loadVehicleStages(vehicleId, type);
  };


  const loadCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const programsList = await getCampaignsService({
        page: 1,
        pageSize: 100,
        status: "ACTIVE",
      });
      

      const allPrograms = Array.isArray(programsList) ? programsList : [];
      const campaignsList = allPrograms.filter(p => p.type === "CAMPAIGN" || !p.type);
      const recallsList = allPrograms.filter(p => p.type === "RECALL");
      
      setCampaigns(campaignsList);
      setRecalls(recallsList);
    } catch (err) {
      setCampaigns([]);
      setRecalls([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };


  const handleTypeChange = (type) => {
    const vehicleId = form.getFieldValue("vehicleId");
    loadVehicleStages(vehicleId, type);
    

    if (type !== "MAINTENANCE_TYPE") {
      form.setFieldsValue({ vehicleStageId: undefined });
    }
    

    if (type !== "CAMPAIGN_TYPE") {
      form.setFieldsValue({ programId: undefined });
    }
    

    if (type !== "RECALL_TYPE") {
      form.setFieldsValue({ recallId: undefined });
    }
  };


  const handleCampaignChange = (programId) => {
    if (programId) {

      form.setFieldsValue({ 
        type: "CAMPAIGN_TYPE",
        programId: programId,
        recallId: undefined
      });

      form.setFieldsValue({ vehicleStageId: undefined });
    } else {

      form.setFieldsValue({ programId: undefined });
    }
  };


  const handleRecallChange = (recallId) => {
    if (recallId) {

      form.setFieldsValue({ 
        type: "RECALL_TYPE",
        recallId: recallId,
        programId: undefined
      });

      form.setFieldsValue({ vehicleStageId: undefined });
    } else {

      form.setFieldsValue({ recallId: undefined });
    }
  };


  const handleFinish = (values) => {
    const appointmentDate = values.appointmentDate
      ? values.appointmentDate.format("YYYY-MM-DD")
      : null;


    const serviceCenterId = values.serviceCenterId || currentServiceCenterId;

    // Validation đã được xử lý bởi Form.Item rules
    let appointmentType = values.type;
    let programId = null;
    

    if (values.programId) {
      appointmentType = "CAMPAIGN_TYPE";
      programId = values.programId;
    }
    

    if (values.recallId) {
      appointmentType = "RECALL_TYPE";
      programId = values.recallId;
    }


    const customerId = values.customerId || form.getFieldValue("customerId");
    const vehicleId = values.vehicleId || form.getFieldValue("vehicleId");
    

    if (!values.chassisNumber || values.chassisNumber.trim() === "") {
      throw new Error("Vui lòng nhập số khung!");
    }


    const vehicleStageId = appointmentType === "MAINTENANCE_TYPE" 
      ? (values.vehicleStageId || form.getFieldValue("vehicleStageId") || null)
      : null;

    const payload = {
      serviceCenterId: serviceCenterId,
      customerId: customerId || null,
      vehicleId: vehicleId || null,
      vehicleStageId: vehicleStageId,
      slotTime: values.slotTime,
      campaignId: programId,
      appointmentDate,
      estimatedCost: values.estimatedCost || 0,
      actualCost: 0,
      status: "PENDING",
      type: appointmentType,
      note: values.note || "",
    };

    onSubmit?.(payload);
    

    form.resetFields();
    setVehicles([]);
    setAvailableSlots([]);
    setVehicleStages([]);
    

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
        
        
        {!isChassisNumberLoaded && (
        <Card
            style={{ 
              marginBottom: 24, 
              borderRadius: 12,
              border: "1px solid #e8e8e8",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          bodyStyle={{ padding: "24px" }}>
      <Form.Item
                  label={
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(255, 77, 79, 0.3)",
                    }}
                  >
                    <Car size={18} color="#fff" />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#262626" }}>Nhập số khung để tìm thông tin</span>
                </div>
                  }
                  name='chassisNumber'
                  normalize={(value) => (value ? value.toUpperCase() : value)}
              rules={[{ required: true, message: "Nhập số khung!" }]}
              style={{ marginBottom: 0 }}>
              <Row gutter={[12, 0]}>
                    <Col flex="auto">
                      <Input
                    placeholder='Nhập số khung (VIN)'
                        allowClear
                        size="large"
                    style={{
                      borderRadius: 8,
                      fontSize: 14,
                    }}
                          onInput={(e) => {
                            if (e && e.target && typeof e.target.value === "string") {
                              // Chỉ cho phép A-Z và số, ép thành chữ hoa ngay khi nhập
                              const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                              if (upper !== e.target.value) {
                                e.target.value = upper;
                              }
                            }
                          }}
                        onPressEnter={(e) => {
                          const chassisNumber = e.target.value;
                      handleChassisNumberLookup(chassisNumber, e);
                        }}
                      />
                    </Col>
                    <Col>
                      <Button
                        type="primary"
                        icon={<Search size={16} />}
                        size="large"
                        danger
                        loading={isSearchingChassis}
                        disabled={isSearchingChassis}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                          const chassisNumber = form.getFieldValue("chassisNumber");
                          handleChassisNumberLookup(chassisNumber);
                        }}
                    htmlType="button"
                        style={{
                          height: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          whiteSpace: "nowrap",
                      background: "linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)",
                      border: "none",
                      borderRadius: 8,
                      boxShadow: "0 2px 8px rgba(255, 77, 79, 0.3)",
                        }}>
                        Tìm kiếm
                      </Button>
                    </Col>
                  </Row>
      </Form.Item>
          </Card>
              )}
              
        
        {isChassisNumberLoaded && vehicleInfo && (
          <>
              
                <Form.Item name='chassisNumber' hidden>
                  <Input type='hidden' />
      </Form.Item>

                        <Card 
                          title={
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(255, 77, 79, 0.3)",
                    }}
                  >
                    <Car size={18} color="#fff" />
                              </div>
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#262626" }}>
                    Thông tin khách hàng và xe
                  </span>
                </div>
              }
              style={{ 
                marginBottom: 24, 
                borderRadius: 12,
                border: "1px solid #e8e8e8",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
              headStyle={{ 
                borderBottom: "1px solid #f0f0f0", 
                padding: "20px 24px",
                background: "#fafafa",
                borderRadius: "12px 12px 0 0",
              }}
                          bodyStyle={{ padding: "24px" }}>
              <Row gutter={[16, 0]}>
                <Col xs={24}>
              
              {vehicleInfo ? (
                <div style={{ marginTop: 20 }}>
                  <Row gutter={[20, 20]}>
                    
                    {vehicleInfo.customer && (
                      <Col xs={24} lg={12}>
                        <Card
                          bodyStyle={{ padding: "20px 24px" }}
                          style={{
                            borderRadius: 12,
                            border: "1px solid #e8e8e8",
                            background: "#fff",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            height: "100%",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: "10px",
                                background: "linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 12,
                                boxShadow: "0 2px 8px rgba(255, 77, 79, 0.3)",
                              }}
                            >
                              <User size={20} color="#fff" />
                            </div>
                            <Text strong style={{ fontSize: 16, color: "#262626" }}>
                              Thông tin khách hàng
                            </Text>
                          </div>

                          <div style={{ 
                            height: 1, 
                            background: "linear-gradient(90deg, #e8e8e8 0%, transparent 100%)",
                            marginBottom: 20 
                          }} />

                          <Space direction="vertical" size={16} style={{ width: "100%" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>Họ tên</Text>
                              <Text strong style={{ fontSize: 14, color: "#262626" }}>
                                {vehicleInfo.customer.firstName} {vehicleInfo.customer.lastName}
                              </Text>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Space size={8}>
                                <Hash size={16} style={{ color: "#ff4d4f" }} />
                                <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>Mã KH</Text>
                                </Space>
                              <Tag 
                                color="red" 
                                style={{ 
                                  borderRadius: 6, 
                                  padding: "4px 12px",
                                  fontSize: 13,
                                  fontWeight: 500,
                                  border: "none",
                                }}
                              >
                                {vehicleInfo.customer.customerCode}
                              </Tag>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Space size={8}>
                                <Phone size={16} style={{ color: "#ff4d4f" }} />
                                <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>SĐT</Text>
                                </Space>
                              <Text strong style={{ fontSize: 14, color: "#262626" }}>
                              {vehicleInfo.customer.account?.phone || "N/A"}
                              </Text>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Space size={8}>
                                <Mail size={16} style={{ color: "#ff4d4f" }} />
                                <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>Email</Text>
                                </Space>
                              <Text strong style={{ fontSize: 14, color: "#262626" }}>
                              {vehicleInfo.customer.account?.email || "N/A"}
                              </Text>
                            </div>
                          </Space>
                        </Card>
                      </Col>
                    )}
                    
                    
                    {vehicleInfo.vehicle && (
                      <Col xs={24} lg={12}>
                        <Card 
                          bodyStyle={{ padding: "20px 24px" }}
                          style={{
                            borderRadius: 12,
                            border: "1px solid #e8e8e8",
                            background: "#fff",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            height: "100%",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: "10px",
                                background: "linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 12,
                                boxShadow: "0 2px 8px rgba(255, 77, 79, 0.3)",
                              }}
                            >
                              <CarFront size={20} color="#fff" />
                              </div>
                            <Text strong style={{ fontSize: 16, color: "#262626" }}>
                              Thông tin xe
                            </Text>
                          </div>

                          <div style={{ 
                            height: 1, 
                            background: "linear-gradient(90deg, #e8e8e8 0%, transparent 100%)",
                            marginBottom: 20 
                          }} />

                          <Space direction="vertical" size={16} style={{ width: "100%" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>Mẫu xe</Text>
                              <Text strong style={{ fontSize: 14, color: "#262626" }}>
                                {vehicleInfo.vehicle.modelName || "N/A"}
                              </Text>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Space size={8}>
                                <Hash size={16} style={{ color: "#ff4d4f" }} />
                                <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>Số khung</Text>
                            </Space>
                              <Tag 
                                color="red" 
                                style={{ 
                                  borderRadius: 6, 
                                  padding: "4px 12px",
                                  fontSize: 13,
                                  fontWeight: 500,
                                  border: "none",
                                }}
                              >
                                {vehicleInfo.vehicle.chassisNumber || "N/A"}
                              </Tag>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>Số máy</Text>
                              <Text strong style={{ fontSize: 14, color: "#262626" }}>
                              {vehicleInfo.vehicle.engineNumber || "N/A"}
                              </Text>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Space size={8}>
                                <Palette size={16} style={{ color: "#ff4d4f" }} />
                                <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>Màu sắc</Text>
                                </Space>
                              <Tag 
                                style={{ 
                                  borderRadius: 6, 
                                  padding: "4px 12px",
                                  fontSize: 13,
                                  fontWeight: 500,
                                  border: "none",
                                  backgroundColor: getColorHex(vehicleInfo.vehicle.color),
                                  color: vehicleInfo.vehicle.color?.toUpperCase() === "WHITE" || vehicleInfo.vehicle.color?.toUpperCase() === "YELLOW" || vehicleInfo.vehicle.color?.toUpperCase() === "GOLD" ? "#000000" : "#ffffff",
                                }}
                              >
                                {translateColor(vehicleInfo.vehicle.color)}
                              </Tag>
                            </div>
                          </Space>
                        </Card>
                      </Col>
                    )}
                  </Row>
                </div>
              ) : null}
            </Col>
          </Row>
        </Card>
          </>
        )}

        {/* Card riêng hiển thị TẤT CẢ các mốc bảo dưỡng */}
        {vehicleInfo && vehicleInfo.vehicleStages && vehicleInfo.vehicleStages.length > 0 && (
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(255, 77, 79, 0.3)",
                  }}
                >
                  <Wrench size={20} color="#fff" />
                </div>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#262626" }}>
                  Thông tin bảo dưỡng
                </span>
              </div>
            }
            style={{ 
              marginBottom: 24, 
              borderRadius: 12,
              border: "1px solid #e8e8e8",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
            headStyle={{ 
              borderBottom: "1px solid #f0f0f0", 
              padding: "20px 24px",
              background: "#fafafa",
              borderRadius: "12px 12px 0 0",
            }}
            bodyStyle={{ padding: "24px" }}
          >
            <Row gutter={[16, 16]}>
              {/* Hiển thị TẤT CẢ các mốc bảo dưỡng */}
              {vehicleInfo.vehicleStages
                .sort((a, b) => {
                  // Sắp xếp: UPCOMING trước, sau đó các mốc khác
                  const statusA = (a.status || "").toUpperCase();
                  const statusB = (b.status || "").toUpperCase();
                  if (statusA === "UPCOMING" && statusB !== "UPCOMING") return -1;
                  if (statusA !== "UPCOMING" && statusB === "UPCOMING") return 1;
                  return 0;
                })
                .map((stage, index) => {
                  const status = (stage.status || "").toUpperCase();
                  // Map tất cả các trạng thái
                  const statusLabelMap = {
                    "UPCOMING": "Sắp tới",
                    "NO_START": "Chưa bắt đầu",
                    "COMPLETED": "Đã hoàn thành",
                    "IN_PROGRESS": "Đang thực hiện",
                    "SKIPPED": "Đã bỏ qua",
                    "EXPIRED": "Đã hết hạn",
                  };
                  const statusLabel = statusLabelMap[status] || status;
                  const tagColorMap = {
                    "UPCOMING": "orange",
                    "NO_START": "blue",
                    "COMPLETED": "green",
                    "IN_PROGRESS": "processing",
                    "SKIPPED": "default",
                    "EXPIRED": "red",
                  };
                  const tagColor = tagColorMap[status] || "default";
                  
                  return (
                    <Col xs={24} sm={12} lg={8} key={stage.id || index}>
                      <div style={{ 
                        padding: "16px",
                        background: status === "UPCOMING" ? "#fff7f3" : status === "COMPLETED" ? "#f6ffed" : status === "EXPIRED" ? "#fff1f0" : "#f0f0f0",
                        borderRadius: 8,
                        border: status === "UPCOMING" ? "1px solid #ffccc7" : status === "COMPLETED" ? "1px solid #b7eb8f" : status === "EXPIRED" ? "1px solid #ffccc7" : "1px solid #d9d9d9",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column"
                      }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                          <Tag color={tagColor} style={{ fontSize: 12, padding: "4px 10px" }}>
                            {statusLabel}
                          </Tag>
                        </div>
                        
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div style={{ marginBottom: 12 }}>
                            <Text type="secondary" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Tên mốc bảo dưỡng</Text>
                            <Text strong style={{ fontSize: 14, color: "#262626" }}>
                              {stage.maintenanceStage?.name || stage.maintenanceStageName || `Mốc bảo dưỡng ${index + 1}`}
                            </Text>
                          </div>
                          
                          <Space direction="vertical" size={8} style={{ width: "100%" }}>
                            {stage.maintenanceStage?.mileage && (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Số KM</Text>
                                <Text style={{ fontSize: 13, color: "#262626" }}>
                                  {Number(stage.maintenanceStage.mileage).toLocaleString("vi-VN")} km
                                </Text>
                              </div>
                            )}
                            {stage.expectedImplementationDate && (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Ngày dự kiến</Text>
                                <Text style={{ fontSize: 13, color: "#262626" }}>
                                  {dayjs(stage.expectedImplementationDate).format("DD/MM/YYYY")}
                                </Text>
                              </div>
                            )}
                          </Space>
                        </div>
                      </div>
                    </Col>
                  );
                })}
            </Row>
          </Card>
        )}

        
        <Form.Item name='serviceCenterId' hidden>
          <Input type='hidden' />
      </Form.Item>

        
        {isChassisNumberLoaded && (
          <>
        
        {!hideServiceTypeCard && (
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(255, 77, 79, 0.3)",
                  }}
                >
                  <Settings size={18} color="#fff" />
                </div>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#262626" }}>
                  Loại dịch vụ và thông tin bổ sung
                </span>
              </div>
            }
            style={{ 
              marginBottom: 24, 
              borderRadius: 12,
              border: "1px solid #e8e8e8",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
            headStyle={{ 
              borderBottom: "1px solid #f0f0f0", 
              padding: "20px 24px",
              background: "#fafafa",
              borderRadius: "12px 12px 0 0",
            }}
            bodyStyle={{ padding: "24px" }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Wrench size={16} style={{ color: "#ff4d4f" }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#262626" }}>Loại dịch vụ</span>
                  </div>
                }
                name='type'
                rules={[{ required: !hideServiceTypeCard, message: "Vui lòng chọn loại dịch vụ!" }]}>
                <Select
                  allowClear
                  placeholder='Chọn loại dịch vụ'
                  onChange={handleTypeChange}
                  disabled={!isChassisNumberLoaded}
                  style={{ 
                    width: "100%",
                    borderRadius: 8,
                  }}>
          <Option value='MAINTENANCE_TYPE'>Bảo dưỡng</Option>
          <Option value='REPAIR_TYPE'>Sửa chữa</Option>
          <Option value='WARRANTY_TYPE'>Bảo hành</Option>
                  <Option value='CAMPAIGN_TYPE'>Chiến dịch</Option>
                  <Option value='RECALL_TYPE'>Triệu hồi</Option>
                </Select>
              </Form.Item>
            </Col>

            
            {(form.getFieldValue("type") === "CAMPAIGN_TYPE" || form.getFieldValue("programId")) && (
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FileText size={16} style={{ color: "#ff4d4f" }} />
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#262626" }}>Chiến dịch</span>
                    </div>
                  }
                  name='programId'
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (getFieldValue("type") === "CAMPAIGN_TYPE" && !value) {
                          return Promise.reject(new Error("Vui lòng chọn chiến dịch!"));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                  tooltip='Chọn chiến dịch cho lịch hẹn'>
                  <Select
                    placeholder='Chọn chiến dịch'
                    loading={loadingCampaigns}
                    onChange={handleCampaignChange}
                    disabled={!isChassisNumberLoaded}
                    style={{ 
                      width: "100%",
                      borderRadius: 8,
                    }}>
                    {campaigns.map((campaign) => {

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

            
            {(form.getFieldValue("type") === "RECALL_TYPE" || form.getFieldValue("recallId")) && (
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FileText size={16} style={{ color: "#ff4d4f" }} />
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#262626" }}>Triệu hồi</span>
                    </div>
                  }
                  name='recallId'
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (getFieldValue("type") === "RECALL_TYPE" && !value) {
                          return Promise.reject(new Error("Vui lòng chọn chương trình triệu hồi!"));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                  tooltip='Chọn chương trình triệu hồi cho lịch hẹn'>
                  <Select
                    placeholder='Chọn chương trình triệu hồi'
                    loading={loadingCampaigns}
                    onChange={handleRecallChange}
                    disabled={!isChassisNumberLoaded}
                    style={{ 
                      width: "100%",
                      borderRadius: 8,
                    }}>
                    {recalls.map((recall) => {

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

            
            {form.getFieldValue("type") === "MAINTENANCE_TYPE" && (
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FileText size={16} style={{ color: "#ff4d4f" }} />
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#262626" }}>Mốc bảo dưỡng</span>
                    </div>
                  }
                  name='vehicleStageId'
                  tooltip='Chọn mốc bảo dưỡng cho xe (chỉ hiển thị các mốc sắp tới)'>
                  <Select
                    placeholder='Chọn mốc bảo dưỡng'
                    loading={loadingVehicleStages}
                    disabled={!isChassisNumberLoaded || !form.getFieldValue("vehicleId")}
                    style={{ 
                      width: "100%",
                      borderRadius: 8,
                    }}
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) => {
                      const text = option?.children?.props?.children?.[0]?.props?.children || "";
                      return text.toLowerCase().includes(input.toLowerCase());
                    }}
                    notFoundContent={loadingVehicleStages ? <Loading size="small" /> : "Không có mốc bảo dưỡng"}
                    value={(() => {
                      const selectedId = form.getFieldValue("vehicleStageId");
                      if (!selectedId || vehicleStages.length === 0) return undefined;
                      const selectedStage = vehicleStages.find(s => s.id === selectedId);
                      // ✅ Chỉ trả về value nếu tìm thấy stage trong danh sách (tránh hiển thị ID)
                      return selectedStage ? selectedId : undefined;
                    })()}>
                    {vehicleStages
                      .sort((a, b) => {

                        const statusA = (a.status || "").toUpperCase();
                        const statusB = (b.status || "").toUpperCase();
                        if (statusA === "UPCOMING" && statusB !== "UPCOMING") return -1;
                        if (statusA !== "UPCOMING" && statusB === "UPCOMING") return 1;
                        return 0;
                      })
                      .map((stage) => {
                        const status = (stage.status || "").toUpperCase();
                        const statusLabel = status === "UPCOMING" ? "Sắp tới" : status === "NO_START" ? "Chưa bắt đầu" : "";
                        const isUpcoming = status === "UPCOMING";
                        const displayName = `${stage.maintenanceStage?.name || "Mốc bảo dưỡng"}${stage.maintenanceStage?.mileage ? ` - ${stage.maintenanceStage.mileage}` : ""}`;
                        
                        return (
                      <Option key={stage.id} value={stage.id}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span>
                        {displayName}
                              </span>
                              {statusLabel && (
                                <Tag color={isUpcoming ? "red" : "default"} style={{ margin: 0 }}>
                                  {statusLabel}
                                </Tag>
                              )}
                            </div>
                      </Option>
                        );
                      })}
        </Select>
      </Form.Item>
              </Col>
            )}
          </Row>

          
          {form.getFieldValue("type") === "REPAIR_TYPE" && (
            <>
              <div style={{ 
                height: 1, 
                background: "linear-gradient(90deg, transparent 0%, #e8e8e8 20%, #e8e8e8 80%, transparent 100%)",
                margin: "24px 0" 
              }} />

          <Form.Item
            label={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <FileText size={16} style={{ color: "#ff4d4f" }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#262626" }}>
Nội dung sửa chữa                    </span>
                  </div>
            }
            name='note'>
            <Input.TextArea
              rows={4}
                  placeholder="Nhập tình trạng xe"
              showCount
              maxLength={500}
              disabled={!isChassisNumberLoaded}
                  style={{
                    borderRadius: 8,
                    fontSize: 14,
                  }}
            />
          </Form.Item>
            </>
          )}
          </Card>
        )}

        
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(255, 77, 79, 0.3)",
                }}
              >
                <Calendar size={18} color="#fff" />
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#262626" }}>
                Thời gian hẹn
              </span>
            </div>
          }
          style={{ 
            marginBottom: 24, 
            borderRadius: 12,
            border: "1px solid #e8e8e8",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
          headStyle={{ 
            borderBottom: "1px solid #f0f0f0", 
            padding: "20px 24px",
            background: "#fafafa",
            borderRadius: "12px 12px 0 0",
          }}
          bodyStyle={{ padding: "24px" }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
      <Form.Item
                label={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Calendar size={16} style={{ color: "#ff4d4f" }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#262626" }}>Ngày hẹn</span>
                  </div>
                }
        name='appointmentDate'
        rules={[{ required: true, message: "Chọn ngày hẹn!" }]}>
                <DatePicker
                  style={{ 
                    width: "100%",
                    borderRadius: 8,
                  }}
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Clock size={16} style={{ color: "#ff4d4f" }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#262626" }}>Khung giờ</span>
                  </div>
                }
        name='slotTime'
        rules={[{ required: true, message: "Chọn khung giờ!" }]}>
        <Select
                  placeholder="Chọn khung giờ"
                  disabled={!isChassisNumberLoaded || !availableSlots.length}
                  style={{ 
                    width: "100%",
                    borderRadius: 8,
                  }}>
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

        
        <Button
          type='primary'
          htmlType='submit'
          loading={loading}
          block
          size="large"
          disabled={!isChassisNumberLoaded}
          style={{
            height: "52px",
            fontSize: "16px",
            fontWeight: 600,
            borderRadius: 12,
            marginTop: 16,
            background: "linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)",
            border: "none",
            boxShadow: "0 4px 12px rgba(255, 77, 79, 0.4)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 77, 79, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 77, 79, 0.4)";
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
