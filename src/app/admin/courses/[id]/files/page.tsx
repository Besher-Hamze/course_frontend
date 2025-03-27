'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { courseApi } from '@/lib/api/courses';
import { fileApi } from '@/lib/api/files';
import { Course } from '@/types/course';
import { File } from '@/types/file';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Edit, Download, FileIcon } from 'lucide-react';
import { format } from 'date-fns';
import { FileForm } from '@/components/forms/file-form';

export default function CourseFilesPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { token } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<File | null>(null);

  const fetchData = async () => {
    if (!token || !courseId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const [courseResponse, filesResponse] = await Promise.all([
        courseApi.getById(courseId, token),
        fileApi.getByCourse(courseId, token),
      ]);
      
      if (courseResponse.error) {
        setError(courseResponse.error);
        return;
      }
      
      if (courseResponse.data) {
        setCourse(courseResponse.data);
      }
      
      if (filesResponse.data) {
        setFiles(filesResponse.data);
      }
    } catch (err) {
      setError('Failed to fetch course files');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId, token]);

  const handleDeleteFile = async (fileId: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        const response = await fileApi.delete(fileId, token!);
        
        if (response.error) {
          alert(`Error: ${response.error}`);
          return;
        }
        
        // Refresh the files list
        fetchData();
      } catch (err) {
        console.error('Failed to delete file:', err);
        alert('Failed to delete the file');
      }
    }
  };

  const handleEditFile = (file: File) => {
    setEditingFile(file);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingFile(null);
  };

  const handleFileSaved = () => {
    handleCloseForm();
    fetchData();
  };

  // Helper function to get icon for file type
  const getFileIcon = (fileType: string) => {
    const iconColor = 'text-blue-500';
    
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileIcon className={`h-5 w-5 ${iconColor}`} />;
      case 'doc':
      case 'docx':
        return <FileIcon className={`h-5 w-5 ${iconColor}`} />;
      case 'xls':
      case 'xlsx':
        return <FileIcon className={`h-5 w-5 ${iconColor}`} />;
      case 'ppt':
      case 'pptx':
        return <FileIcon className={`h-5 w-5 ${iconColor}`} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileIcon className={`h-5 w-5 ${iconColor}`} />;
      default:
        return <FileIcon className={`h-5 w-5 ${iconColor}`} />;
    }
  };

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/courses/${courseId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Course
          </Button>
          <h1 className="text-2xl font-bold">Files for {course.name}</h1>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add File
        </Button>
      </div>

      {isFormOpen && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingFile ? 'Edit File' : 'Add New File'}</CardTitle>
          </CardHeader>
          <CardContent>
            <FileForm 
              courseId={courseId} 
              initialData={editingFile} 
              onSave={handleFileSaved} 
              onCancel={handleCloseForm} 
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Files</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center text-gray-500 my-12">
              No files available for this course
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file._id}>
                    <TableCell className="font-medium">{file.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getFileIcon(file.fileType)}
                        <span className="ml-2 uppercase text-xs font-medium">{file.fileType}</span>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(file.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/${file.filePath}`, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditFile(file)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => handleDeleteFile(file._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

