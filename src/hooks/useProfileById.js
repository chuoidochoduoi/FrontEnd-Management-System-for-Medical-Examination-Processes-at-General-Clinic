// src/hooks/useProfileById.js
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const authHeader = () => ({ Authorization: `Bearer ${get('token')}` });

// Hook để lấy profile theo ID (dùng cho doctor view patient profile)
export function useProfileById(id) {
    const { t } = useTranslation('doctor');

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) {
            setProfile(null);
            return;
        }
        const fetchProfile = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/profiles/${id}`,
                    { headers: authHeader() }
                );
                if (!res.ok) throw new Error(t('examination.errors.loadFailed'));
                setProfile(await res.json());
            } catch (err) {
                setError(err.message || t('examination.errors.unknown'));
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    return { profile, loading, error };
}