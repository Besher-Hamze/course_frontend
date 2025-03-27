'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { studentApi } from '@/lib/api/students';
import { CreateStudentDto, UpdateStudentDto } from '@/types/student';

interface StudentFormProps {
  initialData?: {
    _id: string;
    universityId: string;
    fullName: string;
  };  
  mode: 'create' | 'edit';
}

export function StudentForm({ initialData, mode }: StudentFormProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [formData, setFormData] = useState<CreateStudentDto | UpdateStudentDto>(
    initialData || {
      universityId: '',
      fullName: '',
      password: '',
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
    
    if (!formData.universityId) {
      newErrors.universityId = 'University ID is required';
    }
    
    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (mode === 'create' && !formData.password) {
      newErrors.password = 'Password is required';
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
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let response;
      
      if (mode === 'create') {
        response = await studentApi.create(formData as CreateStudentDto);
      } else if (initialData?._id && token) {
        response = await studentApi.update(initialData._id, formData, token);
      }
      
      if (response?.error) {
        setFormError(response.error);
        return;
      }
      
      // Redirect to students page after successful submission
      router.push('/admin/students');
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
        <CardTitle>{mode === 'create' ? 'Create Student' : 'Edit Student'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {formError && (
            <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
              {formError}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="universityId" className="text-sm font-medium">
              University ID
            </label>
            <Input
              id="universityId"
              name="universityId"
              value={formData.universityId}
              onChange={handleChange}
              error={errors.universityId}
              placeholder="Enter university ID"
              disabled={mode === 'edit'} // Cannot change University ID when editing
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              placeholder="Enter full name"
            />
          </div>
          
          {mode === 'create' && (
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                value={(formData as CreateStudentDto).password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Enter password"
              />
            </div>
          )}
          
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
            onClick={() => router.push('/admin/students')}
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
              mode === 'create' ? 'Create Student' : 'Update Student'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

