import { useState } from "react";
import { Modal, Upload, Button } from "antd";
import { Upload as UploadIcon, FileText } from "lucide-react";
import { importBatteryDataService } from "../../services/batteryService";
import { toast } from "@/components/ui/sonner";

const { Dragger } = Upload;

export default function BatteryImportModal({ 
  open, 
  onClose, 
  evCheckDetailId,
  onSuccess 
}) {
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    // ✅ Kiểm tra nếu là temp ID thì không cho import
    if (!evCheckDetailId || evCheckDetailId.startsWith("temp_")) {
      toast.error("Vui lòng lưu bộ phận trước khi import dữ liệu pin");
      return;
    }

    if (fileList.length === 0) {
      toast.warning("Vui lòng chọn file để import");
      return;
    }

    const file = fileList[0].originFileObj || fileList[0];
    if (!file) {
      toast.warning("File không hợp lệ");
      return;
    }

    setLoading(true);
    try {
      const result = await importBatteryDataService(evCheckDetailId, file);
      console.log("🔋 Import result:", result);
      
      // ✅ Lấy dữ liệu từ response
      const batteryData = result?.data || result;
      
      toast.success("Import dữ liệu pin thành công!");
      setFileList([]);
      
      // ✅ Truyền dữ liệu từ response vào onSuccess
      onSuccess?.(batteryData);
      onClose();
    } catch (error) {
      console.error("Lỗi import:", error);
      toast.error(error?.response?.data?.message || "Import dữ liệu pin thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      // Chỉ cho phép file Excel hoặc CSV
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                     file.type === 'application/vnd.ms-excel';
      const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
      
      if (!isExcel && !isCSV) {
        toast.error("Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV (.csv)");
        return Upload.LIST_IGNORE;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        toast.error("File phải nhỏ hơn 10MB!");
        return Upload.LIST_IGNORE;
      }

      setFileList([file]);
      return false; // Ngăn tự động upload
    },
    fileList,
    onRemove: () => {
      setFileList([]);
    },
    maxCount: 1,
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <UploadIcon className="h-5 w-5" style={{ color: "#ff4d4f" }} />
          <span>Import dữ liệu Pin</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="upload"
          type="primary"
          loading={loading}
          onClick={handleUpload}
          style={{ backgroundColor: "#ff4d4f", borderColor: "#ff4d4f" }}
        >
          Import
        </Button>,
      ]}
      width={600}
    >
      <div className="space-y-4">
        <Dragger {...uploadProps} className="p-4">
          <p className="ant-upload-drag-icon flex justify-center">
            <UploadIcon className="h-12 w-12 text-gray-400" />
          </p>
          <p className="ant-upload-text text-center">
            Kéo thả file vào đây hoặc click để chọn file
          </p>
          <p className="ant-upload-hint text-center text-gray-500 text-sm">
            Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV (.csv), tối đa 10MB
          </p>
        </Dragger>

        {fileList.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
            <FileText className="h-4 w-4 text-gray-600" />
            <span className="text-sm">{fileList[0].name}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

