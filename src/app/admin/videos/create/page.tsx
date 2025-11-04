'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { videoApi } from '@/lib/api/videos';
import { courseApi } from '@/lib/api/courses';
import { Course } from '@/types/course';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Upload, Clock, SortDesc, PlayCircle, PauseCircle, RotateCcw, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface UploadProgress {
  progress: number;
  uploadedChunks: number;
  totalChunks: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
  isUploading: boolean;
  isPaused: boolean;
  sessionId?: string;
  canResume: boolean;
}

interface SavedUploadSession {
  sessionId: string;
  fileName: string;
  fileSize: number;
  metadata: any;
  timestamp: number;
}

export default function CreateVideoPage() {
  const router = useRouter();
  const { token } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    duration: undefined as number | undefined,
    file: null as FileList | null,
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  // Resumable uploads disabled for this controller; hide any resume UI
  const [savedSessions, setSavedSessions] = useState<SavedUploadSession[]>([]);
  const [showSavedSessions, setShowSavedSessions] = useState(false);

  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    uploadedChunks: 0,
    totalChunks: 0,
    speed: 0,
    timeRemaining: 0,
    isUploading: false,
    isPaused: false,
    canResume: false,
  });

  useEffect(() => {
    const fetchCourses = async () => {
      if (!token) return;

      setIsLoading(true);

      try {
        const response = await courseApi.getAll(token);

        if (response.data) {
          setCourses(response.data);
        } else if (response.error) {
          setFormError('Failed to load courses');
        }
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setFormError('Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
    // Disable resumable session loading for this controller
    setSavedSessions([]);
    setShowSavedSessions(false);
  }, [token]);

  // Load saved upload sessions
  const loadSavedSessions = () => {
    // No-op since resumable is disabled
    setSavedSessions([]);
    setShowSavedSessions(false);
  };

  // Clean up object URL when component unmounts or when a new file is selected
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

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
      const file = e.target.files[0];

      // Validate file size (10GB max)
      const maxSize = 10 * 1024 * 1024 * 1024;
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, file: 'File size must be less than 10GB' }));
        return;
      }

      // Create a temporary URL for the video
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      const newVideoUrl = URL.createObjectURL(file);
      setVideoUrl(newVideoUrl);

      setFormData((prev) => ({ ...prev, file: e.target.files }));
      setErrors((prev) => ({ ...prev, file: '' }));

      // Reset upload progress when new file is selected
      setUploadProgress({
        progress: 0,
        uploadedChunks: 0,
        totalChunks: 0,
        speed: 0,
        timeRemaining: 0,
        isUploading: false,
        isPaused: false,
        canResume: false,
      });
    }
  };

  // Handle metadata loaded event for the video element
  const handleVideoMetadataLoaded = () => {
    if (videoRef.current) {
      const durationInSeconds = Math.round(videoRef.current.duration);
      setFormData(prev => ({ ...prev, duration: durationInSeconds }));
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

    if (!formData.file) {
      newErrors.file = 'Video file is required';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds <= 0) return '--:--';

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token) {
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(prev => ({
      ...prev,
      isUploading: true,
      isPaused: false,
      progress: 0,
      uploadedChunks: 0,
      speed: 0,
      timeRemaining: 0
    }));

    try {
      const file = formData.file![0];

      // Force simple single-request multipart upload (no chunks)
      const response = await videoApi.create(formData, token, {
        useResumable: false,
        onProgress: (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            progress,
          }));
        },
      });

      if (response.error) {
        setFormError(response.error);
        setUploadProgress(prev => ({ ...prev, isUploading: false }));
        return;
      }

      // Success - redirect to videos page
      router.push('/admin/videos');
    } catch (error) {
      setFormError('An error occurred. Please try again.');
      console.error('Form submission error:', error);
      setUploadProgress(prev => ({ ...prev, isUploading: false }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelUpload = async () => {
    try {
      if (uploadProgress.sessionId && token) {
        await videoApi.cancelUpload(uploadProgress.sessionId, token);
      }

      setUploadProgress({
        progress: 0,
        uploadedChunks: 0,
        totalChunks: 0,
        speed: 0,
        timeRemaining: 0,
        isUploading: false,
        isPaused: false,
        canResume: false,
      });
      setIsSubmitting(false);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFormData(prev => ({ ...prev, file: null }));
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
    } catch (error) {
      console.error('Failed to cancel upload:', error);
    }
  };

  const handleResumeUpload = async (_session: SavedUploadSession) => {
    // Resuming is disabled
    setFormError('Resuming uploads is not supported. Please upload the file again.');
  };

  const handleDeleteSavedSession = async (sessionId: string) => {
    try {
      if (token) {
        await videoApi.cancelUpload(sessionId, token);
      }
      loadSavedSessions();
    } catch (error) {
      console.error('Failed to delete saved session:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center my-12">
        <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/videos')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold">Upload New Video</h1>
      </div>

      {/* Saved Upload Sessions */}
      {false && showSavedSessions && savedSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Resume Previous Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedSessions.map((session) => (
                <div key={session.sessionId} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <p className="font-medium">{session.fileName}</p>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(session.fileSize)} • {new Date(session.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleResumeUpload(session)}
                      disabled={isSubmitting}
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSavedSession(session.sessionId)}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Video Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formError && (
              <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Video Title
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                placeholder="Enter video title"
                disabled={isSubmitting}
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
                placeholder="Enter video description"
                disabled={isSubmitting}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] disabled:opacity-50"
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
                disabled={isSubmitting}
                options={courses.map(course => ({
                  value: course._id,
                  label: `${course.name} - Year ${course.yearLevel}, Semester ${course.semester}`
                }))}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="file" className="text-sm font-medium">
                Video File
              </label>
              <Input
                ref={fileInputRef}
                id="file"
                name="file"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                error={errors.file}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Supported video formats: MP4, WebM, MOV, AVI (Max: 10GB)
                {formData.file && formData.file[0].size > 50 * 1024 * 1024 && (
                  <span className="block text-blue-600 mt-1">
                    ✓ Large file detected - resumable upload will be used
                  </span>
                )}
              </p>
            </div>

            {videoUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Video Duration: {formData.duration ? `${Math.floor(formData.duration / 60)}:${String(formData.duration % 60).padStart(2, '0')}` : 'Loading...'}
                </p>
                {/* Hidden video element to extract metadata */}
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="hidden"
                  onLoadedMetadata={handleVideoMetadataLoaded}
                  preload="metadata"
                />
              </div>
            )}


          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {isSubmitting && (
              <div className="w-full space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Upload Progress</span>
                  <span>{uploadProgress.progress.toFixed(1)}%</span>
                </div>
                <Progress value={uploadProgress.progress} className="w-full" />

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Chunks:</span> {uploadProgress.uploadedChunks}/{uploadProgress.totalChunks}
                  </div>
                  <div>
                    <span className="font-medium">Speed:</span> {formatSpeed(uploadProgress.speed)}
                  </div>
                  <div>
                    <span className="font-medium">Time remaining:</span> {formatTime(uploadProgress.timeRemaining)}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {uploadProgress.canResume ? 'Resumable' : 'Standard'}
                  </div>
                </div>

                {uploadProgress.canResume && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    This upload can be resumed if interrupted
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/videos')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <div className="flex gap-2">
                {isSubmitting && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleCancelUpload}
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel Upload
                  </Button>
                )}

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-t-white border-white/30 rounded-full animate-spin"></div>
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" /> Upload Video
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}