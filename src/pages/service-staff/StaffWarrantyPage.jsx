// src/pages/staff/StaffWarrantyPage.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Tag, Button, Select, Input, Card } from "antd";
import { RotateCcw, Shield, Search } from "lucide-react";

import {
  getRMAService,
  getCustomerByRMAService,
} from "../../services/rmaService";
import { STATUS_MAP, STATUS_COLORS } from "../../utils/constants";

const { Option } = Select;

export default function StaffWarrantyPage() {
  const navigate = useNavigate();
  const [rmaList, setRmaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

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
  const handleViewDetail = (record) => {
    navigate(`/staff/warranty/${record.id}`);
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
      title: "Ngày",
      dataIndex: "rmaDate",
      key: "rmaDate",
      width: 120,
      render: (date) =>
        date
          ? new Date(date).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "—",
    },
    {
      title: "Giờ",
      dataIndex: "rmaDate",
      key: "rmaTime",
      width: 100,
      render: (date) =>
        date
          ? new Date(date).toLocaleTimeString("vi-VN", {
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
        <Button
          type='link'
          onClick={() => handleViewDetail(record)}
          style={{
            color: "#ff4d4f",
            fontWeight: 500,
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ff7875";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#ff4d4f";
          }}>
          Xem chi tiết
        </Button>
      ),
    },
  ];

  // ================== RENDER ==================
  return (
    <div style={{ padding: 24, width: "100%", margin: "0 auto" }}>
      {/* ✅ HEADER */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "#ff4d4f", display: "flex", alignItems: "center", gap: 12 }}>
          Danh sách phiếu bảo hành 
        </h2>
      </div>

      {/* ✅ FILTER CARD */}
      <Card
        style={{ marginBottom: 24, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
        headStyle={{ 
          borderBottom: "1px solid #f0f0f0", 
          padding: "16px 20px",
          backgroundColor: "#fafafa",
          borderRadius: "8px 8px 0 0"
        }}
        bodyStyle={{ padding: "20px" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(2, 1fr) auto", 
          gap: "20px",
          alignItems: "end"
        }}>
          {/* Trạng thái */}
          <div>
            <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: "#595959" }}>
              Trạng thái
            </div>
            <Select
              placeholder='Chọn trạng thái'
              allowClear
              size="large"
              style={{ width: "100%" }}
              value={statusFilter || undefined}
              onChange={setStatusFilter}>
              <Option value='PENDING'>Chờ xử lý</Option>
              <Option value='APPROVED'>Đã phê duyệt</Option>
              <Option value='PROCESSING'>Đang xử lý</Option>
              <Option value='APPOINTMENT_BOOKED'>Đã đặt lịch</Option>
              <Option value='REJECTED'>Bị từ chối</Option>
              <Option value='COMPLETED'>Đã hoàn thành</Option>
            </Select>
          </div>

          {/* Tìm kiếm */}
          <div>
            <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: "#595959" }}>
              Tìm kiếm
            </div>
            <Input
              placeholder='Tìm theo mã RMA hoặc tên khách hàng'
              prefix={<Search size={16} style={{ color: "#bfbfbf" }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="large"
              allowClear
              style={{ width: "100%" }}
            />
          </div>

          {/* Nút Reset */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-start" }}>
            <div
              onClick={() => {
                setSearch("");
                setStatusFilter("");
              }}
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #ff4d4f",
                borderRadius: 6,
                cursor: "pointer",
                color: "#ff4d4f",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#fff1f0";
                e.currentTarget.style.borderColor = "#ff4d4f";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.borderColor = "#ff4d4f";
              }}>
              <RotateCcw size={20} />
            </div>
          </div>
        </div>
      </Card>

      {/* TABLE LIST RMA */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey='id'
        loading={loading}
        bordered
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} bản ghi`,
          showQuickJumper: false,
          style: { padding: "16px" }
        }}
        scroll={{ x: false }}
        style={{
          borderRadius: 8,
        }}
        rowClassName={(record, index) =>
          index % 2 === 0 ? "table-row-light" : "table-row-dark"
        }
      />
    </div>
  );
}
