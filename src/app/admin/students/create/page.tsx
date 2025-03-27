'use client';

import React from 'react';
import { StudentForm } from '@/components/forms/student-form';

export default function CreateStudentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Student</h1>
        <p className="text-gray-500 mt-1">Add a new student to the platform</p>
      </div>
      
      <StudentForm mode="create" />
    </div>
  );
}

