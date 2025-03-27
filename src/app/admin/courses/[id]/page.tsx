'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { courseApi } from '@/lib/api/courses';
import { enrollmentApi } from '@/lib/api/enrollments';
import { Course } from '@/types/course';
import { Enrollment } from '@/types/enrollment';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ArrowLeft, Edit, Video, FileText, Users } from 'lucide-react';

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { token } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!token || !courseId) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        const [courseResponse, enrollmentsResponse] = await Promise.all([
          courseApi.getById(courseId, token),
          enrollmentApi.getByCourse(courseId, token),
        ]);
        
        if (courseResponse.error) {
          setError(courseResponse.error);
          return;
        }
        
        if (courseResponse.data) {
          setCourse(courseResponse.data);
        }
        
        if (enrollmentsResponse.data) {
          setEnrollments(enrollmentsResponse.data);
        }
      } catch (err) {
        setError('Failed to fetch course details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, token]);

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

  // Helper function to render semester
  const getSemesterLabel = (semester: number) => {
    return semester === 1 ? 'First Semester' : 'Second Semester';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold">{course.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Major</p>
                <p>{course.major}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Year Level</p>
                <p>Year {course.yearLevel}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Semester</p>
                <p>{getSemesterLabel(course.semester)}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Description</p>
              <p className="mt-1">{course.description || 'No description provided.'}</p>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push(`/admin/courses/${course._id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" /> Edit Course
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push(`/admin/courses/${course._id}/videos`)}
              >
                <Video className="h-4 w-4 mr-2" /> Manage Videos
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push(`/admin/courses/${course._id}/files`)}
              >
                <FileText className="h-4 w-4 mr-2" /> Manage Files
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Enrolled Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No students enrolled</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment._id}>
                      <TableCell>
                        {typeof enrollment.student === 'object' 
                          ? enrollment.student.fullName 
                          : 'Unknown Student'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${enrollment.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {enrollment.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => router.push('/admin/enrollments/create')}
            >
              <Users className="h-4 w-4 mr-2" /> Manage Enrollments
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}