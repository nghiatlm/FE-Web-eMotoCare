import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, Button } from "antd";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";
import { getRMAService, getCustomerByRMAService } from "../../services/rmaService";
import { getRmaById } from "../../api/rmasApi";
import RMADetails from "../../components/service-staff/RMADetails";

export default function StaffRMADetailPage() {
  const { rmaId } = useParams();
  const navigate = useNavigate();
  const [rma, setRma] = useState(null);
  const [rmaDetails, setRmaDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rmaId) {
      toast.error("Không tìm thấy mã RMA");
      navigate("/staff/warranty");
      return;
    }

    loadRMAData();
  }, [rmaId]);

  const loadRMAData = async () => {
    setLoading(true);
    try {
      const response = await getRmaById(rmaId);
      const rmaData = response?.data?.data || response?.data || response;
      
      if (!rmaData) {
        toast.error("Không tìm thấy RMA");
        navigate("/staff/warranty");
        return;
      }

      const detailsList = rmaData?.rmaDetails || [];
      
      let rmaWithCustomer = rmaData;
      try {
        const customer = await getCustomerByRMAService(rmaId);
        rmaWithCustomer = { ...rmaData, customer };
      } catch (e) {
      }

      setRma(rmaWithCustomer);
      setRmaDetails(Array.isArray(detailsList) ? detailsList : []);
    } catch (err) {
      toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể tải dữ liệu RMA"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!rma) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Không tìm thấy thông tin RMA</p>
        <Button onClick={() => navigate("/staff/warranty")}>Quay lại</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Button
        icon={<ArrowLeft size={18} />}
        onClick={() => navigate("/staff/warranty")}
        style={{ marginBottom: 16, color: "#ff4d4f", borderColor: "#ff4d4f" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#fff1f0";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#fff";
        }}>
        Quay lại danh sách
      </Button>
      <RMADetails rma={rma} details={rmaDetails} loading={false} />
    </div>
  );
}

