export interface Teacher {
    _id: string;
    username: string;
    fullName: string;
    isActive: boolean;
    isOwner: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTeacherDto {
    username: string;
    fullName: string;
    password: string;
}

