import { useEffect, useState } from 'react';
import { CLINIC_INFO } from '@/constants/clinicInfo';
import { getPublicClinicInformation } from '@/services/clinicInformationService';

export default function useClinicInformation() {
  const [clinicInformation, setClinicInformation] = useState(CLINIC_INFO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getPublicClinicInformation()
      .then(data => {
        if (active) setClinicInformation({ ...CLINIC_INFO, ...data });
      })
      .catch(() => {
        // Dùng dữ liệu mặc định để các trang công khai và mẫu in không bị trống.
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return { clinicInformation, loading };
}
