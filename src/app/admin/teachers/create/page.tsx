'use client';

import React from 'react';
import { TeacherForm } from '@/components/forms/teacher-form';

export default function CreateTeacherPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Create Teacher</h1>
                <p className="text-gray-500 mt-1">Add a new teacher (owner only)</p>
            </div>

            <TeacherForm />
        </div>
    );
}


