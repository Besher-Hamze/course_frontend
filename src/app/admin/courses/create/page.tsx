'use client';

import React from 'react';
import { CourseForm } from '@/components/forms/course-form';

export default function CreateCoursePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Course</h1>
        <p className="text-gray-500 mt-1">Add a new course to the platform</p>
      </div>
      
      <CourseForm mode="create" />
    </div>
  );
}
