// src/components/Payment.jsx
import { Modal, Table, Radio, Button, Spin, Empty, Tag } from "antd";
import { toast } from "@/components/ui/sonner";
import { useState, useEffect } from "react";
import { createPaymentLinkService } from "../../services/paymentService";
import { fetchEVCheckByAppointmentService } from "../../services/evcheckService";
import { SERVICE_TYPE_MAP } from "../../utils/constants";

const Payment = ({ open, onClose, booking, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState("PAY_OS_CENTER");
  const [loading, setLoading] = useState(false);
  const [quoteItems, setQuoteItems] = useState([]);
  const [fetchingEVCheck, setFetchingEVCheck] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  const appointmentId = booking?.id;

  useEffect(() => {
    if (!open || !appointmentId) return;

    const loadQuoteFromEVCheck = async () => {
      setFetchingEVCheck(true);
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
              // hiển thị
              priceService,
              pricePartDisplay: pricePart, // đã áp dụng rules REPLACE
              serial,
              // tính tiền
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
        toast.warning("Không tải được báo giá từ EVCheck");
        setQuoteItems([]);
        setTotalAmount(0);
      } finally {
        setFetchingEVCheck(false);
      }
    };

    loadQuoteFromEVCheck();
  }, [open, appointmentId]);

  const handlePayment = async () => {
    if (!appointmentId) return toast.error("Thiếu thông tin lịch hẹn");
    if (totalAmount <= 0) return toast.warning("Tổng tiền phải lớn hơn 0");

    setLoading(true);
    try {
      // Theo swagger BE: muốn PayOS -> gửi PAY_OS_CENTER
      const payload = {
        amount: Math.round(totalAmount),
        paymentMethod:
          paymentMethod === "PAY_OS_CENTER" ? "PAY_OS_CENTER" : "CASH",
        currency: "VND",
        appointmentId,
        returnUrl: "https://modernestate.vercel.app/payment-success",
        callbackUrl: "https://modernestate.vercel.app/payment-success",
      };

      // ✅ Luôn gọi API, truyền paymentMethod (CASH hoặc PAY_OS_CENTER)
      const res = await createPaymentLinkService(payload);
      
      if (paymentMethod === "CASH") {
        // ✅ Thanh toán tiền mặt: truyền CASH vào API
        toast.success("Đã xác nhận thanh toán tiền mặt!");
        onPaymentSuccess?.({ method: "CASH", amount: totalAmount });
        onClose();
      } else {
        // ✅ Thanh toán PayOS: mở link thanh toán
        const url =
          res?.data?.urlPayemt ||
          res?.data?.urlPayment ||
          res?.data?.checkoutUrl ||
          res?.urlPayemt ||
          res?.urlPayment ||
          res?.checkoutUrl;

        if (url) {
          window.open(url, "_blank");
          toast.success("Tạo yêu cầu thanh toán thành công!");
          onPaymentSuccess?.({ method: "PAYOS", amount: totalAmount, url });
          onClose();
        } else {
          throw new Error("Không nhận được link thanh toán từ BE");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Không thể tạo yêu cầu thanh toán");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Modal
      title={
        <span className='text-xl font-bold text-[#d4380d] justify-center flex items-center'>
Xác nhận hóa đơn        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={980}
      destroyOnClose>
      <Spin
        spinning={loading || fetchingEVCheck}
        tip={fetchingEVCheck ? "Đang tải báo giá..." : "Đang xử lý..."}>
        <div className='space-y-6'>
          <div className='bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg text-sm border border-blue-200'>
            <p>
              <strong>Khách hàng:</strong> {booking.customer?.firstName}{" "}
              {booking.customer?.lastName}
            </p>
            <p>
              <strong>Mã lịch hẹn:</strong>{" "}
              <span className='font-mono text-red-600'>{booking.code}</span>
            </p>
            <p>
              <strong>Loại dịch vụ:</strong>{" "}
              <span className=' font-bold text-blue-600'>
                {SERVICE_TYPE_MAP[booking.type] || booking.type}
              </span>
            </p>
          </div>

          {quoteItems.length > 0 ? (
            <Table
              dataSource={quoteItems}
              columns={columns}
              pagination={false}
              size='middle'
              rowKey='id'
              summary={() => (
                <Table.Summary.Row className='font-bold bg-gray-50'>
                  <Table.Summary.Cell
                    colSpan={6}
                    className='text-right text-lg'>
                    TỔNG CỘNG:
                  </Table.Summary.Cell>
                  <Table.Summary.Cell className='text-right'>
                    <span className='text-xl font-bold text-red-600'>
                      {totalAmount.toLocaleString()} ₫
                    </span>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          ) : (
            <Empty description='Chưa có hạng mục nào để thanh toán' />
          )}

          <div className='bg-gray-50 p-4 rounded-lg'>
            <h4 className='font-semibold mb-3'>Phương thức thanh toán</h4>
            <Radio.Group
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}>
              <Radio value='PAY_OS_CENTER'>Chuyển khoản ngân hàng</Radio>
              <Radio value='CASH'>Tiền mặt </Radio>
            </Radio.Group>
          </div>

          <div className='flex justify-end gap-3 pt-4 border-t'>
            <Button size='large' onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button
              type='primary'
              size='large'
              onClick={handlePayment}
              loading={loading}
              disabled={loading || totalAmount === 0}
              className=''>
              {paymentMethod === "CASH"
                ? "Xác nhận đã thu tiền"
                : `Tạo thanh toán`}
            </Button>
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default Payment;
