
export enum Role {
    Owner = 'owner',
    Teacher = 'teacher',
    Student = 'student',
}

// Teacher login DTO
export interface TeacherLoginDto {
    username: string;
    password: string;
}

// Student login DTO
export interface StudentLoginDto {
    universityId: string;
    password: string;
    deviceNumber: string;
}

export interface TokenResponse {
    accessToken: string;
}

export interface TeacherAuthResponse extends TokenResponse {
    teacher: {
        _id: string;
        username: string;
        fullName: string;
        isActive: boolean;
        isOwner: boolean;
        role: Role; // 'owner' when isOwner=true else 'teacher'
        createdAt: string;
        updatedAt: string;
    };
}

export interface StudentAuthResponse extends TokenResponse {
    student: {
        _id: string;
        universityId: string;
        fullName: string;
        yearLevel: number;
        semester: number;
        createdAt: string;
        updatedAt: string;
    };
}
