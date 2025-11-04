'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { courseApi } from '@/lib/api/courses';
import { codesApi } from '@/lib/api/codes';
import { Course } from '@/types/course';
import { Code } from '@/types/code';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ArrowLeft, Plus, Copy, Check, Download, RefreshCw } from 'lucide-react';
import { generateCodesPDF } from '@/lib/utils/pdf-generator';

export default function CourseCodesPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const { token } = useAuth();
    const [course, setCourse] = useState<Course | null>(null);
    const [activeCodes, setActiveCodes] = useState<Code[]>([]);
    const [usedCodes, setUsedCodes] = useState<Code[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [codeCount, setCodeCount] = useState(100);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!token || !courseId) return;

            setIsLoading(true);
            setError('');

            try {
                const [courseResponse, activeResponse, usedResponse] = await Promise.all([
                    courseApi.getById(courseId, token),
                    codesApi.getActiveCodes(courseId, token),
                    codesApi.getUsedCodes(courseId, token),
                ]);

                if (courseResponse.error) {
                    setError(courseResponse.error);
                    return;
                }

                if (courseResponse.data) {
                    setCourse(courseResponse.data);
                }

                if (activeResponse.data) {
                    setActiveCodes(activeResponse.data);
                } else if (activeResponse.error) {
                    // If it's a permission error, show it
                    if (activeResponse.error.includes('unauthorized') || activeResponse.error.includes('forbidden')) {
                        setError('You do not have permission to view codes for this course. Only course owners can access this page.');
                    }
                }

                if (usedResponse.data) {
                    setUsedCodes(usedResponse.data);
                }
            } catch (err) {
                setError('Failed to fetch data');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [courseId, token]);

    const handleGenerateCodes = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !courseId) return;

        setIsGenerating(true);
        setError('');

        try {
            const response = await codesApi.generateForCourse(
                courseId,
                { count: codeCount },
                token
            );

            if (response.error) {
                setError(response.error);
                return;
            }

            if (response.data) {
                // Refresh the active codes list
                const activeResponse = await codesApi.getActiveCodes(courseId, token);
                if (activeResponse.data) {
                    setActiveCodes(activeResponse.data);
                }
                // Reset form
                setCodeCount(100);
            }
        } catch (err) {
            setError('Failed to generate codes');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleCopyAllCodes = (codes: Code[]) => {
        const codesText = codes.map(c => c.code).join('\n');
        navigator.clipboard.writeText(codesText);
        setCopiedCode('all');
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleDownloadCodes = async (codes: Code[], filename: string, codeType: 'active' | 'used' = 'active') => {
        if (!course || codes.length === 0) return;

        setIsGeneratingPDF(true);
        setError('');

        try {
            const title = codeType === 'active' ? 'Active Codes' : 'Used Codes';
            const courseName = course.name;

            await generateCodesPDF({
                title,
                courseName,
                codes: codes.map(code => ({
                    code: code.code,
                    createdAt: code.createdAt,
                    usedBy: code.usedBy,
                    usedAt: code.usedAt ? (typeof code.usedAt === 'string' ? code.usedAt : code.usedAt.toISOString()) : null,
                })),
                showQRCode: true,
                codesPerPage: 6,
            });
        } catch (err) {
            setError('Failed to generate PDF. Please try again.');
            console.error('PDF generation error:', err);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const refreshData = async () => {
        if (!token || !courseId) return;

        setIsLoading(true);
        try {
            const [activeResponse, usedResponse] = await Promise.all([
                codesApi.getActiveCodes(courseId, token),
                codesApi.getUsedCodes(courseId, token),
            ]);

            if (activeResponse.data) {
                setActiveCodes(activeResponse.data);
            }
            if (usedResponse.data) {
                setUsedCodes(usedResponse.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center my-12">
                <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error && !course) {
        return (
            <div className="space-y-4">
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <div className="text-center text-red-500 my-12">{error}</div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="space-y-4">
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <div className="text-center text-gray-500 my-12">Course not found</div>
            </div>
        );
    }

    const totalCodes = activeCodes.length + usedCodes.length;
    const remainingCount = activeCodes.length;
    const usedCount = usedCodes.length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{course.name}</h1>
                        <p className="text-sm text-gray-500">Course Codes Management</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-500">Total Codes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{totalCodes}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-500">Active Codes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-600">{remainingCount}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-500">Used Codes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-gray-600">{usedCount}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Generate Codes Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" /> Generate New Codes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleGenerateCodes} className="space-y-4">
                        <div>
                            <label htmlFor="codeCount" className="block text-sm font-medium text-gray-700 mb-2">
                                Number of Codes to Generate
                            </label>
                            <Input
                                id="codeCount"
                                type="number"
                                min="1"
                                max="1000"
                                value={codeCount}
                                onChange={(e) => setCodeCount(parseInt(e.target.value) || 100)}
                                placeholder="Enter number of codes"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Default is 100. Maximum recommended is 1000.
                            </p>
                        </div>
                        <Button type="submit" disabled={isGenerating}>
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Generate Codes
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Active Codes Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            Active Codes ({remainingCount})
                        </CardTitle>
                        {activeCodes.length > 0 && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopyAllCodes(activeCodes)}
                                >
                                    {copiedCode === 'all' ? (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copy All
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadCodes(activeCodes, `${course.name}-active-codes.pdf`, 'active')}
                                    disabled={isGeneratingPDF}
                                >
                                    {isGeneratingPDF ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Generating PDF...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download PDF
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {activeCodes.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No active codes available</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeCodes.map((code) => (
                                        <TableRow key={code._id}>
                                            <TableCell className="font-mono text-sm">{code.code}</TableCell>
                                            <TableCell>
                                                {new Date(code.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCopyCode(code.code)}
                                                >
                                                    {copiedCode === code.code ? (
                                                        <>
                                                            <Check className="h-4 w-4 mr-1" />
                                                            Copied
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="h-4 w-4 mr-1" />
                                                            Copy
                                                        </>
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Used Codes Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            Used Codes ({usedCount})
                        </CardTitle>
                        {usedCodes.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadCodes(usedCodes, `${course.name}-used-codes.pdf`, 'used')}
                                disabled={isGeneratingPDF}
                            >
                                {isGeneratingPDF ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Generating PDF...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download PDF
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {usedCodes.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No used codes yet</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Used By</TableHead>
                                        <TableHead>Used At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usedCodes.map((code) => (
                                        <TableRow key={code._id}>
                                            <TableCell className="font-mono text-sm">{code.code}</TableCell>
                                            <TableCell>
                                                {code.usedBy && typeof code.usedBy === 'object'
                                                    ? `${code.usedBy.fullName} (${code.usedBy.universityId})`
                                                    : 'Unknown'}
                                            </TableCell>
                                            <TableCell>
                                                {code.usedAt
                                                    ? new Date(code.usedAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

