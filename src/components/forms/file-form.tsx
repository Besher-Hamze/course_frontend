'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fileApi } from '@/lib/api/files';
import { File, CreateFileDto } from '@/types/file';

interface FileFormProps {
  courseId: string;
  initialData?: File | null;
  onSave: () => void;
  onCancel: () => void;
}

export function FileForm({ courseId, initialData, onSave, onCancel }: FileFormProps) {
  const { token } = useAuth();
  const [formData, setFormData] = useState<CreateFileDto>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    course: courseId,
    file: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
    
    // File is required for new files
    if (!initialData && !formData.file) {
      newErrors.file = 'File is required';
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
      
      if (initialData) {
        response = await fileApi.update(initialData._id, formData, token);
      } else {
        response = await fileApi.create(formData, token);
      }
      
      if (response?.error) {
        setFormError(response.error);
        return;
      }
      
      onSave();
    } catch (error) {
      setFormError('An error occurred. Please try again.');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <label htmlFor="file" className="text-sm font-medium">
          {initialData ? 'Replace File (Optional)' : 'File'}
        </label>
        <Input
          id="file"
          name="file"
          type="file"
          onChange={handleFileChange}
          error={errors.file}
        />
        {initialData && (
          <p className="text-xs text-gray-500">
            Leave empty to keep the existing file.
          </p>
        )}
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-t-white border-white/30 rounded-full animate-spin"></div>
              <span>{initialData ? 'Updating...' : 'Uploading...'}</span>
            </div>
          ) : (
            initialData ? 'Update File' : 'Upload File'
          )}
        </Button>
      </div>
    </form>
  );
}
