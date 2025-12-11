// src/components/service-staff/PaymentInfo.jsx
import { Card, Table, Tag, Spin, Empty, message, Image } from "antd";
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
      title: "Hình ảnh",
      dataIndex: "imageUrl",
      key: "image",
      width: 80,
      align: "center",
      render: (imageUrl) => {
        if (imageUrl) {
          return (
            <Image
              src={imageUrl}
              alt="Part"
              width={48}
              height={48}
              style={{ objectFit: "cover", borderRadius: 4, border: "1px solid #e8e8e8" }}
              preview={{ src: imageUrl }}
              fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yNCAzMkMyOC40MTgzIDMyIDMyIDI4LjQxODMgMzIgMjRDMzIgMTkuNTgxNyAyOC40MTgzIDE2IDI0IDE2QzE5NTgxNyAxNiAxNiAxOS41ODE3IDE2IDI0QzE2IDI4LjQxODMgMTkuNTgxNyAzMiAyNCAzMloiIGZpbGw9IiNEMEQwRDAiLz4KPC9zdmc+"
            />
          );
        }
        return (
          <div style={{
            width: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f5f5",
            borderRadius: 4,
            border: "1px dashed #d9d9d9",
            fontSize: 10,
            color: "#999"
          }}>
            NA
          </div>
        );
      },
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
            : v === "CLEAN"
            ? "Vệ sinh"
            : v === "TUNE"
            ? "Điều chỉnh"
            : v === "WARRANTY"
            ? "Bảo hành"
            : v === "NONE"
            ? "Biện pháp"
            : v;
        const color =
          v === "REPLACE"
            ? "volcano"
            : v === "REPAIR"
            ? "geekblue"
            : v === "CLEAN"
            ? "blue"
            : v === "TUNE"
            ? "cyan"
            : v === "WARRANTY"
            ? "green"
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
        <span className='flex items-center gap-2'>
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
            <Table.Summary.Cell colSpan={6} className='text-right text-lg'>
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

