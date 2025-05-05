'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { enrollmentApi } from '@/lib/api/enrollments';
import { studentApi } from '@/lib/api/students';
import { courseApi } from '@/lib/api/courses';
import { CreateEnrollmentDto } from '@/types/enrollment';
import { Student } from '@/types/student';
import { Course } from '@/types/course';
import { SearchableSelect } from '../ui/SearchableSelect';

export function EnrollmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const [formData, setFormData] = useState<CreateEnrollmentDto>({
    student: '',
    course: '',
    isActive: true,
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for studentId in URL params
    const studentId = searchParams.get('studentId');
    if (studentId) {
      setFormData(prev => ({ ...prev, student: studentId }));
    }

    const fetchOptions = async () => {
      if (!token) return;

      setIsLoading(true);

      try {
        const [studentsResponse, coursesResponse] = await Promise.all([
          studentApi.getAll(token),
          courseApi.getAll(token),
        ]);

        if (studentsResponse.data) {
          setStudents(studentsResponse.data);
        }

        if (coursesResponse.data) {
          setCourses(coursesResponse.data);
        }
      } catch (err) {
        console.error('Failed to fetch options:', err);
        setFormError('Failed to load form options');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [token, searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.student) {
      newErrors.student = 'Student is required';
    }

    if (!formData.course) {
      newErrors.course = 'Course is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await enrollmentApi.create(formData, token);

      if (response.error) {
        setFormError(response.error);
        return;
      }

      // Redirect to enrollments page after successful submission
      router.push('/admin/enrollments');
    } catch (error) {
      setFormError('An error occurred. Please try again.');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center my-12">
        <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Enrollment</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {formError && (
            <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
              {formError}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="student" className="text-sm font-medium">
              Student
            </label>
            <SearchableSelect
              id="student"
              name="student"
              value={formData.student}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, student: value }));
                setErrors(prev => ({ ...prev, student: '' }));
                setFormError('');
              }}
              error={errors.student}
              options={students.map(student => ({
                value: student._id,
                label: `${student.fullName} (${student.universityId})`
              }))}
              placeholder="Search students..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="course" className="text-sm font-medium">
              Course
            </label>
            <SearchableSelect
              id="course"
              name="course"
              value={formData.course}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, course: value }));
                setErrors(prev => ({ ...prev, course: '' }));
                setFormError('');
              }}
              error={errors.course}
              options={courses.map(course => ({
                value: course._id,
                label: `${course.name} - Year ${course.yearLevel}, Semester ${course.semester}`
              }))}
              placeholder="Search courses..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="isActive" className="text-sm font-medium">
              Status
            </label>
            <select
              id="isActive"
              name="isActive"
              value={formData.isActive ? 'true' : 'false'}
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  isActive: e.target.value === 'true'
                }));
              }}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/enrollments')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-t-white border-white/30 rounded-full animate-spin"></div>
                <span>Creating...</span>
              </div>
            ) : (
              'Create Enrollment'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}