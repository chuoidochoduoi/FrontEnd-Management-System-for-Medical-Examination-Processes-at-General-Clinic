import { useEffect, useState } from 'react';
import { CLINIC_INFO } from '@/constants/clinicInfo';

const apiBase = import.meta.env.VITE_API_URL;
const displayTime = value => value?.slice(0, 5) || '';

export function usePublicWorkingShifts() {
  const [workingShifts, setWorkingShifts] = useState(CLINIC_INFO.workingShifts);

  useEffect(() => {
    let active = true;
    fetch(`${apiBase}/api/v1/shifts/active`)
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(payload => {
        const shifts = payload?.data ?? payload;
        if (active && Array.isArray(shifts) && shifts.length === 3) {
          setWorkingShifts(shifts.map(shift => ({
            label: shift.name,
            time: `${displayTime(shift.startTime)} - ${displayTime(shift.endTime)}`,
          })));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return workingShifts;
}
