import { useCallback, useEffect, useState } from 'react';

const stored = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const api = `${import.meta.env.VITE_API_URL}/api/v1/customer/family-members`;

const request = async (url, options = {}) => {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${stored('token')}`,
            ...(options.headers || {}),
        },
    });
    if (response.status === 204) return null;
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.message || body?.error || 'Không thể xử lý thành viên gia đình.');
    return body;
};

export function useFamilyMembers(includeInactive = false) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const reload = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await request(`${api}?includeInactive=${includeInactive}`);
            setMembers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [includeInactive]);

    useEffect(() => { reload(); }, [reload]);

    const mutate = async (url, options) => {
        setSaving(true);
        setError('');
        try {
            const result = await request(url, options);
            await reload();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setSaving(false);
        }
    };

    return {
        members, loading, saving, error, reload,
        createMember: body => mutate(api, { method: 'POST', body: JSON.stringify(body) }),
        updateMember: (id, body) => mutate(`${api}/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
        archiveMember: id => mutate(`${api}/${id}`, { method: 'DELETE' }),
        restoreMember: id => mutate(`${api}/${id}/restore`, { method: 'POST' }),
    };
}
