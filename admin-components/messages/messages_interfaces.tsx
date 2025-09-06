export type Thread = {
    id: string;
    adminId: string;
    tenantId: string;
    lastMessage?: string;
    lastMessageAt?: any;
    unreadCountAdmin?: number;
    unreadCountTenant?: number;
    // add tenant display name/email later
};

export type Message = {
    id: string;
    authorId: string;
    body: string;
    createdAt?: any;
};