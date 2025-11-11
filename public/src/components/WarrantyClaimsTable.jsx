import { useState, useMemo, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockWarrantyClaims = [
    {
        id: "CL-1",
        deviceModel: "Battery X1",
        serialNumber: "SN123456789",
        issueDescription: "Xe không khởi động được sau khi sạc đầy.",
        submittedDate: "2023-01-15",
        ownerName: "Alex Nguyen",
        status: "Check-in"
    },
    {
        id: "CL-2",
        deviceModel: "E-Moto S1",
        serialNumber: "SN123456789",
        issueDescription: "Pin sạc rất lâu nhưng hết nhanh.",
        submittedDate: "2023-01-15",
        ownerName: "Philip",
        status: "In Progress"
    },
    {
        id: "CL-3",
        deviceModel: "Battery Z3",
        serialNumber: "SN123456789",
        issueDescription: "Không thể kết nối với app qua Bluetooth.",
        submittedDate: "2023-01-15",
        ownerName: "Hou Bink",
        status: "Check-in"
    },
    {
        id: "CL-4",
        deviceModel: "Motor Y-Pro",
        serialNumber: "SN123456789",
        issueDescription: "Xe rung lắc mạnh khi tăng tốc.",
        submittedDate: "2023-01-15",
        ownerName: "Cao Cao",
        status: "Complete"
    },
    {
        id: "CL-5",
        deviceModel: "E-Moto S1",
        serialNumber: "SN123456789",
        issueDescription: "Sạc bị nóng bất thường sau 10 phút cắm.",
        submittedDate: "2023-01-15",
        ownerName: "Mina",
        status: "In Progress"
    },
    {
        id: "CL-6",
        deviceModel: "E-Moto S1",
        serialNumber: "SN123456789",
        issueDescription: "Xe rung lắc mạnh khi tăng tốc.",
        submittedDate: "2023-01-15",
        ownerName: "Yi",
        status: "Complete"
    },
    {
        id: "CL-7",
        deviceModel: "Battery Z3",
        serialNumber: "SN123456789",
        issueDescription: "Đèn pha không sáng dù đã bật.",
        submittedDate: "2023-01-15",
        ownerName: "Alex",
        status: "In Progress"
    },
    {
        id: "CL-8",
        deviceModel: "Motor Y-Pro",
        serialNumber: "SN123456789",
        issueDescription: "Xe rung lắc mạnh khi tăng tốc.",
        submittedDate: "2023-01-15",
        ownerName: "Charlet",
        status: "Complete"
    },
    {
        id: "CL-9",
        deviceModel: "E-Moto S1",
        serialNumber: "SN123456789",
        issueDescription: "Đèn pha không sáng dù đã bật.",
        submittedDate: "2023-01-15",
        ownerName: "Jonh",
        status: "Check-in"
    }
];

export function WarrantyClaimsTable({ deviceModelFilter = "", claimStatusFilter = "" }) {
    const [claims, setClaims] = useState(mockWarrantyClaims);
    
    // Function to update claim (can be called from parent)
    const updateClaim = (updatedClaim) => {
        setClaims(prevClaims => 
            prevClaims.map(claim => 
                claim.id === updatedClaim.id ? updatedClaim : claim
            )
        );
    };
    
    // Function to delete claim (can be called from parent)
    const deleteClaim = (claimId) => {
        setClaims(prevClaims => 
            prevClaims.filter(claim => claim.id !== claimId)
        );
    };
    
    // Expose functions to parent component
    useEffect(() => {
        window.updateWarrantyClaim = updateClaim;
        window.deleteWarrantyClaim = deleteClaim;
    }, []);
    
    // Filter claims based on filter criteria
    const filteredClaims = useMemo(() => {
        return claims.filter(claim => {
            // Device Model filter
            const matchesDeviceModel = !deviceModelFilter || 
                deviceModelFilter === "all" ||
                claim.deviceModel === deviceModelFilter;
            
            // Claim Status filter
            const matchesClaimStatus = !claimStatusFilter || 
                claimStatusFilter === "all" ||
                claim.status === claimStatusFilter;
            
            return matchesDeviceModel && matchesClaimStatus;
        });
    }, [claims, deviceModelFilter, claimStatusFilter]);
    
    // Check if any filters are active
    const hasActiveFilters = (deviceModelFilter && deviceModelFilter !== "all") || 
                            (claimStatusFilter && claimStatusFilter !== "all");

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case "Check-in":
                return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
            case "In Progress":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
            case "Complete":
                return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
        }
    };

    return (
        <div>
            {/* Results Count */}
            <p className="text-sm text-muted-foreground mb-4">
                {hasActiveFilters 
                    ? `Hiển thị ${filteredClaims.length}/${claims.length} khiếu nại`
                    : `Tổng ${claims.length} khiếu nại`
                }
            </p>
            
            <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Mã khiếu nại</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Mẫu thiết bị</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Số serial</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Mô tả vấn đề</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Ngày gửi</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Tên chủ sở hữu</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Trạng thái</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClaims.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-12 px-6 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="text-muted-foreground text-sm">Không tìm thấy khiếu nại nào</p>
                                            <p className="text-xs text-muted-foreground">Hãy thay đổi bộ lọc để thử lại</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredClaims.map((claim, index) => (
                                    <tr 
                                        key={claim.id} 
                                        className={`border-b border-border hover:bg-muted/30 transition-colors ${
                                            index % 2 === 0 ? "bg-card" : "bg-muted/10"
                                        }`}
                                    >
                                        <td className="py-4 px-6 text-sm font-medium text-muted-foreground">
                                            {claim.id}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-foreground">
                                            {claim.deviceModel}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-muted-foreground">
                                            {claim.serialNumber}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-foreground max-w-xs">
                                            <div className="truncate" title={claim.issueDescription}>
                                                {claim.issueDescription}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-muted-foreground">
                                            {claim.submittedDate}
                                        </td>
                                        <td className="py-4 px-6 text-sm font-medium text-foreground">
                                            {claim.ownerName}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(claim.status)}`}>
                                                {claim.status === 'Check-in' ? 'Đã tiếp nhận' : claim.status === 'In Progress' ? 'Đang xử lý' : claim.status === 'Complete' ? 'Hoàn tất' : claim.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                    title="Sửa khiếu nại"
                                                    onClick={() => {
                                                        if (window.openEditWarrantyDialog) {
                                                            window.openEditWarrantyDialog(claim);
                                                        }
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4"/>
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    title="Xóa khiếu nại"
                                                    onClick={() => {
                                                        if (window.deleteWarrantyClaim) {
                                                            if (confirm(`Bạn có chắc muốn xóa khiếu nại ${claim.id}?`)) {
                                                                window.deleteWarrantyClaim(claim.id);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
