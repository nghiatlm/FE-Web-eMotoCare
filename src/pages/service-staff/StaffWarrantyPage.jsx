// src/pages/staff/StaffWarrantyPage.jsx
import { useState, useEffect, useMemo } from "react";
import { Table, Tag, Button, Select, Input, Spin, Modal } from "antd";
import { FilterIcon, RotateCcw } from "lucide-react";

import {
  getRMAService,
  getCustomerByRMAService,
  getRMADetailsService,
} from "../../services/rmaService";
import { STATUS_MAP, STATUS_COLORS } from "../../utils/constants";

// 👉 chỉnh path này theo nơi bạn đặt file RMADetails.jsx
import RMADetails from "../../components/service-staff/RMADetails";

const { Option } = Select;

export default function StaffWarrantyPage() {
  const [rmaList, setRmaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  // state cho màn chi tiết
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedRMA, setSelectedRMA] = useState(null);
  const [rmaDetails, setRmaDetails] = useState([]);

  // ================== LOAD DATA LIST RMA ==================
  const loadRMAList = async () => {
    setLoading(true);
    try {
      const data = await getRMAService();

      let list =
        data?.rowDatas ||
        data?.data?.rowDatas ||
        (Array.isArray(data) ? data : []);

      if (!Array.isArray(list)) list = [];

      // Gắn thêm customer cho từng RMA
      const enriched = await Promise.all(
        list.map(async (rma) => {
          try {
            const customer = await getCustomerByRMAService(rma.id);
            return { ...rma, customer };
          } catch (e) {
            console.error("Không load được customer cho RMA", rma.id, e);
            return rma;
          }
        })
      );

      setRmaList(enriched);
    } catch (err) {
      console.error("❌ Lỗi khi tải danh sách RMA:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRMAList();
  }, []);

  // ================== FILTER ==================
  const filteredData = useMemo(() => {
    return (rmaList || []).filter((item) => {
      const matchStatus = statusFilter
        ? item.status?.toUpperCase() === statusFilter
        : true;

      const lowerSearch = search.toLowerCase();

      const fullName = item.customer
        ? `${item.customer.firstName || ""} ${
            item.customer.lastName || ""
          }`.trim()
        : "";

      const matchSearch = search
        ? fullName.toLowerCase().includes(lowerSearch) ||
          item.code?.toLowerCase()?.includes(lowerSearch)
        : true;

      return matchStatus && matchSearch;
    });
  }, [rmaList, statusFilter, search]);

  // ================== ACTION: XEM CHI TIẾT ==================
  const handleViewDetail = async (record) => {
    setSelectedRMA(record);
    setDetailOpen(true);
    setDetailLoading(true);
    setRmaDetails([]);

    try {
      const data = await getRMADetailsService({ rmaId: record.id });

      let list =
        data?.rowDatas ||
        data?.data?.rowDatas ||
        (Array.isArray(data) ? data : []);

      if (!Array.isArray(list)) list = [];

      setRmaDetails(list);
    } catch (err) {
      console.error("❌ Lỗi load chi tiết RMA:", err);
    } finally {
      setDetailLoading(false);
    }
  };

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
      width: 200,
      render: (_, record) => {
        const c = record.customer;
        if (!c) return "—";
        return `${c.firstName || ""} ${c.lastName || ""}`.trim() || "—";
      },
    },
    {
      title: "Nhân viên xử lý",
      key: "staff",
      width: 180,
      render: (_, record) => {
        const s = record.staff;
        return s ? `${s.firstName || ""} ${s.lastName || ""}`.trim() : "—";
      },
    },
    {
      title: "Ngày tạo RMA",
      dataIndex: "rmaDate",
      key: "rmaDate",
      width: 180,
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
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      width: 200,
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
      width: 120,
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
      <div className='flex justify-end items-center gap-3 mb-4'>
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
          style={{ width: 220 }}
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

      {/* TABLE LIST RMA */}
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

      {/* MODAL CHI TIẾT RMA */}
      <Modal
        title={
          selectedRMA ? `Yêu cầu bảo hành: ${selectedRMA.code}` : "Chi tiết RMA"
        }
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        width='80%'
        footer={[
          <Button key='close' onClick={() => setDetailOpen(false)}>
            Đóng
          </Button>,
        ]}>
        <RMADetails
          rma={selectedRMA}
          details={rmaDetails}
          loading={detailLoading}
        />
      </Modal>
    </div>
  );
}
