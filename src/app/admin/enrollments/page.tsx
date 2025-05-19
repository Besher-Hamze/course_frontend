'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { enrollmentApi } from '@/lib/api/enrollments';
import { Enrollment } from '@/types/enrollment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Search, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function EnrollmentsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEnrollments = async () => {
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await enrollmentApi.getAll(token);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        setEnrollments(response.data);
        setFilteredEnrollments(response.data);
      }
    } catch (err) {
      setError('Failed to fetch enrollments');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [token]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredEnrollments(enrollments);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = enrollments.filter((enrollment) => {
      const studentName = typeof enrollment.student === 'object'
        ? "TT"
        : '';

      const courseName = typeof enrollment.course === 'object'
        ? enrollment.course.name.toLowerCase()
        : '';

      return studentName.includes(searchTermLower) || courseName.includes(searchTermLower);
    });

    setFilteredEnrollments(filtered);
  }, [searchTerm, enrollments]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this enrollment?')) {
      try {
        const response = await enrollmentApi.delete(id, token!);

        if (response.error) {
          alert(`Error: ${response.error}`);
          return;
        }

        // Refresh the enrollments list
        fetchEnrollments();
      } catch (err) {
        console.error('Failed to delete enrollment:', err);
        alert('Failed to delete the enrollment');
      }
    }
  };

  const handleUpdateStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await enrollmentApi.update(
        id,
        { isActive: !isActive },
        token!
      );

      if (response.error) {
        alert(`Error: ${response.error}`);
        return;
      }

      // Refresh the enrollments list
      fetchEnrollments();
    } catch (err) {
      console.error('Failed to update enrollment status:', err);
      alert('Failed to update enrollment status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enrollments</h1>
          <p className="text-gray-500 mt-1">Manage student enrollments in courses</p>
        </div>
        <Button onClick={() => router.push('/admin/enrollments/create')}>
          <Plus className="mr-2 h-4 w-4" /> Create Enrollment
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <CardTitle>All Enrollments</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search enrollments..."
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
          ) : filteredEnrollments.length === 0 ? (
            <div className="text-center text-gray-500 my-12">
              {searchTerm ? 'No enrollments match your search' : 'No enrollments found'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Enroll Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment) => (
                  <TableRow key={enrollment._id}>
                    <TableCell className="font-medium">
                      {typeof enrollment.student === 'object'
                        ? (enrollment.student?.fullName ? enrollment.student.fullName : enrollment._id)
                        : 'Unknown Student'}
                    </TableCell>
                    <TableCell>
                      {typeof enrollment.course === 'object'
                        ? enrollment.course.name
                        : 'Unknown Course'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(enrollment.enrollDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${enrollment.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {enrollment.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateStatus(enrollment._id, enrollment.isActive)}
                        >
                          {enrollment.isActive ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => handleDelete(enrollment._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
