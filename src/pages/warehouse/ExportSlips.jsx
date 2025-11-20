import { useState } from "react";
import { Search, RefreshCw, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExportSlipsTable } from "@/components/warehouse/ExportSlipsTable";

export default function ExportSlips() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [woCode, setWoCode] = useState("");

    const handleRefresh = () => {
        // TODO: Implement refresh functionality
        console.log("Refreshing data...");
    };

    const handleClearFilters = () => {
        setSearchQuery("");
        setStatusFilter("");
        setDateFrom("");
        setWoCode("");
    };

    const handleCreateExportSlip = () => {
        // TODO: Implement create export slip functionality
        console.log("Creating new export slip...");
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Danh sách Phiếu xuất kho
                    </h1>
                    <p className="text-muted-foreground">
                        Quản lý và theo dõi các phiếu xuất kho
                    </p>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Tìm mã phiếu/VIN..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="pl-9"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            className="gap-2"
                            onClick={handleRefresh}
                        >
                            <RefreshCw className="h-4 w-4" />
                            Làm mới
                        </Button>
                        <Button 
                            className="gap-2 bg-primary hover:bg-primary/90"
                            onClick={handleCreateExportSlip}
                        >
                            <Plus className="h-4 w-4" />
                            Tạo phiếu xuất
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">Bộ lọc:</span>
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="Đã xuất">Đã xuất</SelectItem>
                            <SelectItem value="Chờ duyệt">Chờ duyệt</SelectItem>
                            <SelectItem value="Đã duyệt">Đã duyệt</SelectItem>
                        </SelectContent>
                    </Select>

                    <Input 
                        type="date"
                        placeholder="Từ ngày"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-[180px]"
                    />

                    <Input 
                        placeholder="Mã WO"
                        value={woCode}
                        onChange={(e) => setWoCode(e.target.value)}
                        className="w-[180px]"
                    />

                    {(searchQuery || statusFilter || dateFrom || woCode) && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleClearFilters}
                            className="text-primary hover:text-primary/90 gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Xóa lọc
                        </Button>
                    )}
                </div>

                {/* Export Slips Table */}
                <ExportSlipsTable 
                    searchQuery={searchQuery}
                    statusFilter={statusFilter}
                    dateFrom={dateFrom}
                    woCode={woCode}
                />
            </div>
        </div>
    );
}

