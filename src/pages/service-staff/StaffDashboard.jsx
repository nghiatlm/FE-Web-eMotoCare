import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  TrendingUp,
  Activity
} from "lucide-react";
import { useBookings } from "../../hooks/useBookings";
import { Card, Statistic, Table, Tag, Space } from "antd";
import dayjs from "dayjs";
import { getRMAService } from "../../services/rmaService";
import { fetchServiceStaff } from "../../services/staffsService";

const StaffDashboard = () => {
  const { data: bookings, loading: bookingsLoading, fetchBookings } = useBookings();
  const [rmaData, setRmaData] = useState([]);
  const [rmaLoading, setRmaLoading] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState(null);

  useEffect(() => {
    loadCurrentStaff();
    fetchBookings();
    loadRMAs();
  }, []);

  const loadCurrentStaff = async () => {
    try {
      const staff = await fetchServiceStaff();
      const staffData = staff?.data?.data || staff?.data || staff;
      const staffId = staffData?.id;
      setCurrentStaffId(staffId);
    } catch (error) {
    }
  };

  const loadRMAs = async () => {
    setRmaLoading(true);
    try {
      const res = await getRMAService();
      const list = res?.rowDatas || res?.data?.rowDatas || (Array.isArray(res) ? res : []);
      setRmaData(list);
    } catch (error) {
    } finally {
      setRmaLoading(false);
    }
  };

  
  const approvedBookings = Array.isArray(bookings) ? bookings : [];
  

  const stats = {
    total: approvedBookings.length,
    pending: approvedBookings.filter(b => b.status === "PENDING").length,
    approved: approvedBookings.filter(b => b.status === "APPROVED").length,
    checkedIn: approvedBookings.filter(b => b.status === "CHECKED_IN").length,
    completed: approvedBookings.filter(b => b.status === "COMPLETED").length,
    canceled: approvedBookings.filter(b => b.status === "CANCELED").length,
  };

  const today = dayjs().startOf("day");
  const todayBookings = approvedBookings.filter(b => {
    const bookingDate = dayjs(b.appointmentDate);
    return bookingDate.isSame(today, "day");
  });

  const next7Days = dayjs().add(7, "day");
  const upcomingBookings = approvedBookings.filter(b => {
    const bookingDate = dayjs(b.appointmentDate);
    return bookingDate.isAfter(today) && bookingDate.isBefore(next7Days);
  });

  const pendingRMAs = rmaData.filter(rma => 
    rma.status === "PENDING" || rma.status === "IN_PROGRESS"
  ).length;

  const recentBookings = [...approvedBookings]
    .sort((a, b) => dayjs(b.createdAt || b.appointmentDate).diff(dayjs(a.createdAt || a.appointmentDate)))
    .slice(0, 5);

  const getStatusColor = (status) => {
    const statusMap = {
      PENDING: "orange",
      APPROVED: "blue",
      CHECKED_IN: "cyan",
      QUOTE_APPROVED: "purple",
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
      QUOTE_APPROVED: "Đã duyệt báo giá",
      REPAIR_COMPLETED: "Hoàn thành sửa chữa",
      COMPLETED: "Hoàn thành",
      CANCELED: "Đã hủy",
    };
    return statusMap[status] || status;
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
        if (!customer) return "-";
        return `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "-";
      },
    },
    {
      title: "Ngày hẹn",
      dataIndex: "appointmentDate",
      key: "appointmentDate",
      render: (date) => date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
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
        <p className="text-muted-foreground">Tổng quan hoạt động của trung tâm dịch vụ</p>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Statistic
            title="Tổng số booking đã duyệt"
            value={stats.total}
            prefix={<Calendar style={{ color: "#ff4d4f" }} />}
            valueStyle={{ color: "#ff4d4f" }}
          />
        </Card>

        <Card>
          <Statistic
            title="Chờ duyệt"
            value={stats.pending}
            prefix={<Clock style={{ color: "#fa8c16" }} />}
            valueStyle={{ color: "#fa8c16" }}
          />
        </Card>

        <Card>
          <Statistic
            title="Đã check-in"
            value={stats.checkedIn}
            prefix={<CheckCircle style={{ color: "#52c41a" }} />}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>

        <Card>
          <Statistic
            title="Hoàn thành"
            value={stats.completed}
            prefix={<CheckCircle style={{ color: "#1890ff" }} />}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Statistic
            title="Booking hôm nay"
            value={todayBookings.length}
            prefix={<Calendar style={{ color: "#ff4d4f" }} />}
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
            title="RMA đang xử lý"
            value={pendingRMAs}
            prefix={<FileText style={{ color: "#fa8c16" }} />}
            valueStyle={{ color: "#fa8c16" }}
          />
        </Card>
      </div>

      
      <Card title={
        <Space>
          <Activity style={{ color: "#ff4d4f" }} />
          <span>Phân bổ theo trạng thái</span>
        </Space>
      }>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "#fa8c16" }}>{stats.pending}</div>
            <div className="text-sm text-gray-600">Chờ duyệt</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "#1890ff" }}>{stats.approved}</div>
            <div className="text-sm text-gray-600">Đã duyệt</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "#13c2c2" }}>{stats.checkedIn}</div>
            <div className="text-sm text-gray-600">Đã check-in</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "#52c41a" }}>{stats.completed}</div>
            <div className="text-sm text-gray-600">Hoàn thành</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "#ff4d4f" }}>{stats.canceled}</div>
            <div className="text-sm text-gray-600">Đã hủy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "#722ed1" }}>
              {approvedBookings.filter(b => b.status === "QUOTE_APPROVED" || b.status === "REPAIR_COMPLETED").length}
            </div>
            <div className="text-sm text-gray-600">Đang sửa chữa</div>
          </div>
        </div>
      </Card>

      
      <Card 
        title={
          <Space>
            <Clock style={{ color: "#ff4d4f" }} />
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

export default StaffDashboard;

