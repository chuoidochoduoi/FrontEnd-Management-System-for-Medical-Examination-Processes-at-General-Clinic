// src/hooks/useDepartments.js
// Keep for backward compatibility - redirects to useAllDepartments
import { useAllDepartments } from './useAllDepartments';

export function useDepartments() {
    const { examinationRooms: departments, loading, error } = useAllDepartments();
    return { departments, loading, error, reload: () => {} };
}

export default useDepartments;