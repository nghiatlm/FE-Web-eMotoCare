import { Card, Empty } from "antd";
import Loading from "../Loading";
import { useState, useEffect } from "react";
import { fetchEVCheckByAppointmentService } from "../../services/evcheckService";

const PaymentInfo = ({ booking, onOpenPayment }) => {
  const [quoteItems, setQuoteItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalServiceFee, setTotalServiceFee] = useState(0);
  const [totalPartsFee, setTotalPartsFee] = useState(0);
  const [vat, setVat] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const appointmentId = booking?.id;

  useEffect(() => {
    if (!appointmentId) return;

    const loadQuoteFromEVCheck = async () => {
      setLoading(true);
      try {
        const evCheck = await fetchEVCheckByAppointmentService(appointmentId);

        let details = [];
        if (evCheck?.evCheckDetails) details = evCheck.evCheckDetails;
        else if (Array.isArray(evCheck)) details = evCheck;
        else if (evCheck?.data?.rowDatas) details = evCheck.data.rowDatas;

        if (details.length > 0) {
          const items = await Promise.all(details.map(async (item, idx) => {
            const remedies = String(
              item.remedies || item.solution || "NONE"
            ).toUpperCase();
            const pricePartRaw = Number(item.pricePart || 0);
            const priceService = Number(item.priceService || 0);
            const quantity = Number(item.quantity || 1);

            const pricePart = remedies === "REPLACE" ? pricePartRaw : 0;
            const lineTotal = (pricePart + priceService) * quantity;

            let partName = "";
            
            if (item.replacePart?.name) {
              partName = item.replacePart.name;
            }
            else if (item.proposedReplacePart?.name) {
              partName = item.proposedReplacePart.name;
            }
            else if (item.partItem?.part?.name) {
              partName = item.partItem.part.name;
            }
            else if (item.maintenanceStageDetail?.part?.name) {
              partName = item.maintenanceStageDetail.part.name;
            }
            else if (item.displayName) {
              partName = item.displayName;
            }
            else if (item.partName) {
              partName = item.partName;
            }
            else {
              const partItemId = item.partItemId || item.partItem?.id;
              if (partItemId && (!item.partItem?.part?.name)) {
                try {
                  const { getPartItemByIdService } = await import("../../services/partitemsService");
                  const partItemDetail = await getPartItemByIdService(partItemId);
                  if (partItemDetail?.part?.name) {
                    partName = partItemDetail.part.name;
                  }
                } catch (error) {
                }
              }
              if (!partName) {
                partName = "Hạng mục";
              }
            }

            const serial =
              item.partItem?.serialNumber ||
              item.replacePart?.serialNumber ||
              item.serialNumber ||
              "";

            let imageUrl = "";
            if (item.replacePart?.image) {
              imageUrl = item.replacePart.image;
            }
            else if (item.replacePart?.part?.image) {
              imageUrl = item.replacePart.part.image;
            }
            else if (item.proposedReplacePart?.image) {
              imageUrl = item.proposedReplacePart.image;
            }
            else if (item.proposedReplacePart?.part?.image) {
              imageUrl = item.proposedReplacePart.part.image;
            }
            else if (item.partItem?.part?.image) {
              imageUrl = item.partItem.part.image;
            }
            else if (item.maintenanceStageDetail?.part?.image) {
              imageUrl = item.maintenanceStageDetail.part.image;
            }
            else if (item.partItem?.image) {
              imageUrl = item.partItem.image;
            }
            else if (item.image) {
              imageUrl = item.image;
            }

            return {
              id: item.id || `item-${idx}`,
              name: partName,
              remedies,
              quantity,
              priceService,
              pricePartDisplay: pricePart,
              serial,
              imageUrl,
              totalAmount: lineTotal,
            };
          }));

          const filteredItems = items.filter((item) => item.totalAmount > 0);
          setQuoteItems(filteredItems);
          
          const serviceFee = filteredItems.reduce((s, i) => s + ((i.priceService || 0) * (i.quantity || 1)), 0);
          setTotalServiceFee(serviceFee);
          
          const partsFee = filteredItems.reduce((s, i) => {
            if (i.remedies === "REPLACE") {
              return s + ((i.pricePartDisplay || 0) * (i.quantity || 1));
            }
            return s;
          }, 0);
          setTotalPartsFee(partsFee);
          
          const vatAmount = Math.round((serviceFee + partsFee) * 0.08);
          setVat(vatAmount);
          
          const total = serviceFee + partsFee + vatAmount;
          setTotalAmount(total);
        } else {
          setQuoteItems([]);
          setTotalServiceFee(0);
          setTotalPartsFee(0);
          setVat(0);
          setTotalAmount(0);
        }
      } catch (e) {
        setQuoteItems([]);
        setTotalServiceFee(0);
        setTotalPartsFee(0);
        setVat(0);
        setTotalAmount(0);
      } finally {
        setLoading(false);
      }
    };

    loadQuoteFromEVCheck();
  }, [appointmentId]);

  if (loading) {
    return (
      <Card>
        <Loading />
      </Card>
    );
  }

  if (quoteItems.length === 0) {
    return (
      <Card
        title={
          <span className='flex items-center gap-2'>
            <span>Thông tin thanh toán</span>
          </span>
        }>
        <Empty description='Chưa có hạng mục nào để thanh toán' />
      </Card>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className='flex items-center gap-2'>
            <span>Thông tin thanh toán</span>
          </span>
          {onOpenPayment && (
            <a
              onClick={() => {
                // ✅ Kiểm tra trạng thái booking trước khi mở modal thanh toán
                const bookingStatus = booking?.status?.toUpperCase();
                if (bookingStatus === "WAITING_FOR_PAYMENT") {
                  toast.warning("Đã có thanh toán đang chờ xử lý. Vui lòng đợi thanh toán hoàn tất.");
                  return;
                }
                if (bookingStatus === "COMPLETED") {
                  toast.info("Lịch hẹn đã hoàn thành thanh toán.");
                  return;
                }
                onOpenPayment();
              }}
              style={{ 
                color: (booking?.status?.toUpperCase() === "WAITING_FOR_PAYMENT" || booking?.status?.toUpperCase() === "COMPLETED") 
                  ? "#999" 
                  : "#ff4d4f", 
                cursor: (booking?.status?.toUpperCase() === "WAITING_FOR_PAYMENT" || booking?.status?.toUpperCase() === "COMPLETED") 
                  ? "not-allowed" 
                  : "pointer", 
                fontWeight: 500 
              }}>
              Xử lý thanh toán
            </a>
          )}
        </div>
      }>
      <div style={{ padding: "16px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
            <span style={{ fontSize: 14, color: "#666" }}>Tổng phí dịch vụ:</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {totalServiceFee.toLocaleString("vi-VN")} ₫
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
            <span style={{ fontSize: 14, color: "#666" }}>Tổng phí phụ tùng:</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {totalPartsFee.toLocaleString("vi-VN")} ₫
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
            <span style={{ fontSize: 14, color: "#666" }}>VAT (8%):</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {vat.toLocaleString("vi-VN")} ₫
            </span>
          </div>
          <div style={{ 
            borderTop: "1px solid #e8e8e8", 
            marginTop: "8px", 
            paddingTop: "12px",
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#262626" }}>Tổng chi phí:</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#ff4d4f" }}>
              {totalAmount.toLocaleString("vi-VN")} ₫
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PaymentInfo;

