import { Modal, Table, Radio, Button, Spin, Empty, Tag, Image } from "antd";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import { createPaymentLinkService } from "../../services/paymentService";
import { fetchEVCheckByAppointmentService } from "../../services/evcheckService";
import { changeAppointmentStatusService } from "../../services/appointmentService";
import { SERVICE_TYPE_MAP } from "../../utils/constants";

const Payment = ({ open, onClose, booking, onPaymentSuccess, cancellationFee = 0, isPendingCancel = false }) => {
  const [paymentMethod, setPaymentMethod] = useState("PAY_OS_CENTER");
  const [loading, setLoading] = useState(false);
  const [quoteItems, setQuoteItems] = useState([]);
  const [fetchingEVCheck, setFetchingEVCheck] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalServiceFee, setTotalServiceFee] = useState(0);
  const [totalPartsFee, setTotalPartsFee] = useState(0);
  const [vat, setVat] = useState(0);

  const appointmentId = booking?.id;

  useEffect(() => {
    if (!open || !appointmentId) return;

    if (cancellationFee > 0 && (isPendingCancel || booking?.status === "CANCELED")) {
      setQuoteItems([{
        id: 'cancellation-fee',
        name: 'Phí hủy lịch hẹn',
        remedies: 'CANCELLATION',
        quantity: 1,
        priceService: cancellationFee,
        pricePartDisplay: 0,
        serial: '',
        totalAmount: cancellationFee,
      }]);
      setTotalServiceFee(cancellationFee);
      setTotalPartsFee(0);
      const vatAmount = Math.round(cancellationFee * 0.08);
      setVat(vatAmount);
      setTotalAmount(cancellationFee + vatAmount);
      return;
    }

    const loadQuoteFromEVCheck = async () => {
      setFetchingEVCheck(true);
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
          setTotalAmount(0);
          setTotalServiceFee(0);
          setTotalPartsFee(0);
          setVat(0);
        }
      } catch (e) {
        toast.warning("Không tải được báo giá từ EVCheck");
        setQuoteItems([]);
        setTotalAmount(0);
        setTotalServiceFee(0);
        setTotalPartsFee(0);
        setVat(0);
      } finally {
        setFetchingEVCheck(false);
      }
    };

    loadQuoteFromEVCheck();
  }, [open, appointmentId, isPendingCancel, cancellationFee]);

  const handlePayment = async () => {
    if (!appointmentId) return toast.error("Thiếu thông tin lịch hẹn");
    if (totalAmount <= 0) return toast.warning("Tổng tiền phải lớn hơn 0");

    setLoading(true);
    try {
      if (paymentMethod === "APP") {
        try {
          const { getAppointmentById } = await import("../../api/appointmentsApi");
          const appointmentRes = await getAppointmentById(appointmentId);
          const currentAppointment = appointmentRes?.data?.data || appointmentRes?.data || appointmentRes;
          
          await changeAppointmentStatusService(appointmentId, "WAITING_FOR_PAYMENT", {
            note: currentAppointment?.note || booking?.note || "",
            approveById: currentAppointment?.approveById || booking?.approveById || null,
            code: currentAppointment?.code || booking?.code || "",
            checkinQRCode: currentAppointment?.checkinQRCode || booking?.checkinQRCode || "",
          });
          
          toast.success("Đã tạo yêu cầu thanh toán bằng app! Khách hàng sẽ thanh toán trên ứng dụng.");
          onPaymentSuccess?.({ method: "APP", amount: totalAmount });
          onClose();
          return;
        } catch (err) {
          toast.error(`Lỗi cập nhật trạng thái: ${err.response?.data?.message || err.message || "Unknown error"}`);
          return;
        }
      }

      const payload = {
        amount: Math.round(totalAmount),
        paymentMethod:
          paymentMethod === "PAY_OS_CENTER" ? "PAY_OS_CENTER" : "CASH",
        currency: "VND",
        appointmentId,
        returnUrl: `${window.location.origin}/payment-success`,
        callbackUrl: `${window.location.origin}/payment-failed`,
      };

      const res = await createPaymentLinkService(payload);
      
      if (paymentMethod === "CASH") {
        toast.success("Đã xác nhận thanh toán tiền mặt!");
        onPaymentSuccess?.({ method: "CASH", amount: totalAmount });
        onClose();
      } else {
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
      toast.error(e?.response?.data?.message || e?.data?.message || e?.message || "Không thể tạo yêu cầu thanh toán");
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
        if (v === "CANCELLATION") {
          return <Tag color="red">Phí hủy</Tag>;
        }
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
        row.remedies === "CANCELLATION" ? (
          <span>0</span>
        ) : row.remedies === "REPLACE" ? (
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
                <>
                  <Table.Summary.Row className='bg-gray-50'>
                    <Table.Summary.Cell
                      colSpan={6}
                      className='text-right'>
                      Tổng phí dịch vụ:
                    </Table.Summary.Cell>
                    <Table.Summary.Cell className='text-right'>
                      <span>{totalServiceFee.toLocaleString("vi-VN")} ₫</span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row className='bg-gray-50'>
                    <Table.Summary.Cell
                      colSpan={6}
                      className='text-right'>
                      Tổng phí phụ tùng:
                    </Table.Summary.Cell>
                    <Table.Summary.Cell className='text-right'>
                      <span>{totalPartsFee.toLocaleString("vi-VN")} ₫</span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row className='bg-gray-50'>
                    <Table.Summary.Cell
                      colSpan={6}
                      className='text-right'>
                      VAT (8%):
                    </Table.Summary.Cell>
                    <Table.Summary.Cell className='text-right'>
                      <span>{vat.toLocaleString("vi-VN")} ₫</span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row className='font-bold bg-gray-100 border-t-2 border-gray-300'>
                    <Table.Summary.Cell
                      colSpan={6}
                      className='text-right text-lg'>
                      TỔNG CỘNG:
                    </Table.Summary.Cell>
                    <Table.Summary.Cell className='text-right'>
                      <span className='text-xl font-bold text-red-600'>
                        {totalAmount.toLocaleString("vi-VN")} ₫
                      </span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
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
              <Radio value='CASH'>Tiền mặt</Radio>
              <Radio value='APP'>Thanh toán bằng app</Radio>
            </Radio.Group>
          </div>

          <div className='flex justify-end gap-3 pt-4 border-t'>
            <Button size='large' onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button
              type='primary'
              danger
              size='large'
              onClick={handlePayment}
              loading={loading}
              disabled={loading || totalAmount === 0}
              className=''
              style={{ backgroundColor: "#ff4d4f", borderColor: "#ff4d4f" }}>
              {paymentMethod === "CASH"
                ? "Xác nhận đã thu tiền"
                : paymentMethod === "APP"
                ? "Tạo thanh toán"
                : `Tạo thanh toán`}
            </Button>
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default Payment;
