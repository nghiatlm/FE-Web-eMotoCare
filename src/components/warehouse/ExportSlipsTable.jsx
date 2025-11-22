import { useState, useEffect } from "react";
import { Eye, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data dựa trên thông tin từ hình ảnh
const mockExportSlips = [
    {
        id: 1,
        slipCode: "ISS-250916",
        requester: "Nguyễn Văn A",
        status: "Đã xuất",
        totalTypes: 5,
        totalQuantity: 12,
        exportCount: 3,
        lastUpdated: "16/09/2025 19:15"
    },
    {
        id: 2,
        slipCode: "ISS-250916",
        requester: "Nguyễn Văn A",
        status: "Chờ duyệt",
        totalTypes: 6,
        totalQuantity: 10,
        exportCount: 3,
        lastUpdated: "16/09/2025 19:15"
    },
    {
        id: 3,
        slipCode: "ISS-250916",
        requester: "Nguyễn Văn A",
        status: "Đã duyệt",
        totalTypes: 8,
        totalQuantity: 13,
        exportCount: 4,
        lastUpdated: "16/09/2025 19:15"
    },
    {
        id: 4,
        slipCode: "ISS-250916",
        requester: "Nguyễn Văn A",
        status: "Đã xuất",
        totalTypes: 10,
        totalQuantity: 15,
        exportCount: 3,
        lastUpdated: "16/09/2025 19:15"
    },
    {
        id: 5,
        slipCode: "ISS-250916",
        requester: "Nguyễn Văn A",
        status: "Chờ duyệt",
        totalTypes: 7,
        totalQuantity: 12,
        exportCount: 1,
        lastUpdated: "16/09/2025 19:15"
    }
];

const getStatusBadgeVariant = (status) => {
    switch (status) {
        case "Đã xuất":
            return "default"; // Green
        case "Chờ duyệt":
            return "secondary"; // Orange
        case "Đã duyệt":
            return "outline"; // Blue
        default:
            return "secondary";
    }
};

export function ExportSlipsTable({ searchQuery, statusFilter, dateFrom, woCode }) {
    const [exportSlips, setExportSlips] = useState(mockExportSlips);
    const [filteredSlips, setFilteredSlips] = useState(mockExportSlips);

    // Filter logic
    useEffect(() => {
        let filtered = exportSlips;

        if (searchQuery) {
            filtered = filtered.filter(slip => 
                slip.slipCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                slip.requester.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (statusFilter && statusFilter !== "all") {
            filtered = filtered.filter(slip => slip.status === statusFilter);
        }

        setFilteredSlips(filtered);
    }, [searchQuery, statusFilter, dateFrom, woCode, exportSlips]);

    const handleViewDetails = (slip) => {
        console.log("View details for slip:", slip.slipCode);
        // TODO: Implement view details functionality
    };

    const handlePrintSlip = (slip) => {
        console.log("Print slip:", slip.slipCode);
        // TODO: Implement print functionality
    };

    const handleCancelSlip = (slip) => {
        console.log("Cancel slip:", slip.slipCode);
        // TODO: Implement cancel functionality
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Danh sách Phiếu xuất kho</CardTitle>
                <CardDescription>
                    Quản lý và theo dõi các phiếu xuất kho
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mã phiếu</TableHead>
                                <TableHead>Người yêu cầu</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Tổng loại</TableHead>
                                <TableHead>Tổng SL</TableHead>
                                <TableHead>Số lần xuất</TableHead>
                                <TableHead>Cập nhật</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSlips.map((slip) => (
                                <TableRow key={slip.id}>
                                    <TableCell className="font-medium">
                                        {slip.slipCode}
                                    </TableCell>
                                    <TableCell>{slip.requester}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(slip.status)}>
                                            {slip.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{slip.totalTypes}</TableCell>
                                    <TableCell>{slip.totalQuantity}</TableCell>
                                    <TableCell>{slip.exportCount}</TableCell>
                                    <TableCell>{slip.lastUpdated}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewDetails(slip)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handlePrintSlip(slip)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                            {slip.status === "Chờ duyệt" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCancelSlip(slip)}
                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                        Hiển thị 1-{filteredSlips.length} của {filteredSlips.length} phiếu
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled>
                            &lt;
                        </Button>
                        <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                            1
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                            &gt;
                        </Button>
                        <div className="text-sm text-muted-foreground ml-4">
                            10 / trang
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

