// src/app/admin/files/[id]/edit/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { fileApi } from '@/lib/api/files';
import { courseApi } from '@/lib/api/courses';
import { File } from '@/types/file';
import { Course } from '@/types/course';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Save, FileIcon } from 'lucide-react';

export default function EditFilePage() {
  const params = useParams();
  const router = useRouter();
  const fileId = params.id as string;
  const { token } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    file: null as FileList | null,
  });
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !fileId) return;
      
      setIsLoading(true);
      
      try {
        const [fileResponse, coursesResponse] = await Promise.all([
          fileApi.getById(fileId, token),
          courseApi.getAll(token),
        ]);
        
        if (fileResponse.error) {
          setFormError(fileResponse.error);
          return;
        }
        
        if (fileResponse.data) {
          const fileData = fileResponse.data;
          setFile(fileData);
          setFormData({
            title: fileData.title,
            description: fileData.description || '',
            course: typeof fileData.course === 'object' ? fileData.course._id : fileData.course,
            file: null,
          });
        }
        
        if (coursesResponse.data) {
          setCourses(coursesResponse.data);
        }
      } catch (err) {
        setFormError('Failed to fetch file details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [fileId, token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !token || !fileId) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fileApi.update(fileId, formData, token);
      
      if (response.error) {
        setFormError(response.error);
        return;
      }
      
      // Redirect to files page after successful update
      router.push('/admin/files');
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

  if (!file) {
    return (
      <div className="text-center text-red-500 my-12">
        {formError || 'File not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/files')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold">Edit File</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileIcon className="h-5 w-5" /> 
              {file.title} <span className="text-sm font-normal text-gray-500 ml-2">({file.fileType.toUpperCase()})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formError && (
              <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
                {formError}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                File Title
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                placeholder="Enter file title"
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
                placeholder="Enter file description"
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
            
            <div className="space-y-2">
              <label htmlFor="file" className="text-sm font-medium">
                Replace File (Optional)
              </label>
              <Input
                id="file"
                name="file"
                type="file"
                onChange={handleFileChange}
                error={errors.file}
              />
              <p className="text-xs text-gray-500">
                Leave empty to keep the current file. Supported file types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG
              </p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium">Current File</p>
              <p className="text-sm mt-1">
                <a 
                  href={`${process.env.NEXT_PUBLIC_API_URL}/${file.filePath}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center"
                >
                  <FileIcon className="h-4 w-4 mr-1" /> {file.title}.{file.fileType}
                </a>
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/files')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-t-white border-white/30 rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}