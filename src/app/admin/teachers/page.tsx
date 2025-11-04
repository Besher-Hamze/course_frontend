'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { teacherApi } from '@/lib/api/teachers';
import { Teacher } from '@/types/teacher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell
} from '@/components/ui/table';
import { Plus, Search, ToggleLeft, ToggleRight } from 'lucide-react';

export default function TeachersPage() {
    const router = useRouter();
    const { token } = useAuth();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [filtered, setFiltered] = useState<Teacher[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchTeachers = async () => {
        if (!token) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await teacherApi.getAll(token);
            if (response.error) {
                setError(response.error);
                return;
            }
            if (response.data) {
                setTeachers(response.data);
                setFiltered(response.data);
            }
        } catch (err) {
            setError('Failed to fetch teachers');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, [token]);

    useEffect(() => {
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            setFiltered(
                teachers.filter(t =>
                    t.fullName.toLowerCase().includes(s) || t.username.toLowerCase().includes(s)
                )
            );
        } else {
            setFiltered(teachers);
        }
    }, [searchTerm, teachers]);

    const toggleActive = async (t: Teacher) => {
        if (!token) return;
        try {
            const resp = t.isActive
                ? await teacherApi.deactivate(t._id, token)
                : await teacherApi.activate(t._id, token);
            if (resp.error) {
                alert(resp.error);
                return;
            }
            fetchTeachers();
        } catch (e) {
            console.error(e);
            alert('Failed to update teacher status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Teachers</h1>
                    <p className="text-gray-500 mt-1">Manage teachers (owner only)</p>
                </div>
                <Button onClick={() => router.push('/admin/teachers/create')}>
                    <Plus className="mr-2 h-4 w-4" /> Add Teacher
                </Button>
            </div>

            <Card>
                <CardHeader className="p-4 flex flex-row items-center justify-between">
                    <CardTitle>All Teachers</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search teachers..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center my-12">
                            <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 my-12">{error}</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center text-gray-500 my-12">
                            {searchTerm ? 'No teachers match your search' : 'No teachers found'}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((t) => (
                                    <TableRow key={t._id}>
                                        <TableCell className="font-medium">{t.username}</TableCell>
                                        <TableCell>{t.fullName}</TableCell>
                                        <TableCell>{t.isOwner ? 'Yes' : 'No'}</TableCell>
                                        <TableCell>{t.isActive ? 'Active' : 'Inactive'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => toggleActive(t)}>
                                                {t.isActive ? (
                                                    <><ToggleLeft className="h-4 w-4 mr-1" /> Deactivate</>
                                                ) : (
                                                    <><ToggleRight className="h-4 w-4 mr-1" /> Activate</>
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


