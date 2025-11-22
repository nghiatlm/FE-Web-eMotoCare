import { useState, useEffect, useMemo } from "react";
import { Table, Tag, Button, Space, Modal, Select, Input, Spin } from "antd";
import { QrcodeOutlined } from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import { FilterIcon, RotateCcw } from "lucide-react";
import { getRMAService } from "../../services/rmaService"; // ✅ import service thật
import { STATUS_MAP, STATUS_COLORS } from "../../utils/constants";
import { useServiceCenter } from "../../hooks/useServiceCenter";

const { Option } = Select;

// ================== CONSTANTS ==================

// ================== COMPONENT ==================
export default function StaffWarrantyPage() {
  const [rmaList, setRmaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [qrRecord, setQrRecord] = useState(null);
  const [openQRModal, setOpenQRModal] = useState(false);
  const { serviceCenterId } = useServiceCenter();

  // ================== LOAD DATA ==================
  const loadRMAList = async () => {
    setLoading(true);
    try {
      const data = await getRMAService({ serviceCenterId });
      const list = data?.rowDatas || [];
      setRmaList(list);
    } catch (err) {
      console.error("❌ Lỗi khi tải danh sách RMA:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serviceCenterId) {
      loadRMAList();
    }
  }, [serviceCenterId]);

  // ================== FILTER ==================
  const filteredData = useMemo(() => {
    return (rmaList || []).filter((item) => {
      const matchStatus = statusFilter
        ? item.status?.toUpperCase() === statusFilter
        : true;
      const matchSearch = search
        ? item.customer?.firstName
            ?.toLowerCase()
            ?.includes(search.toLowerCase()) ||
          item.customer?.lastName
            ?.toLowerCase()
            ?.includes(search.toLowerCase()) ||
          item.code?.toLowerCase()?.includes(search.toLowerCase())
        : true;
      return matchStatus && matchSearch;
    });
  }, [rmaList, statusFilter, search]);

  // ================== TABLE ==================
  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, __, idx) => idx + 1,
      width: 60,
    },
    {
      title: "Mã RMA",
      dataIndex: "code",
      key: "code",
      width: 160,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_, record) => {
        const c = record.customer;
        return c ? `${c.firstName || ""} ${c.lastName || ""}`.trim() : "—";
      },
      width: 160,
    },
    {
      title: "Nhân viên xử lý",
      key: "staff",
      render: (_, record) => {
        const s = record.staff;
        return s ? `${s.firstName || ""} ${s.lastName || ""}`.trim() : "—";
      },
      width: 160,
    },
    {
      title: "Ngày tạo RMA",
      dataIndex: "rmaDate",
      key: "rmaDate",
      render: (date) =>
        date
          ? new Date(date).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
      width: 180,
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      width: 180,
      render: (note) => note || "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => {
        if (!status) return <Tag>—</Tag>;
        const key = String(status).toUpperCase();
        return (
          <Tag color={STATUS_COLORS[key] || "default"}>
            {STATUS_MAP[key] || status}
          </Tag>
        );
      },
    },

    {
      title: "Hành động",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Button type='link' onClick={() => handleViewDetail(record)}>
          Xem chi tiết
        </Button>
      ),
    },
  ];

  // ================== RENDER ==================
  return (
    <div style={{ padding: 16 }}>
      {/* HEADER */}
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-2xl font-semibold text-green-600'>
          🛡️ Danh sách Phiếu Bảo hành (RMA)
        </h2>
        <Button onClick={loadRMAList} type='default' icon={<RotateCcw />}>
          Tải lại
        </Button>
      </div>

      {/* FILTER */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 12,
        }}>
        <FilterIcon size={18} />
        <Select
          placeholder='Trạng thái'
          style={{ width: 180 }}
          allowClear
          value={statusFilter || undefined}
          onChange={setStatusFilter}>
          <Option value='PENDING'>Đang chờ duyệt</Option>
          <Option value='APPROVED'>Đã duyệt</Option>
          <Option value='REJECTED'>Từ chối</Option>
          <Option value='COMPLETED'>Hoàn tất</Option>
        </Select>

        <Input
          placeholder='Tìm theo mã hoặc tên KH'
          style={{ width: 200 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Button
          onClick={() => {
            setSearch("");
            setStatusFilter("");
          }}>
          Đặt lại
        </Button>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className='flex justify-center items-center h-64'>
          <Spin size='large' />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey='id'
          bordered
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      )}

      {/* QR MODAL */}
      <Modal
        title={qrRecord ? `QR RMA — ${qrRecord.code}` : "QR RMA"}
        open={openQRModal}
        onCancel={() => setOpenQRModal(false)}
        footer={[
          <Button key='close' onClick={() => setOpenQRModal(false)}>
            Đóng
          </Button>,
        ]}
        centered>
        {qrRecord ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: 24,
            }}>
            <QRCodeSVG value={qrRecord.code || "N/A"} size={180} />
          </div>
        ) : (
          <p className='text-center text-gray-500'>Không có QR</p>
        )}
      </Modal>
    </div>
  );
}
