'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { courseApi } from '@/lib/api/courses';
import { Course } from '@/types/course';
import { CourseForm } from '@/components/forms/course-form';

export default function EditCoursePage() {
  const params = useParams();
  const courseId = params.id as string;
  const { token } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      if (!token || !courseId) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        const response = await courseApi.getById(courseId, token);
        
        if (response.error) {
          setError(response.error);
          return;
        }
        
        if (response.data) {
          setCourse(response.data);
        }
      } catch (err) {
        setError('Failed to fetch course details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, token]);

  if (isLoading) {
    return (
      <div className="flex justify-center my-12">
        <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 my-12">{error}</div>
    );
  }

  if (!course) {
    return (
      <div className="text-center text-gray-500 my-12">Course not found</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Course</h1>
        <p className="text-gray-500 mt-1">Update course information</p>
      </div>
      
      <CourseForm
        initialData={{
          _id: course._id,
          name: course.name,
          description: course.description || '',
          major: course.major,
          yearLevel: course.yearLevel,
          semester: course.semester,
        }}
        mode="edit"
      />
    </div>
  );
}
