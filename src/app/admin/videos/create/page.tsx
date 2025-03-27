// src/app/admin/videos/create/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { videoApi } from '@/lib/api/videos';
import { courseApi } from '@/lib/api/courses';
import { Course } from '@/types/course';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Upload, Clock, SortDesc } from 'lucide-react';

export default function CreateVideoPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    duration: undefined as number | undefined,
    order: undefined as number | undefined,
    file: null as FileList | null,
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!token) return;

      setIsLoading(true);

      try {
        const response = await courseApi.getAll(token);

        if (response.data) {
          setCourses(response.data);
        } else if (response.error) {
          setFormError('Failed to load courses');
        }
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setFormError('Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Handle numeric fields
    if (name === 'duration' || name === 'order') {
      const numValue = value === '' ? undefined : Number(value);
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    setErrors((prev) => ({ ...prev, [name]: '' }));
    setFormError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({ ...prev, file: e.target.files }));
      setErrors((prev) => ({ ...prev, file: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) {
      newErrors.title = 'Title is required';
    }

    if (!formData.course) {
      newErrors.course = 'Course is required';
    }

    if (!formData.file) {
      newErrors.file = 'Video file is required';
    }

    if (formData.duration !== undefined && formData.duration <= 0) {
      newErrors.duration = 'Duration must be a positive number';
    }

    if (formData.order !== undefined && formData.order < 0) {
      newErrors.order = 'Order must be a non-negative number';
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
      const response = await videoApi.create(formData, token);

      if (response.error) {
        setFormError(response.error);
        return;
      }

      // Redirect to videos page after successful submission
      router.push('/admin/videos');
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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/videos')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold">Upload New Video</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Video Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formError && (
              <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Video Title
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                placeholder="Enter video title"
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
                placeholder="Enter video description"
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="course" className="text-sm font-medium">
                Course
              </label>
              <Select
                id="course"
                name="course"
                value={formData.course}
                onChange={handleChange}
                error={errors.course}
                options={courses.map(course => ({
                  value: course._id,
                  label: `${course.name} - Year ${course.yearLevel}, Semester ${course.semester}`
                }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="duration" className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-1" /> Duration (in seconds, optional)
                </label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  value={formData.duration?.toString() || ''}
                  onChange={handleChange}
                  error={errors.duration}
                  placeholder="Enter video duration"
                />
              </div>

            </div>

            <div className="space-y-2">
              <label htmlFor="file" className="text-sm font-medium">
                Video File
              </label>
              <Input
                id="file"
                name="file"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                error={errors.file}
              />
              <p className="text-xs text-gray-500">
                Supported video formats: MP4, WebM, MOV, AVI
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/videos')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-t-white border-white/30 rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" /> Upload Video
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}