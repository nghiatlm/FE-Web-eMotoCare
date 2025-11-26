// src/pages/service-staff/StaffRMADetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, Button } from "antd";
import { toast } from "@/components/ui/sonner";
import { ArrowLeft } from "lucide-react";
import { getRMAService, getRMADetailsService, getCustomerByRMAService } from "../../services/rmaService";
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
      // Load RMA info
      const rmaData = await getRMAService();
      let rmaList = rmaData?.rowDatas || rmaData?.data?.rowDatas || (Array.isArray(rmaData) ? rmaData : []);
      if (!Array.isArray(rmaList)) rmaList = [];

      const foundRMA = rmaList.find((r) => r.id === rmaId);
      if (!foundRMA) {
        toast.error("Không tìm thấy RMA");
        navigate("/staff/warranty");
        return;
      }

      // Load customer for RMA
      let rmaWithCustomer = foundRMA;
      try {
        const customer = await getCustomerByRMAService(rmaId);
        rmaWithCustomer = { ...foundRMA, customer };
      } catch (e) {
        console.error("Không load được customer cho RMA", e);
      }

      setRma(rmaWithCustomer);

      // Load RMA details
      const detailsData = await getRMADetailsService({ rmaId });
      let detailsList =
        detailsData?.rowDatas ||
        detailsData?.data?.rowDatas ||
        (Array.isArray(detailsData) ? detailsData : []);

      if (!Array.isArray(detailsList)) detailsList = [];
      setRmaDetails(detailsList);
    } catch (err) {
      console.error("❌ Lỗi khi tải dữ liệu RMA:", err);
      toast.error("Không thể tải dữ liệu RMA");
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

