import { LayoutDashboard, Users, Car, FileText, DollarSign, TrendingUp, TrendingDown, Activity, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const Index = () => {
    // Mock data for charts
    const monthlyData = [
        { month: 'Jan', users: 400, vehicles: 240, claims: 24, revenue: 2400 },
        { month: 'Feb', users: 300, vehicles: 139, claims: 21, revenue: 1390 },
        { month: 'Mar', users: 200, vehicles: 980, claims: 28, revenue: 9800 },
        { month: 'Apr', users: 278, vehicles: 390, claims: 32, revenue: 3900 },
        { month: 'May', users: 189, vehicles: 480, claims: 35, revenue: 4800 },
        { month: 'Jun', users: 239, vehicles: 380, claims: 29, revenue: 3800 },
        { month: 'Jul', users: 349, vehicles: 430, claims: 31, revenue: 4300 },
    ];

    const deviceData = [
        { name: 'Battery X1', value: 35, color: '#8884d8' },
        { name: 'E-Moto S1', value: 28, color: '#82ca9d' },
        { name: 'Battery Z3', value: 20, color: '#ffc658' },
        { name: 'Motor Y-Pro', value: 17, color: '#ff7300' },
    ];

    const statusData = [
        { name: 'Check-in', value: 45, color: '#10b981' },
        { name: 'In Progress', value: 30, color: '#f59e0b' },
        { name: 'Complete', value: 25, color: '#3b82f6' },
    ];

    const recentActivities = [
        { id: 1, type: 'user', message: 'New user registered: Alex Nguyen', time: '2 minutes ago' },
        { id: 2, type: 'claim', message: 'Warranty claim CL-15 completed', time: '15 minutes ago' },
        { id: 3, type: 'vehicle', message: 'New vehicle E-Moto S1 added', time: '1 hour ago' },
        { id: 4, type: 'user', message: 'User profile updated: Sarah Johnson', time: '2 hours ago' },
        { id: 5, type: 'claim', message: 'Warranty claim CL-12 in progress', time: '3 hours ago' },
    ];

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                    <LayoutDashboard className="h-8 w-8 text-primary"/>
                    Dashboard
                </h1>
                <p className="text-muted-foreground">Welcome to eMotorbike Admin Panel</p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Users</h3>
                            <p className="text-3xl font-bold text-foreground">2,451</p>
                            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                <TrendingUp className="h-4 w-4"/>
                                ↑ 12% from last month
                            </p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                    </div>
                </div>
                
                <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Vehicles</h3>
                            <p className="text-3xl font-bold text-foreground">1,234</p>
                            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                <TrendingUp className="h-4 w-4"/>
                                ↑ 8% from last month
                            </p>
                        </div>
                        <Car className="h-8 w-8 text-green-500" />
                    </div>
                </div>
                
                <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Warranty Claims</h3>
                            <p className="text-3xl font-bold text-foreground">89</p>
                            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                <TrendingDown className="h-4 w-4"/>
                                ↓ 3% from last month
                            </p>
                        </div>
                        <FileText className="h-8 w-8 text-orange-500" />
                    </div>
                </div>
                
                <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Revenue</h3>
                            <p className="text-3xl font-bold text-foreground">$45,231</p>
                            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                <TrendingUp className="h-4 w-4"/>
                                ↑ 15% from last month
                            </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-emerald-500" />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trends - Bar Chart */}
                <div className="bg-card p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="users" fill="#3b82f6" name="Users" />
                            <Bar dataKey="vehicles" fill="#10b981" name="Vehicles" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Revenue Trend - Line Chart */}
                <div className="bg-card p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} name="Revenue ($)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Device Distribution - Pie Chart */}
                <div className="bg-card p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Device Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={deviceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {deviceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Claims Status - Area Chart */}
                <div className="bg-card p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Claims Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="claims" stroke="#ef4444" fill="#fecaca" name="Claims" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Status Overview and Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Claims Status */}
                <div className="bg-card p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Claims Status
                    </h3>
                    <div className="space-y-3">
                        {statusData.map((status, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                                    <span className="text-sm font-medium">{status.name}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">{status.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Activities
                    </h3>
                    <div className="space-y-4">
                        {recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                    activity.type === 'user' ? 'bg-blue-500' :
                                    activity.type === 'claim' ? 'bg-orange-500' :
                                    'bg-green-500'
                                }`}></div>
                                <div className="flex-1">
                                    <p className="text-sm text-foreground">{activity.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Index;
