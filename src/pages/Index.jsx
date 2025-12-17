import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
    LayoutDashboard, 
    Users, 
    TrendingUp, 
    TrendingDown,
    Calendar,
    FileText,
    DollarSign
} from "lucide-react";
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    AreaChart, 
    Area,
    Legend,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getServiceCenters } from "@/api/serviceCentersApi";
import { getDashboardOverview, getDashboardOverviewData } from "@/api/dashboardApi";
import { getUsers } from "@/api/usersApi";
import { Store, MapPin, Phone, Mail, Megaphone, ShieldCheck } from "lucide-react";

const Index = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalRevenueChange: 0,
        activeCampaigns: 0,
        activeCampaignsChange: 0,
        totalBranchesChange: 0,
        totalWarranty: 0,
        totalWarrantyChange: 0,
        totalAppointments: 0,
        totalRecall: 0,
        totalEVCheckInProgress: 0,
    });

    const [loading, setLoading] = useState(true);
    const [serviceCenters, setServiceCenters] = useState([]);
    const [appointmentStatusData, setAppointmentStatusData] = useState([
        { name: 'Đã check-in', value: 0, color: '#3b82f6' },
        { name: 'Đã hoàn thành', value: 0, color: '#10b981' },
        { name: 'Chờ thanh toán', value: 0, color: '#f59e0b' },
    ]);
    const [monthlySalesData, setMonthlySalesData] = useState([]);
    const [customerRegistrations, setCustomerRegistrations] = useState(
        Array.from({ length: 12 }, (_, i) => ({
            monthIndex: i,
            monthLabel: `Tháng ${i + 1}`,
            value: 0,
        }))
    );
    const [customerRegistrationsSummary, setCustomerRegistrationsSummary] = useState({
        total: 0,
        changePercent: 0,
    });
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

    const displayedCenters = serviceCenters.slice(0, 4);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                
                const dashboardResponse = await getDashboardOverview();
                const dashboardData = dashboardResponse?.data || dashboardResponse || {};
                const {
                    totalRevenue = 0,
                    totalCampaign = 0,
                    totalRMA = 0,
                    totalAppointment = 0,
                    totalEVCheckInProgress = 0,
                    totalRecall = 0,
                } = dashboardData;
                console.log("Dashboard Data:", dashboardData);
                const serviceCentersResponse = await getServiceCenters({ page: 1, pageSize: 100 });
                const serviceCentersData = serviceCentersResponse?.data || serviceCentersResponse || {};
                const centers = serviceCentersData?.rowDatas || serviceCentersData?.data?.rowDatas || [];
                setServiceCenters(centers);
                try {
                    const overviewResponse = await getDashboardOverviewData(selectedYear);
                    const overviewData = overviewResponse?.data?.data?.data || 
                                        overviewResponse?.data?.data || 
                                        overviewResponse?.data || 
                                        [];
                    console.log("Overview Data:", overviewData);
                    if (Array.isArray(overviewData) && overviewData.length > 0) {
                        const mapped = overviewData.map((item) => ({
                            month: `Tháng ${item.month}`,
                            maintenance: Number(item.maintenance) || 0,
                            repair: Number(item.repair) || 0,
                            warranty: Number(item.warranty) || 0,
                        }));
                        setMonthlySalesData(mapped);
                        const currentMonth = new Date().getMonth() + 1;
                        const currentMonthData = overviewData.find((item) => item.month === currentMonth);
                        if (currentMonthData) {
                            const statusData = [
                                { 
                                    name: 'Đã check-in', 
                                    value: Number(currentMonthData.checkedIn) || 0, 
                                    color: '#3b82f6' 
                                },
                                { 
                                    name: 'Đã hoàn thành', 
                                    value: Number(currentMonthData.completed) || 0, 
                                    color: '#10b981' 
                                },
                                { 
                                    name: 'Chờ thanh toán', 
                                    value: Number(currentMonthData.waitingForPayment) || 0, 
                                    color: '#f59e0b' 
                                },
                            ];
                            setAppointmentStatusData(statusData);
                        } else {
                            setAppointmentStatusData([
                                { name: 'Đã check-in', value: 0, color: '#3b82f6' },
                                { name: 'Đã hoàn thành', value: 0, color: '#10b981' },
                                { name: 'Chờ thanh toán', value: 0, color: '#f59e0b' },
                            ]);
                        }
                    } else {
                        const defaultData = Array.from({ length: 12 }, (_, i) => ({
                            month: `Tháng ${i + 1}`,
                            maintenance: 0,
                            repair: 0,
                            warranty: 0,
                        }));
                        setMonthlySalesData(defaultData);
                        setAppointmentStatusData([
                            { name: 'Đã check-in', value: 0, color: '#3b82f6' },
                            { name: 'Đã hoàn thành', value: 0, color: '#10b981' },
                            { name: 'Chờ thanh toán', value: 0, color: '#f59e0b' },
                        ]);
                    }
                } catch (overviewError) {
                    const defaultData = Array.from({ length: 12 }, (_, i) => ({
                        month: `Tháng ${i + 1}`,
                        maintenance: 0,
                        repair: 0,
                        warranty: 0,
                    }));
                    setMonthlySalesData(defaultData);
                    setAppointmentStatusData([
                        { name: 'Đã check-in', value: 0, color: '#3b82f6' },
                        { name: 'Đã hoàn thành', value: 0, color: '#10b981' },
                        { name: 'Chờ thanh toán', value: 0, color: '#f59e0b' },
                    ]);
                }

                let finalTotalCampaign = totalCampaign || 0;
                let finalTotalAppointments = totalAppointment || 0;
                try {
                    const overviewResponseForStats = await getDashboardOverviewData(selectedYear);
                    const overviewDataForStats = overviewResponseForStats?.data?.data?.data || 
                                                 overviewResponseForStats?.data?.data || 
                                                 overviewResponseForStats?.data || 
                                                 [];
                    if (Array.isArray(overviewDataForStats) && overviewDataForStats.length > 0) {
                        finalTotalCampaign = overviewDataForStats.reduce((sum, item) => sum + (Number(item.campaign) || 0), 0);
                        finalTotalAppointments = overviewDataForStats.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
                    }
                } catch (error) {
                    console.error("Error calculating total campaigns and appointments:", error);
                }

                setStats({
                    totalRevenue: totalRevenue || 0,
                    totalRevenueChange: 0, 
                    activeCampaigns: finalTotalCampaign,
                    activeCampaignsChange: 0, 
                    totalBranchesChange: 0, 
                    totalWarranty: totalRMA || 0,
                    totalWarrantyChange: 0,
                    totalAppointments: finalTotalAppointments,
                    totalRecall: totalRecall || 0,
                    totalEVCheckInProgress: totalEVCheckInProgress || 0,
                });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                setStats({
                    totalRevenue: 0,
                    totalRevenueChange: 0,
                    activeCampaigns: 0,
                    activeCampaignsChange: 0,
                    totalWarranty: 0,
                    totalWarrantyChange: 0,
                    totalAppointments: 0,
                    totalRecall: 0,
                    totalEVCheckInProgress: 0,
                });
            } finally {
                setLoading(false);
            }
        };

        const fetchCustomerRegistrations = async () => {
            try {
                const response = await getUsers(1, 1000);
                const data =
                    response?.data?.rowDatas ||
                    response?.data?.data?.rowDatas ||
                    response?.rowDatas ||
                    [];

                const customers = data.filter(
                    (u) => u.roleName === "ROLE_CUSTOMER" && u.customer?.createdAt
                );

                const now = new Date();
                const currentYearForCustomers = now.getFullYear();

                const monthlyCounts = Array.from({ length: 12 }, (_, i) => ({
                    monthIndex: i,
                    monthLabel: `Tháng ${i + 1}`,
                    value: 0,
                }));

                customers.forEach((user) => {
                    const createdAt = new Date(user.customer.createdAt);
                    if (createdAt.getFullYear() !== currentYearForCustomers) return;
                    const monthIdx = createdAt.getMonth();
                    if (monthIdx >= 0 && monthIdx < 12) {
                        monthlyCounts[monthIdx].value += 1;
                    }
                });

                const totalThisYear = monthlyCounts.reduce((sum, m) => sum + m.value, 0);
                const firstHalf = monthlyCounts.slice(0, 6).reduce((s, m) => s + m.value, 0);
                const secondHalf = monthlyCounts.slice(6).reduce((s, m) => s + m.value, 0);

                let changePercent = 0;
                if (firstHalf > 0) {
                    changePercent = ((secondHalf - firstHalf) / firstHalf) * 100;
                }

                setCustomerRegistrations(monthlyCounts);
                setCustomerRegistrationsSummary({
                    total: totalThisYear,
                    changePercent: Number.isFinite(changePercent)
                        ? Math.round(changePercent * 10) / 10
                        : 0,
                });
            } catch (error) {
                console.error("Error fetching customer registrations:", error);
            }
        };

        fetchStats();
        fetchCustomerRegistrations();
    }, [selectedYear]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="p-8 max-w-[95%] mx-auto space-y-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                        <LayoutDashboard className="h-8 w-8 text-red-600"/>
                        Dashboard
                    </h1>
                    <p className="text-slate-600">Tổng quan hệ thống quản lý xe điện</p>
                    <div className="mt-3 h-[2px] w-24 rounded-full bg-red-500/70" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4">
                            <div className="flex-1">
                                <CardTitle className="text-sm font-medium text-slate-600">Tổng doanh thu</CardTitle>
                                <p className="mt-1 text-xs text-slate-400">Tất cả dịch vụ trong hệ thống</p>
                            </div>
                            <div className="p-2 rounded-full bg-emerald-50 text-emerald-600">
                                <DollarSign className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-1">
                            <div className="text-2xl font-semibold text-slate-900">
                                {loading ? '...' : formatCurrency(stats.totalRevenue)}
                            </div>
                            <p className={`text-xs mt-2 flex items-center gap-1 ${
                                stats.totalRevenueChange >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                                {stats.totalRevenueChange >= 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : (
                                    <TrendingDown className="h-3 w-3" />
                                )}
                                <span>
                                    {stats.totalRevenueChange >= 0 ? '+' : ''}
                                    {stats.totalRevenueChange.toFixed(2)}% so với kỳ trước
                                </span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4">
                            <div className="flex-1">
                                <CardTitle className="text-sm font-medium text-slate-600">Tổng chiến dịch</CardTitle>
                                <p className="mt-1 text-xs text-slate-400">Tất cả chiến dịch</p>
                            </div>
                            <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                                <Megaphone className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-1">
                            <div className="text-2xl font-semibold text-slate-900">
                                {loading ? '...' : stats.activeCampaigns.toLocaleString('vi-VN')}
                            </div>
                            <p className={`text-xs mt-2 flex items-center gap-1 ${
                                stats.activeCampaignsChange >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                                {stats.activeCampaignsChange >= 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : (
                                    <TrendingDown className="h-3 w-3" />
                                )}
                                <span>
                                    {stats.activeCampaignsChange >= 0 ? '+' : ''}
                                    {stats.activeCampaignsChange.toFixed(2)}% so với kỳ trước
                                </span>
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4">
                            <div className="flex-1">
                                <CardTitle className="text-sm font-medium text-slate-600">Tổng bảo hành</CardTitle>
                                <p className="mt-1 text-xs text-slate-400">Tất cả yêu cầu bảo hành</p>
                            </div>
                            <div className="p-2 rounded-full bg-emerald-50 text-emerald-600">
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-1">
                            <div className="text-2xl font-semibold text-slate-900">
                                {loading ? '...' : stats.totalWarranty.toLocaleString('vi-VN')}
                            </div>
                            <p className={`text-xs mt-2 flex items-center gap-1 ${
                                stats.totalWarrantyChange >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                                {stats.totalWarrantyChange >= 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : (
                                    <TrendingDown className="h-3 w-3" />
                                )}
                                <span>
                                    {stats.totalWarrantyChange >= 0 ? '+' : ''}
                                    {stats.totalWarrantyChange.toFixed(2)}% so với kỳ trước
                                </span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-amber-500" />
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4">
                            <div className="flex-1">
                                <CardTitle className="text-sm font-medium text-slate-600">Tổng lịch hẹn</CardTitle>
                                <p className="mt-1 text-xs text-slate-400">Tất cả lịch hẹn</p>
                            </div>
                            <div className="p-2 rounded-full bg-orange-50 text-orange-600">
                                <Calendar className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-1">
                            <div className="text-2xl font-semibold text-slate-900">
                                {loading ? '...' : stats.totalAppointments.toLocaleString('vi-VN')}
                            </div>
                            <p className="text-xs mt-2 flex items-center gap-1 text-emerald-600">
                                <TrendingUp className="h-3 w-3" />
                                <span>+0.00% so với kỳ trước</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-slate-900">Số lượng loại lịch hẹn</CardTitle>
                                    <p className="text-sm text-slate-500 mt-1">Số lượng loại lịch hẹn theo từng tháng trong năm</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-slate-600 whitespace-nowrap">Năm:</label>
                                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue placeholder="Chọn năm" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((year) => (
                                                <SelectItem key={year} value={year.toString()}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <AreaChart data={monthlySalesData.length ? monthlySalesData : Array.from({ length: 12 }, (_, i) => ({
                                    month: `Tháng ${i + 1}`,
                                    maintenance: 0,
                                    repair: 0,
                                    warranty: 0,
                                }))} margin={{ top: 0, right: 0, left: 0, bottom: 10 }}>
                                    <defs>
                                        <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        </linearGradient>
                                        <linearGradient id="colorRepair" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                                        </linearGradient>
                                        <linearGradient id="colorWarranty" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="month" 
                                        stroke="#64748b"
                                        style={{ fontSize: '11px' }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis 
                                        stroke="#64748b"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#fff', 
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Area 
                                        type="monotone" 
                                        dataKey="maintenance" 
                                        stroke="#3b82f6" 
                                        fillOpacity={1} 
                                        fill="url(#colorMaintenance)" 
                                        name="Bảo dưỡng"
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="repair" 
                                        stroke="#f97316" 
                                        fillOpacity={1} 
                                        fill="url(#colorRepair)" 
                                        name="Sửa chữa"
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="warranty" 
                                        stroke="#10b981" 
                                        fillOpacity={1} 
                                        fill="url(#colorWarranty)" 
                                        name="Bảo hành"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-slate-900">Đăng ký</CardTitle>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Số lượng khách hàng đăng ký theo tháng (năm hiện tại)
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-slate-900">
                                        +{customerRegistrationsSummary.total}
                                    </div>
                                    <p className="text-xs flex items-center gap-1">
                                        <TrendingUp
                                            className={`h-3 w-3 ${
                                                customerRegistrationsSummary.changePercent >= 0
                                                    ? "text-emerald-600"
                                                    : "text-red-500"
                                            }`}
                                        />
                                        <span
                                            className={
                                                customerRegistrationsSummary.changePercent >= 0
                                                    ? "text-emerald-600"
                                                    : "text-red-500"
                                            }
                                        >
                                            {customerRegistrationsSummary.changePercent >= 0 ? "+" : ""}
                                            {customerRegistrationsSummary.changePercent}% so với 6 tháng đầu năm
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={customerRegistrations}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="monthLabel"
                                        stroke="#64748b"
                                        style={{ fontSize: "12px" }}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        style={{ fontSize: "12px" }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#fff",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {customerRegistrations.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.value > 0 ? "#14b8a6" : "#e5e7eb"}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-slate-600" />
                                Phân bố trạng thái đơn hàng
                            </CardTitle>
                            <p className="text-sm text-slate-500 mt-1">Tổng quan trạng thái các đơn hàng</p>
                        </CardHeader>
                        <CardContent>
                            {appointmentStatusData.length > 0 ? (
                                <div className="flex flex-col items-center gap-6">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie
                                                data={appointmentStatusData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={100}
                                                innerRadius={60}
                                                fill="#8884d8"
                                                dataKey="value"
                                                paddingAngle={3}
                                            >
                                                {appointmentStatusData.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={entry.color}
                                                        stroke="#fff"
                                                        strokeWidth={3}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#fff', 
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                }}
                                                formatter={(value, name) => [
                                                    `${value} đơn hàng`,
                                                    name
                                                ]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="w-full grid grid-cols-2 gap-4">
                                        {appointmentStatusData.map((entry, index) => {
                                            const total = appointmentStatusData.reduce((sum, item) => sum + item.value, 0);
                                            const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0';
                                            return (
                                                <div key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                                    <div 
                                                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                                                        style={{ backgroundColor: entry.color }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-slate-900 truncate">
                                                            {entry.name}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-xs font-semibold text-slate-700">
                                                                {entry.value}
                                                            </span>
                                                            <span className="text-xs text-slate-500">
                                                                ({percentage}%)
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="w-full pt-3 border-t border-slate-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-600">Tổng cộng</span>
                                            <span className="text-base font-bold text-slate-900">
                                                {appointmentStatusData.reduce((sum, item) => sum + item.value, 0)} đơn hàng
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-slate-400">
                                    <p>Chưa có dữ liệu</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-xl">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <Store className="h-5 w-5 text-slate-600" />
                                    Danh sách chi nhánh
                                </CardTitle>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate("/admin/branches")}
                                className="shrink-0"
                            >
                                Xem thêm
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {serviceCenters.length > 0 ? (
                                <div className="space-y-3">
                                    {displayedCenters.map((center, index) => {
                                        const getStatusBadge = (status) => {
                                            const statusUpper = status?.toUpperCase();
                                            if (statusUpper === 'ACTIVE') {
                                                return (
                                                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                                        Hoạt động
                                                    </Badge>
                                                );
                                            }
                                            if (statusUpper === 'IN_ACTIVE' || statusUpper === 'INACTIVE' || statusUpper === 'IN-ACTIVE') {
                                                return (
                                                    <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">
                                                        Ngưng hoạt động
                                                    </Badge>
                                                );
                                            }
                                            return (
                                                <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">
                                                    {statusUpper || "Không rõ"}
                                                </Badge>
                                            );
                                        };

                                        const staffCount = center.staffs?.length || 0;
                                        const slotsCount = center.serviceCenterSlots?.length || 0;

                                        return (
                                            <div 
                                                key={center.id || index} 
                                                onClick={() => navigate(`/admin/branches/${center.id}`)}
                                                className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start gap-3 mb-2">
                                                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                                                                <Store className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-slate-900 mb-1">
                                                                    {center.name}
                                                                </h4>
                                                                <p className="text-xs font-mono text-slate-500 mb-2">
                                                                    {center.code}
                                                                </p>
                                                                <div className="space-y-1.5">
                                                                    {center.address && (
                                                                        <div className="flex items-start gap-2 text-sm text-slate-600">
                                                                            <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                                                                            <span className="line-clamp-1">{center.address}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center gap-4 flex-wrap">
                                                                        {center.phone && (
                                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                                                <span>{center.phone}</span>
                                                                            </div>
                                                                        )}
                                                                        {center.email && (
                                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                                                <span className="truncate max-w-[150px]">{center.email}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                                            <Users className="h-3.5 w-3.5 text-slate-400" />
                                                                            <span>{staffCount} nhân viên</span>
                                                                        </div>
                                                                        {slotsCount > 0 && (
                                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                                                <span>{slotsCount} slot</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        {getStatusBadge(center.status)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-slate-400">
                                    <p>Chưa có chi nhánh nào</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Index;
