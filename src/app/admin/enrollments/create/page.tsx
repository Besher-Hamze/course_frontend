'use client';

import React from 'react';
import { EnrollmentForm } from '@/components/forms/enrollment-form';

export default function CreateEnrollmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Enrollment</h1>
        <p className="text-gray-500 mt-1">Enroll a student in a course</p>
      </div>
      
      <EnrollmentForm />
    </div>
  );
}
