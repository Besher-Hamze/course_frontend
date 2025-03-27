'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { studentApi } from '@/lib/api/students';
import { Student } from '@/types/student';
import { StudentForm } from '@/components/forms/student-form';

export default function EditStudentPage() {
  const params = useParams();
  const studentId = params.id as string;
  const { token } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudent = async () => {
      if (!token || !studentId) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        const response = await studentApi.getById(studentId, token);
        
        if (response.error) {
          setError(response.error);
          return;
        }
        
        if (response.data) {
          setStudent(response.data);
        }
      } catch (err) {
        setError('Failed to fetch student details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [studentId, token]);

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

  if (!student) {
    return (
      <div className="text-center text-gray-500 my-12">Student not found</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Student</h1>
        <p className="text-gray-500 mt-1">Update student information</p>
      </div>
      
      <StudentForm
        initialData={{
          _id: student._id,
          universityId: student.universityId,
          fullName: student.fullName,
        }}
        mode="edit"
      />
    </div>
  );
}