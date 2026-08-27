// src/hooks/useProfile.js
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const authHeader = () => ({ Authorization: `Bearer ${get('token')}` });

export function useProfile() {
    const { t } = useTranslation('customer');

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const hasToken = !!get('token');
        if (!hasToken) {
            setProfile(null);
            return;
        }
        const fetchProfile = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/profiles/me`,
                    { headers: authHeader() }
                );
                if (!res.ok) throw new Error(t('profile.errors.loadFailed'));
                const data = await res.json();
                // Map accountId thành id để sử dụng cho appointment
                setProfile({ ...data, id: data.accountId || data.id });
            } catch (err) {
                setError(err.message || t('profile.errors.unknown'));
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const saveProfile = async (formData) => {
        setSaving(true);
        setError('');
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/profiles/me`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify(formData),
                }
            );
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || data?.error || t('profile.errors.saveFailed'));
            }
            const data = await res.json();
            setProfile({ ...data, id: data.accountId || data.id });
            return true;
        } catch (err) {
            setError(err.message || t('profile.errors.unknown'));
            return false;
        } finally {
            setSaving(false);
        }
    };

    return { profile, loading, saving, error, saveProfile };
}
