'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { StatsCard } from '@/components/dashboard/stats-card';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { Users, BookOpen, UserPlus,FileText } from 'lucide-react';
import { courseApi } from '@/lib/api/courses';
import { studentApi } from '@/lib/api/students';
import { enrollmentApi } from '@/lib/api/enrollments';
import { fileApi } from '@/lib/api/files';
import { videoApi } from '@/lib/api/videos';
import { Course } from '@/types/course';
import { Student } from '@/types/student';
import { Enrollment } from '@/types/enrollment';
import { File } from '@/types/file';
import { Video } from '@/types/video';

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    courses: 0,
    students: 0,
    enrollments: 0,
    files: 0,
    videos: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Mock recent activity data
  const recentActivities = [
    {
      id: '1',
      action: 'Created',
      entity: 'New Course: Introduction to Programming',
      user: 'Admin',
      time: '2 hours ago',
    },
    {
      id: '2',
      action: 'Enrolled',
      entity: 'Student: Ahmed Mohamed in Data Structures',
      user: 'Admin',
      time: '3 hours ago',
    },
    {
      id: '3',
      action: 'Uploaded',
      entity: 'Video: Lecture 5 for Database Systems',
      user: 'Admin',
      time: '5 hours ago',
    },
    {
      id: '4',
      action: 'Added',
      entity: 'File: Project Guidelines for Software Engineering',
      user: 'Admin',
      time: 'Yesterday',
    },
    {
      id: '5',
      action: 'Registered',
      entity: 'New Student: Sara Ahmed',
      user: 'Admin',
      time: 'Yesterday',
    },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      
      setIsLoading(true);
      
      try {
        const [
          coursesResponse,
          studentsResponse,
          enrollmentsResponse,
          filesResponse,
          videosResponse,
        ] = await Promise.all([
          courseApi.getAll(token),
          studentApi.getAll(token),
          enrollmentApi.getAll(token),
          fileApi.getAll(token),
          videoApi.getAll(token),
        ]);

        setStats({
          courses: (coursesResponse.data as Course[] || []).length,
          students: (studentsResponse.data as Student[] || []).length,
          enrollments: (enrollmentsResponse.data as Enrollment[] || []).length,
          files: (filesResponse.data as File[] || []).length,
          videos: (videosResponse.data as Video[] || []).length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to your admin dashboard</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Courses"
              value={stats.courses}
              icon={<BookOpen size={24} className="text-blue-600" />}
            />
            <StatsCard
              title="Total Students"
              value={stats.students}
              icon={<Users size={24} className="text-green-600" />}
            />
            <StatsCard
              title="Active Enrollments"
              value={stats.enrollments}
              icon={<UserPlus size={24} className="text-purple-600" />}
            />
            <StatsCard
              title="Course Materials"
              value={stats.files + stats.videos}
              description={`${stats.files} Files, ${stats.videos} Videos`}
              icon={<FileText size={24} className="text-orange-600" />}
            />
          </div>

          <div className="mt-8">
            <RecentActivity activities={recentActivities} />
          </div>
        </>
      )}
    </div>
  );
}
