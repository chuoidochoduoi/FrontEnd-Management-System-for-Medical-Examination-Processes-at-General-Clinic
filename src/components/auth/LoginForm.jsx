import React, { useState } from 'react';
import TextField from '../ui/TextField';
import Checkbox from '../ui/Checkbox';
import Button from '../ui/Button';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LOGIN_PAGE } from '../../constants/authConfig';
import useForm from '../../hooks/useForm';
import { login as loginRequest } from '../../services/authService';

const iconMap = {
    user: User,
    lock: Lock,
};

const LoginForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [apiError, setApiError] = useState('');
    const navigate = useNavigate();

    const fields = LOGIN_PAGE.fields;
    const initialValues = fields.reduce((acc, f) => ({ ...acc, [f.name]: '' }), {});

    const { values, errors, submitting, handleChange, handleSubmit } = useForm({
        initialValues,
        fields,
        onSubmit: async (vals) => {
            try {
                setApiError('');

                const response = await loginRequest({
                    ...vals,
                    remember,
                });

                const userData = response.data || response;

                localStorage.setItem(
                    'token',
                    userData.token
                );

                localStorage.setItem(
                    'user',
                    JSON.stringify(userData)
                );

                switch (userData.role?.toLowerCase()) {

                    case 'admin':
                        navigate('/admin');
                        break;

                    case 'doctor':
                        navigate('/waiting-room');
                        break;

                    case 'lab':
                        navigate('/lab');
                        break;

                    case 'receptionist':
                        navigate('/PatientProfilePage');
                        break;

                    default:
                        navigate('/');
                }

            } catch (err) {
                setApiError(err.message);
            }
        },
    });

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map(f => (
                <div key={f.name} className="relative">
                    <TextField
                        label={f.label}
                        name={f.name}
                        type={f.type === 'password' && showPassword ? 'text' : f.type}
                        placeholder={f.placeholder}
                        value={values[f.name] || ''}
                        onChange={handleChange}
                        error={errors[f.name]}
                        Icon={iconMap[f.icon]}
                    />
                    {f.type === 'password' && (
                        <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-4 -mt-10 text-slate-400 hover:text-slate-600">
                            {showPassword ? (<EyeOff size={20} />) : (<Eye size={20} />)}
                        </button>
                    )}
                </div>
            ))}

            <div className="flex items-center justify-between">
                <Checkbox id="remember" checked={remember} onChange={setRemember} label="Remember me" />
                <a href="#" className="text-sm font-bold text-[#1ab2a6] hover:underline">Forgot password?</a>
            </div>

            <Button type="submit" variant="primary" className="w-full py-4 text-lg" disabled={submitting}>Login</Button>
        </form>
    );
};

export default LoginForm;
