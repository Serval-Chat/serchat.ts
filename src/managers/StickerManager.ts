import type { RESTClient } from '@/client/RESTClient.js';

export interface ISticker {
    id: string;
    name: string;
    imageUrl: string;
    serverId: string;
    createdBy: string;
    createdAt?: string;
}

export class StickerManager {
    private rest: RESTClient;

    constructor(rest: RESTClient) {
        this.rest = rest;
    }

    /**
     * Gets all globally accessible stickers for the authenticated user.
     */
    public async getStickers(): Promise<ISticker[]> {
        const response = await this.rest.get<ISticker[]>('/stickers');
        return response.data;
    }

    /**
     * Gets all stickers for a specific server.
     */
    public async getServerStickers(serverId: string): Promise<ISticker[]> {
        const response = await this.rest.get<ISticker[]>(`/servers/${serverId}/stickers`);
        return response.data;
    }

    /**
     * Creates a new sticker in a server.
     */
    public async createSticker(serverId: string, formData: FormData): Promise<ISticker> {
        const response = await this.rest.post<ISticker>(`/servers/${serverId}/stickers`, formData);
        return response.data;
    }

    /**
     * Deletes a sticker from a server.
     */
    public async deleteSticker(serverId: string, stickerId: string): Promise<void> {
        await this.rest.delete(`/servers/${serverId}/stickers/${stickerId}`);
    }
}
