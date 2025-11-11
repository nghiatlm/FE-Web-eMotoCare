import { useState, useEffect } from "react";
import { FileText, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WarrantyClaimsTable } from "@/components/WarrantyClaimsTable";
import { EditWarrantyClaimForm } from "@/components/EditWarrantyClaimForm";

export default function WarrantyClaims() {
    const [deviceModelFilter, setDeviceModelFilter] = useState("");
    const [claimStatusFilter, setClaimStatusFilter] = useState("");
    const [isEditClaimOpen, setIsEditClaimOpen] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState(null);

    // Setup global functions for WarrantyClaimsTable communication
    useEffect(() => {
        window.openEditWarrantyDialog = (claim) => {
            setSelectedClaim(claim);
            setIsEditClaimOpen(true);
        };
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-6 w-6 text-primary" />
                        <h1 className="text-3xl font-bold text-foreground">Khiếu nại bảo hành</h1>
                    </div>
                    <p className="text-muted-foreground">Quản lý khiếu nại bảo hành</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Filters:</span>
                    </div>
                    
                    <Select value={deviceModelFilter} onValueChange={setDeviceModelFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Device Model" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Models</SelectItem>
                            <SelectItem value="Battery X1">Battery X1</SelectItem>
                            <SelectItem value="E-Moto S1">E-Moto S1</SelectItem>
                            <SelectItem value="Battery Z3">Battery Z3</SelectItem>
                            <SelectItem value="Motor Y-Pro">Motor Y-Pro</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={claimStatusFilter} onValueChange={setClaimStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Claim Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Check-in">Check-in</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Complete">Complete</SelectItem>
                        </SelectContent>
                    </Select>

                    {(deviceModelFilter || claimStatusFilter) && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                                setDeviceModelFilter("");
                                setClaimStatusFilter("");
                            }} 
                            className="text-primary hover:text-primary/90"
                        >
                            Xóa lọc
                        </Button>
                    )}
                </div>

                {/* Warranty Claims Table */}
                <WarrantyClaimsTable 
                    deviceModelFilter={deviceModelFilter}
                    claimStatusFilter={claimStatusFilter}
                />

                {/* Edit Warranty Claim Dialog */}
                <EditWarrantyClaimForm 
                    open={isEditClaimOpen}
                    onOpenChange={setIsEditClaimOpen}
                    claim={selectedClaim}
                    onClaimUpdated={() => {
                        // WarrantyClaimsTable will handle the update
                    }}
                />
            </div>
        </div>
    );
}
