// src/components/service-staff/PaymentInfo.jsx
import { Card, Spin, Empty } from "antd";
import { useState, useEffect } from "react";
import { fetchEVCheckByAppointmentService } from "../../services/evcheckService";

const PaymentInfo = ({ booking, onOpenPayment }) => {
  const [quoteItems, setQuoteItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalServiceFee, setTotalServiceFee] = useState(0); // ✅ Tổng phí dịch vụ
  const [totalPartsFee, setTotalPartsFee] = useState(0); // ✅ Tổng phí phụ tùng
  const [vat, setVat] = useState(0); // ✅ VAT (8%)
  const [totalAmount, setTotalAmount] = useState(0); // ✅ Tổng chi phí

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
          // ✅ Fetch partItem nếu chưa có đầy đủ thông tin
          const items = await Promise.all(details.map(async (item, idx) => {
            const remedies = String(
              item.remedies || item.solution || "NONE"
            ).toUpperCase();
            const pricePartRaw = Number(item.pricePart || 0);
            const priceService = Number(item.priceService || 0);
            const quantity = Number(item.quantity || 1);

            // ✅ Chỉ tính tiền phụ tùng khi biện pháp là REPLACE
            const pricePart = remedies === "REPLACE" ? pricePartRaw : 0;
            const lineTotal = (pricePart + priceService) * quantity;

            // ✅ Lấy tên phụ tùng từ nhiều nguồn, ưu tiên theo thứ tự
            let partName = "";
            
            // 1. Từ replacePart (phụ tùng thay thế)
            if (item.replacePart?.name) {
              partName = item.replacePart.name;
            }
            // 2. Từ proposedReplacePart (phụ tùng đề xuất)
            else if (item.proposedReplacePart?.name) {
              partName = item.proposedReplacePart.name;
            }
            // 3. Từ partItem.part.name (phụ tùng của xe)
            else if (item.partItem?.part?.name) {
              partName = item.partItem.part.name;
            }
            // 4. Từ maintenanceStageDetail.part.name (bảo dưỡng)
            else if (item.maintenanceStageDetail?.part?.name) {
              partName = item.maintenanceStageDetail.part.name;
            }
            // 5. Từ displayName (tên hiển thị)
            else if (item.displayName) {
              partName = item.displayName;
            }
            // 6. Từ partName
            else if (item.partName) {
              partName = item.partName;
            }
            // 7. Thử fetch từ API nếu có partItemId nhưng chưa có part.name
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
                  console.error(`❌ Lỗi lấy thông tin partItem ${partItemId}:`, error);
                }
              }
              // 8. Fallback
              if (!partName) {
                partName = "Hạng mục";
              }
            }

            // Thông tin phụ tùng/serial để hiển thị
            const serial =
              item.partItem?.serialNumber ||
              item.replacePart?.serialNumber ||
              item.serialNumber ||
              "";

            // ✅ Lấy hình ảnh từ nhiều nguồn, ưu tiên theo thứ tự
            let imageUrl = "";
            // 1. Từ replacePart (phụ tùng thay thế)
            if (item.replacePart?.image) {
              imageUrl = item.replacePart.image;
            }
            // 2. Từ replacePart.part.image
            else if (item.replacePart?.part?.image) {
              imageUrl = item.replacePart.part.image;
            }
            // 3. Từ proposedReplacePart
            else if (item.proposedReplacePart?.image) {
              imageUrl = item.proposedReplacePart.image;
            }
            // 4. Từ proposedReplacePart.part.image
            else if (item.proposedReplacePart?.part?.image) {
              imageUrl = item.proposedReplacePart.part.image;
            }
            // 5. Từ partItem.part.image (phụ tùng của xe)
            else if (item.partItem?.part?.image) {
              imageUrl = item.partItem.part.image;
            }
            // 6. Từ maintenanceStageDetail.part.image (bảo dưỡng)
            else if (item.maintenanceStageDetail?.part?.image) {
              imageUrl = item.maintenanceStageDetail.part.image;
            }
            // 7. Từ partItem.image
            else if (item.partItem?.image) {
              imageUrl = item.partItem.image;
            }
            // 8. Từ item.image
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
          
          // ✅ Tính tổng phí dịch vụ (tổng của tất cả priceService * quantity)
          const serviceFee = filteredItems.reduce((s, i) => s + ((i.priceService || 0) * (i.quantity || 1)), 0);
          setTotalServiceFee(serviceFee);
          
          // ✅ Tính tổng phí phụ tùng (tổng của tất cả pricePart * quantity, chỉ khi REPLACE)
          const partsFee = filteredItems.reduce((s, i) => {
            if (i.remedies === "REPLACE") {
              return s + ((i.pricePartDisplay || 0) * (i.quantity || 1));
            }
            return s;
          }, 0);
          setTotalPartsFee(partsFee);
          
          // ✅ Tính VAT (8% của tổng phí dịch vụ + tổng phí phụ tùng)
          const vatAmount = Math.round((serviceFee + partsFee) * 0.08);
          setVat(vatAmount);
          
          // ✅ Tổng chi phí = tổng phí dịch vụ + tổng phí phụ tùng + VAT
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
        console.error(e);
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
        <Spin tip="Đang tải thông tin thanh toán..." />
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
              onClick={onOpenPayment}
              style={{ color: "#ff4d4f", cursor: "pointer", fontWeight: 500 }}>
              Xử lý thanh toán
            </a>
          )}
        </div>
      }>
      {/* ✅ Chỉ hiển thị tổng chi phí, không hiển thị bảng */}
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

