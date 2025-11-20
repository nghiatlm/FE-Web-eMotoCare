import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";

export const useServiceCenter = () => {
  const { user } = useAuth();
  const [serviceCenterId, setServiceCenterId] = useState(null);
  const [staffId, setStaffId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceCenter = async () => {
      try {
        const accountId = user?.accountResponse?.id;
        if (!accountId) {
          setLoading(false);
          return;
        }

        const staffResponse = await getStaffByAccountId(accountId);
        const staffData = staffResponse?.data?.rowDatas?.[0] || staffResponse?.data?.[0];
        
        if (staffData) {
          if (staffData.serviceCenterId) {
            setServiceCenterId(staffData.serviceCenterId);
          }
          if (staffData.id) {
            setStaffId(staffData.id);
          }
        }
      } catch (error) {
        console.error("Error fetching service center:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchServiceCenter();
    } else {
      setLoading(false);
    }
  }, [user]);

  return { serviceCenterId, staffId, loading };
};

