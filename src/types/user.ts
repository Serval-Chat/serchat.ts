export interface ClientUser {
    id: string;
    username: string;
    displayName: string | null;
    profilePicture: string | null;
    status?: string;
}
