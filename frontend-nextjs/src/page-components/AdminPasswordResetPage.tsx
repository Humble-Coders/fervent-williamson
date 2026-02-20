'use client';
import React, { useState } from 'react';
import { logger } from '@/config/logger';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, Key, CheckCircle, User, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import { buildApiUrl } from '../config/env';
import { passwordSchema, isPasswordStrong, VALIDATION_MESSAGES } from '../utils/validation';
import { adminService } from '../services/adminService';

interface AdminUser {
    id: string;
    name: string;
    email: string;
}

const AdminPasswordResetPage: React.FC = () => {
    const router = useRouter();

    // State
    const [step, setStep] = useState<1 | 2>(1);
    const [setupPassword, setSetupPassword] = useState('');
    const [selectedAdminId, setSelectedAdminId] = useState('');
    const [admins, setAdmins] = useState<AdminUser[]>([]);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Field errors
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateStep1 = () => {
        if (!setupPassword.trim()) {
            setErrors({ setupPassword: 'Setup password is required' });
            return false;
        }
        return true;
    };

    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep1()) return;

        setLoading(true);
        setError('');
        setErrors({});

        try {
            const data = await adminService.verifySetupPassword(setupPassword);

            if (data.admins && data.admins.length > 0) {
                setAdmins(data.admins);
                setStep(2);
                // Pre-select first admin
                setSelectedAdminId(data.admins[0].id);
            } else {
                setError('Setup password verified but no admins found.');
            }
        } catch (err: any) {
            logger.error('Error verifying setup password:', err);
            // Access denied or invalid key usually throws
            setError(err.message || 'Invalid setup password or server error.');
        } finally {
            setLoading(false);
        }
    };

    const validateStep2 = () => {
        const newErrors: { [key: string]: string } = {};
        let isValid = true;

        if (!selectedAdminId) {
            newErrors.admin = 'Please select an admin user';
            isValid = false;
        }

        if (!newPassword) {
            newErrors.newPassword = VALIDATION_MESSAGES.PASSWORD_REQUIRED;
            isValid = false;
        } else {
            const strength = isPasswordStrong(newPassword);
            if (!strength.isStrong) {
                newErrors.newPassword = strength.message;
                isValid = false;
            }
        }

        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = VALIDATION_MESSAGES.PASSWORD_MISMATCH;
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleStep2Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep2()) return;

        setLoading(true);
        setError('');

        const selectedAdmin = admins.find(a => a.id === selectedAdminId);
        if (!selectedAdmin) return;

        try {
            await adminService.resetPassword({
                email: selectedAdmin.email,
                newPassword,
                confirmPassword,
                setupPassword // Pass original setup password
            });

            setSuccess(true);
            setTimeout(() => {
                router.push('/welcome');
            }, 3000);
        } catch (err: any) {
            logger.error('Error resetting password:', err);
            setError(err.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <div className="p-8 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h1>
                        <p className="text-gray-600 mb-6">
                            Password updated for {admins.find(a => a.id === selectedAdminId)?.email}. Redirecting to login...
                        </p>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Admin Password</h1>
                        <p className="text-gray-600">
                            {step === 1 ? 'Enter setup password to verify authority' : 'Select admin and set new password'}
                        </p>
                    </div>

                    {error && (
                        <Alert type="error" message={error} className="mb-6" />
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleStep1Submit} className="space-y-6">
                            <div>
                                <Input
                                    id="setupPassword"
                                    type="password"
                                    value={setupPassword}
                                    onChange={(e) => {
                                        setSetupPassword(e.target.value);
                                        if (errors.setupPassword) setErrors({ ...errors, setupPassword: '' });
                                    }}
                                    autoFocus
                                    placeholder="Enter system setup password"
                                    label="Setup Password"
                                    leftIcon={<Key className="w-5 h-5 text-gray-400" />}
                                    error={errors.setupPassword}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify Password'} <ArrowRight className="w-4 h-4 ml-2 inline" />
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleStep2Submit} className="space-y-6">

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Select Admin User</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                                    <select
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                                        value={selectedAdminId}
                                        onChange={(e) => setSelectedAdminId(e.target.value)}
                                    >
                                        {admins.map(admin => (
                                            <option key={admin.id} value={admin.id}>
                                                {admin.name} ({admin.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
                                    }}
                                    placeholder="New strong password"
                                    label="New Password"
                                    leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
                                    error={errors.newPassword}
                                    required
                                />
                            </div>

                            <div>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                                    }}
                                    placeholder="Confirm new password"
                                    label="Confirm Password"
                                    leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
                                    error={errors.confirmPassword}
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                                    Back
                                </Button>
                                <Button type="submit" className="flex-[2]" disabled={loading}>
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </Button>
                            </div>

                        </form>
                    )}

                </div>
            </Card>
        </div>
    );
};

export default AdminPasswordResetPage;
