// src/app/admin/videos/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { videoApi } from '@/lib/api/videos';
import { Video } from '@/types/video';
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
import { Edit, Trash2, Plus, Search, Play, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function VideosPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVideos = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await videoApi.getAll(token);
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      if (response.data) {
        setVideos(response.data);
        setFilteredVideos(response.data);
      }
    } catch (err) {
      setError('Failed to fetch videos');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [token]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = videos.filter(
        (video) =>
          video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (typeof video.course === 'object' && video.course.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredVideos(filtered);
    } else {
      setFilteredVideos(videos);
    }
  }, [searchTerm, videos]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        const response = await videoApi.delete(id, token!);
        
        if (response.error) {
          alert(`Error: ${response.error}`);
          return;
        }
        
        // Refresh the videos list
        fetchVideos();
      } catch (err) {
        console.error('Failed to delete video:', err);
        alert('Failed to delete the video');
      }
    }
  };

  // Format the duration in seconds to mm:ss
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Unknown';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Videos</h1>
          <p className="text-gray-500 mt-1">Manage all course videos</p>
        </div>
        <Button onClick={() => router.push('/admin/videos/create')}>
          <Plus className="mr-2 h-4 w-4" /> Add Video
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <CardTitle>All Videos</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search videos..."
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
          ) : filteredVideos.length === 0 ? (
            <div className="text-center text-gray-500 my-12">
              {searchTerm ? 'No videos match your search' : 'No videos found'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideos.map((video) => (
                  <TableRow key={video._id}>
                    <TableCell className="font-medium">{video.title}</TableCell>
                    <TableCell>
                      {typeof video.course === 'object' 
                        ? video.course.name 
                        : 'Unknown Course'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-500" />
                        {formatDuration(video.duration)}
                      </div>
                    </TableCell>
                    <TableCell>{video.order || '-'}</TableCell>
                    <TableCell>{format(new Date(video.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/${video.filePath}`, '_blank')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => handleDelete(video._id)}
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