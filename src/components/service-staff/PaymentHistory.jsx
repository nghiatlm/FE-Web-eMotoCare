// src/components/service-staff/PaymentHistory.jsx
import { Card, Table, Tag, Spin, Empty } from "antd";
import { useState, useEffect } from "react";
import { fetchEVCheckByAppointmentService } from "../../services/evcheckService";
import { History } from "lucide-react";

const PaymentHistory = ({ booking }) => {
  const [quoteItems, setQuoteItems] = useState([]);
  const [loading, setLoading] = useState(false);
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

            return {
              id: item.id || `item-${idx}`,
              name: partName,
              remedies,
              quantity,
              priceService,
              pricePartDisplay: pricePart,
              serial,
              totalAmount: lineTotal,
            };
          }));

          const filteredItems = items.filter((item) => item.totalAmount > 0);
          setQuoteItems(filteredItems);
          setTotalAmount(
            filteredItems.reduce((s, i) => s + (i.totalAmount || 0), 0)
          );
        } else {
          setQuoteItems([]);
          setTotalAmount(0);
        }
      } catch (e) {
        console.error(e);
        setQuoteItems([]);
        setTotalAmount(0);
      } finally {
        setLoading(false);
      }
    };

    loadQuoteFromEVCheck();
  }, [appointmentId]);

  const columns = [
    {
      title: "Hạng mục",
      dataIndex: "name",
      key: "name",
      render: (t) => <span className='font-medium'>{t}</span>,
    },
    {
      title: "Biện pháp",
      dataIndex: "remedies",
      key: "remedies",
      width: 130,
      render: (v) => {
        const label =
          v === "REPLACE"
            ? "Thay thế"
            : v === "REPAIR"
            ? "Sửa chữa"
            : v === "CHECK"
            ? "Kiểm tra"
            : v === "NONE"
            ? "Bôi trơn"
            : v;
        const color =
          v === "REPLACE"
            ? "volcano"
            : v === "REPAIR"
            ? "geekblue"
            : v === "CHECK"
            ? "blue"
            : "default";
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "SL",
      dataIndex: "quantity",
      key: "quantity",
      width: 60,
      align: "center",
    },
    {
      title: "Giá dịch vụ (₫)",
      dataIndex: "priceService",
      key: "priceService",
      align: "right",
      width: 140,
      render: (v) => <span>{Number(v).toLocaleString("vi-VN")}</span>,
    },
    {
      title: "Giá phụ tùng (₫)",
      dataIndex: "pricePartDisplay",
      key: "pricePartDisplay",
      align: "right",
      width: 140,
      render: (v, row) =>
        row.remedies === "REPLACE" ? (
          <span>{Number(v).toLocaleString("vi-VN")}</span>
        ) : (
          <span>0</span>
        ),
    },
    {
      title: "Thành tiền (₫)",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right",
      width: 160,
      render: (v) => (
        <strong className='text-red-600'>
          {Number(v).toLocaleString("vi-VN")}
        </strong>
      ),
    },
  ];

  if (loading) {
    return (
      <Card>
        <Spin tip="Đang tải lịch sử thanh toán..." />
      </Card>
    );
  }

  if (quoteItems.length === 0) {
    return (
      <Card
        title={
          <span className='flex items-center gap-2'>
            <History className="h-5 w-5" style={{ color: "#ff4d4f" }} />
            <span>Lịch sử thanh toán</span>
          </span>
        }>
        <Empty description='Chưa có thông tin thanh toán' />
      </Card>
    );
  }

  return (
    <Card
      title={
        <span className='flex items-center gap-2'>
          <History className="h-5 w-5" style={{ color: "#ff4d4f" }} />
          <span>Lịch sử thanh toán</span>
        </span>
      }>
      <Table
        dataSource={quoteItems}
        columns={columns}
        pagination={false}
        size='middle'
        rowKey='id'
        summary={() => (
          <Table.Summary.Row className='font-bold bg-gray-50'>
            <Table.Summary.Cell colSpan={5} className='text-right text-lg'>
              TỔNG CỘNG:
            </Table.Summary.Cell>
            <Table.Summary.Cell className='text-right'>
              <span className='text-xl font-bold text-red-600'>
                {totalAmount.toLocaleString("vi-VN")} ₫
              </span>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </Card>
  );
};

export default PaymentHistory;

