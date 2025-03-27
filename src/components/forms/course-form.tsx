'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { courseApi } from '@/lib/api/courses';
import { CreateCourseDto, UpdateCourseDto } from '@/types/course';

interface CourseFormProps {
  initialData?: {
    _id: string;
    name: string;
    description: string;
    major: string;
    yearLevel: number;
    semester: number;
  };
  mode: 'create' | 'edit';
}

export function CourseForm({ initialData, mode }: CourseFormProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [formData, setFormData] = useState<CreateCourseDto | UpdateCourseDto>(
    initialData || {
      name: '',
      description: '',
      major: '',
      yearLevel: 1,
      semester: 1,
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let parsedValue: string | number = value;

    // Convert yearLevel and semester to numbers
    if (name === 'yearLevel' || name === 'semester') {
      parsedValue = parseInt(value, 10);
    }

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setFormError('');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.major) {
      newErrors.major = 'Major is required';
    }

    if (!formData.yearLevel) {
      newErrors.yearLevel = 'Year level is required';
    }

    if (!formData.semester) {
      newErrors.semester = 'Semester is required';
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
      let response;

      if (mode === 'create') {
        response = await courseApi.create(formData as CreateCourseDto, token);
      } else if (initialData?._id) {
        response = await courseApi.update(initialData._id, formData, token);
      }

      if (response?.error) {
        setFormError(response.error);
        return;
      }

      // Redirect to courses page after successful submission
      router.push('/admin/courses');
    } catch (error) {
      setFormError('An error occurred. Please try again.');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const yearLevelOptions = [
    { value: '1', label: 'Year 1' },
    { value: '2', label: 'Year 2' },
    { value: '3', label: 'Year 3' },
    { value: '4', label: 'Year 4' },
    { value: '5', label: 'Year 5' },
  ];

  const semesterOptions = [
    { value: '1', label: 'First Semester' },
    { value: '2', label: 'Second Semester' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create Course' : 'Edit Course'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {formError && (
            <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
              {formError}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Course Name
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Enter course name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter course description"
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="major" className="text-sm font-medium">
              Major
            </label>
            <Select
              id="major"
              name="major"
              value={formData.major}
              onChange={handleChange}
              error={errors.major}
              options={[
                { value: 'حواسيب', label: 'حواسيب' },
                { value: 'اتصالات', label: 'اتصالات' },
                { value: 'ميكاترونيك', label: 'ميكاترونيك' },
                { value: 'تحكم', label: 'تحكم' },
                { value: 'قدرة', label: 'قدرة' },
                { value: 'قيادة', label: 'قيادة' },
                { value: 'الكترونية', label: 'الكترونية' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="yearLevel" className="text-sm font-medium">
                Year Level
              </label>
              <Select
                id="yearLevel"
                name="yearLevel"
                value={formData.yearLevel!.toString()}
                onChange={handleChange}
                error={errors.yearLevel}
                options={yearLevelOptions}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="semester" className="text-sm font-medium">
                Semester
              </label>
              <Select
                id="semester"
                name="semester"
                value={formData.semester!.toString()}
                onChange={handleChange}
                error={errors.semester}
                options={semesterOptions}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/courses')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-t-white border-white/30 rounded-full animate-spin"></div>
                <span>{mode === 'create' ? 'Creating...' : 'Updating...'}</span>
              </div>
            ) : (
              mode === 'create' ? 'Create Course' : 'Update Course'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
