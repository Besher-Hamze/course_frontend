// src/app/admin/files/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { fileApi } from '@/lib/api/files';
import { File } from '@/types/file';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Plus, Search, Download, FileIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function FilesPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFiles = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fileApi.getAll(token);
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      if (response.data) {
        setFiles(response.data);
        setFilteredFiles(response.data);
      }
    } catch (err) {
      setError('Failed to fetch files');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [token]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = files.filter(
        (file) =>
          file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (typeof file.course === 'object' && file.course.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredFiles(filtered);
    } else {
      setFilteredFiles(files);
    }
  }, [searchTerm, files]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        const response = await fileApi.delete(id, token!);
        
        if (response.error) {
          alert(`Error: ${response.error}`);
          return;
        }
        
        // Refresh the files list
        fetchFiles();
      } catch (err) {
        console.error('Failed to delete file:', err);
        alert('Failed to delete the file');
      }
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Files</h1>
          <p className="text-gray-500 mt-1">Manage all educational materials</p>
        </div>
        <Button onClick={() => router.push('/admin/files/create')}>
          <Plus className="mr-2 h-4 w-4" /> Add File
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <CardTitle>All Files</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search files..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center my-12">
              <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 my-12">{error}</div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center text-gray-500 my-12">
              {searchTerm ? 'No files match your search' : 'No files found'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file._id}>
                    <TableCell className="font-medium">{file.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getFileIcon(file.fileType)}
                        <span className="ml-2 uppercase text-xs font-medium">{file.fileType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {typeof file.course === 'object' 
                        ? file.course.name 
                        : 'Unknown Course'}
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
                          onClick={() => router.push(`/admin/files/${file._id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => handleDelete(file._id)}
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