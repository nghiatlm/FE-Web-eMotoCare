// src/components/service-staff/PaymentInfo.jsx
import { Card, Table, Tag, Spin, Empty, message } from "antd";
import { useState, useEffect } from "react";
import { fetchEVCheckByAppointmentService } from "../../services/evcheckService";
import { SERVICE_TYPE_MAP } from "../../utils/constants";
import { DollarSign } from "lucide-react";

const PaymentInfo = ({ booking, onOpenPayment }) => {
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
          const items = details.map((item, idx) => {
            const remedies = String(
              item.remedies || item.solution || "NONE"
            ).toUpperCase();
            const pricePartRaw = Number(item.pricePart || 0);
            const priceService = Number(item.priceService || 0);
            const quantity = Number(item.quantity || 1);

            // ✅ Chỉ tính tiền phụ tùng khi biện pháp là REPLACE
            const pricePart = remedies === "REPLACE" ? pricePartRaw : 0;
            const lineTotal = (pricePart + priceService) * quantity;

            const partName =
              item.maintenanceStageDetail?.part?.name ||
              item.partItem?.part?.name ||
              item.partName ||
              item.maintenanceStageDetail?.actionType ||
              "Hạng mục";

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
          });

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
          <span className='text-gray-400'>—</span>
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
        <Spin tip="Đang tải thông tin thanh toán..." />
      </Card>
    );
  }

  if (quoteItems.length === 0) {
    return (
      <Card
        title={
          <span className='flex items-center gap-2'>
            <DollarSign style={{ color: "#ff4d4f" }} />
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
        <span className='flex items-center gap-2'>
          <DollarSign style={{ color: "#ff4d4f" }} />
          <span>Thông tin thanh toán</span>
        </span>
      }
      extra={
        onOpenPayment && (
          <a
            onClick={onOpenPayment}
            style={{ color: "#ff4d4f", cursor: "pointer", fontWeight: 500 }}>
            Xử lý thanh toán
          </a>
        )
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

export default PaymentInfo;

