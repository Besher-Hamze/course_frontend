'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { courseApi } from '@/lib/api/courses';
import { videoApi } from '@/lib/api/videos';
import { Course } from '@/types/course';
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
import { ArrowLeft, Plus, Trash2, Edit, Play, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { VideoForm } from '@/components/forms/video-form';

export default function CourseVideosPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { token } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  const fetchData = async () => {
    if (!token || !courseId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const [courseResponse, videosResponse] = await Promise.all([
        courseApi.getById(courseId, token),
        videoApi.getByCourse(courseId, token),
      ]);
      
      if (courseResponse.error) {
        setError(courseResponse.error);
        return;
      }
      
      if (courseResponse.data) {
        setCourse(courseResponse.data);
      }
      
      if (videosResponse.data) {
        setVideos(videosResponse.data);
      }
    } catch (err) {
      setError('Failed to fetch course videos');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId, token]);

  const handleDeleteVideo = async (videoId: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        const response = await videoApi.delete(videoId, token!);
        
        if (response.error) {
          alert(`Error: ${response.error}`);
          return;
        }
        
        // Refresh the videos list
        fetchData();
      } catch (err) {
        console.error('Failed to delete video:', err);
        alert('Failed to delete the video');
      }
    }
  };

  const handleEditVideo = (video: Video) => {
    setEditingVideo(video);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingVideo(null);
  };

  const handleVideoSaved = () => {
    handleCloseForm();
    fetchData();
  };

  // Format the duration in seconds to mm:ss
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Unknown';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <h1 className="text-2xl font-bold">Videos for {course.name}</h1>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Video
        </Button>
      </div>

      {isFormOpen && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingVideo ? 'Edit Video' : 'Add New Video'}</CardTitle>
          </CardHeader>
          <CardContent>
            <VideoForm 
              courseId={courseId} 
              initialData={editingVideo} 
              onSave={handleVideoSaved} 
              onCancel={handleCloseForm} 
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Videos</CardTitle>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <div className="text-center text-gray-500 my-12">
              No videos available for this course
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => (
                  <TableRow key={video._id}>
                    <TableCell>{video.order || '-'}</TableCell>
                    <TableCell className="font-medium">{video.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-500" />
                        {formatDuration(video.duration)}
                      </div>
                    </TableCell>
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
                          onClick={() => handleEditVideo(video)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => handleDeleteVideo(video._id)}
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
