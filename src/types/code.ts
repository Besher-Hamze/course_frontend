export interface Code {
    _id: string;
    code: string;
    course: string | {
        _id: string;
        name: string;
    };
    usedBy: string | {
        _id: string;
        fullName: string;
        universityId: string;
    } | null;
    usedAt: Date | string | null;
    createdAt: string;
    updatedAt: string;
}

export interface GenerateCodesRequest {
    count?: number;
}

export interface GenerateCodesResponse {
    codes: string[];
    count: number;
}

