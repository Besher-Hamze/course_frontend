'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { teacherApi } from '@/lib/api/teachers';
import { CreateTeacherDto } from '@/types/teacher';

export function TeacherForm() {
    const router = useRouter();
    const { token } = useAuth();
    const [formData, setFormData] = useState<CreateTeacherDto>({
        username: '',
        fullName: '',
        password: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
        setFormError('');
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.username) newErrors.username = 'Username is required';
        if (!formData.fullName) newErrors.fullName = 'Full name is required';
        if (!formData.password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !token) return;
        setIsSubmitting(true);
        try {
            const response = await teacherApi.create(formData, token);
            if (response.error) {
                setFormError(response.error);
                return;
            }
            router.push('/admin/teachers');
        } catch (error) {
            setFormError('An error occurred. Please try again.');
            console.error('Create teacher error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Teacher</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {formError && (
                        <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">{formError}</div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="username" className="text-sm font-medium">Username</label>
                        <Input
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            error={errors.username}
                            placeholder="Enter username"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
                        <Input
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            error={errors.fullName}
                            placeholder="Enter full name"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium">Password</label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            error={errors.password}
                            placeholder="Enter password"
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => router.push('/admin/teachers')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Teacher'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}


