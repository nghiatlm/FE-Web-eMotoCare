import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Wrench,
  Clock, 
  CheckCircle, 
  XCircle, 
  Activity,
  TrendingUp,
  Car
} from "lucide-react";
import { useBookings } from "../../hooks/useBookings";
import { Card, Statistic, Table, Tag, Space } from "antd";
import dayjs from "dayjs";

const TechnicianDashboard = () => {
  const { data: bookings, loading: bookingsLoading, fetchBookings } = useBookings();

  useEffect(() => {
    fetchBookings();
  }, []);

  const assignedBookings = Array.isArray(bookings) ? bookings : [];
  

  const stats = {
    total: assignedBookings.length,
    inService: assignedBookings.filter(b => {
      const status = b.status?.toUpperCase();
      return status === "CHECKED_IN" || status === "IN_SERVICE" || 
             status === "QUOTE_APPROVED" || status === "REPAIR_IN_PROGRESS";
    }).length,
    completed: assignedBookings.filter(b => b.status?.toUpperCase() === "COMPLETED").length,
    canceled: assignedBookings.filter(b => b.status?.toUpperCase() === "CANCELED").length,
  };

  const today = dayjs().startOf("day");
  const todayBookings = assignedBookings.filter(b => {
    const bookingDate = dayjs(b.appointmentDate);
    return bookingDate.isSame(today, "day");
  });

  const next7Days = dayjs().add(7, "day");
  const upcomingBookings = assignedBookings.filter(b => {
    const bookingDate = dayjs(b.appointmentDate);
    return bookingDate.isAfter(today) && bookingDate.isBefore(next7Days);
  });

  const serviceTypeStats = {
    maintenance: assignedBookings.filter(b => 
      (b.type || "").toUpperCase() === "MAINTENANCE_TYPE"
    ).length,
    repair: assignedBookings.filter(b => 
      (b.type || "").toUpperCase() === "REPAIR_TYPE"
    ).length,
    warranty: assignedBookings.filter(b => 
      (b.type || "").toUpperCase() === "WARRANTY_TYPE"
    ).length,
    recall: assignedBookings.filter(b => 
      (b.type || "").toUpperCase() === "RECALL_TYPE"
    ).length,
    campaign: assignedBookings.filter(b => 
      (b.type || "").toUpperCase() === "CAMPAIGN_TYPE"
    ).length,
  };

  const inProgressBookings = assignedBookings.filter(b => {
    const status = b.status?.toUpperCase();
    return status === "CHECKED_IN" || status === "IN_SERVICE" || 
           status === "QUOTE_APPROVED" || status === "REPAIR_IN_PROGRESS";
  }).slice(0, 5);

  const recentBookings = [...assignedBookings]
    .sort((a, b) => dayjs(b.createdAt || b.appointmentDate).diff(dayjs(a.createdAt || a.appointmentDate)))
    .slice(0, 5);

  const getStatusColor = (status) => {
    const statusMap = {
      PENDING: "orange",
      APPROVED: "blue",
      CHECKED_IN: "cyan",
      IN_SERVICE: "processing",
      QUOTE_APPROVED: "purple",
      REPAIR_IN_PROGRESS: "processing",
      REPAIR_COMPLETED: "green",
      COMPLETED: "success",
      CANCELED: "error",
    };
    return statusMap[status] || "default";
  };

  const getStatusText = (status) => {
    const statusMap = {
      PENDING: "Chờ duyệt",
      APPROVED: "Đã duyệt",
      CHECKED_IN: "Đã check-in",
      IN_SERVICE: "Đang thực hiện",
      QUOTE_APPROVED: "Đã duyệt báo giá",
      REPAIR_IN_PROGRESS: "Đang sửa chữa",
      REPAIR_COMPLETED: "Hoàn thành sửa chữa",
      COMPLETED: "Hoàn thành",
      CANCELED: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  const getServiceTypeText = (type) => {
    const typeMap = {
      MAINTENANCE_TYPE: "Bảo dưỡng",
      REPAIR_TYPE: "Sửa chữa",
      WARRANTY_TYPE: "Bảo hành",
      RECALL_TYPE: "Recall",
      CAMPAIGN_TYPE: "Chiến dịch",
    };
    return typeMap[type] || type;
  };

  const columns = [
    {
      title: "Mã booking",
      dataIndex: "code",
      key: "code",
      render: (text) => <span style={{ fontWeight: 600, color: "#ff4d4f" }}>{text}</span>,
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_, record) => {
        const customer = record.customer;
        if (!customer) return "";
        return `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "";
      },
    },
    {
      title: "Loại dịch vụ",
      dataIndex: "type",
      key: "type",
      render: (type) => getServiceTypeText(type),
    },
    {
      title: "Ngày hẹn",
      dataIndex: "appointmentDate",
      key: "appointmentDate",
      render: (date) => date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" style={{ color: "#ff4d4f" }}>
          <LayoutDashboard className="h-8 w-8" />
          Dashboard
        </h1>
        <p className="text-muted-foreground">Tổng quan công việc của bạn</p>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Statistic
            title="Tổng số được phân công"
            value={stats.total}
            prefix={<Wrench style={{ color: "#ff4d4f" }} />}
            valueStyle={{ color: "#ff4d4f" }}
          />
        </Card>

        <Card>
          <Statistic
            title="Đang xử lý"
            value={stats.inService}
            prefix={<Clock style={{ color: "#fa8c16" }} />}
            valueStyle={{ color: "#fa8c16" }}
          />
        </Card>

        <Card>
          <Statistic
            title="Đã hoàn thành"
            value={stats.completed}
            prefix={<CheckCircle style={{ color: "#52c41a" }} />}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>

        <Card>
          <Statistic
            title="Đã hủy"
            value={stats.canceled}
            prefix={<XCircle style={{ color: "#ff4d4f" }} />}
            valueStyle={{ color: "#ff4d4f" }}
          />
        </Card>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Statistic
            title="Booking hôm nay"
            value={todayBookings.length}
            prefix={<Car style={{ color: "#ff4d4f" }} />}
            valueStyle={{ color: "#ff4d4f" }}
          />
        </Card>

        <Card>
          <Statistic
            title="Sắp tới (7 ngày)"
            value={upcomingBookings.length}
            prefix={<TrendingUp style={{ color: "#52c41a" }} />}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>

        <Card>
          <Statistic
            title="Tỷ lệ hoàn thành"
            value={stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}
            suffix="%"
            prefix={<Activity style={{ color: "#1890ff" }} />}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </div>

      
      <Card title={
        <Space>
          <Activity style={{ color: "#ff4d4f" }} />
          <span>Phân bổ theo loại dịch vụ</span>
        </Space>
      }>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "#1890ff" }}>{serviceTypeStats.maintenance}</div>
            <div className="text-sm text-gray-600">Bảo dưỡng</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "#fa8c16" }}>{serviceTypeStats.repair}</div>
            <div className="text-sm text-gray-600">Sửa chữa</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "#52c41a" }}>{serviceTypeStats.warranty}</div>
            <div className="text-sm text-gray-600">Bảo hành</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "#722ed1" }}>{serviceTypeStats.recall}</div>
            <div className="text-sm text-gray-600">Recall</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "#eb2f96" }}>{serviceTypeStats.campaign}</div>
            <div className="text-sm text-gray-600">Chiến dịch</div>
          </div>
        </div>
      </Card>

      
      {inProgressBookings.length > 0 && (
        <Card 
          title={
            <Space>
              <Clock style={{ color: "#ff4d4f" }} />
              <span>Đang xử lý (cần làm ngay)</span>
            </Space>
          }
          loading={bookingsLoading}>
          <Table
            columns={columns}
            dataSource={inProgressBookings}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}

      
      <Card 
        title={
          <Space>
            <Activity style={{ color: "#ff4d4f" }} />
            <span>Booking gần đây</span>
          </Space>
        }
        loading={bookingsLoading}>
        <Table
          columns={columns}
          dataSource={recentBookings}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default TechnicianDashboard;

