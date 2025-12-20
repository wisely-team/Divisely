import { fetchWithTokenRefresh } from '../utils/tokenRefresh';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface Activity {
    id: string;
    type: 'expense' | 'payment' | 'group_created' | 'member_added';
    description: string;
    amount?: number;
    groupId: string;
    groupName: string;
    userId: string;
    userName: string;
    userAvatar: string;
    timestamp: string;
}

export interface ActivitiesResponse {
    activities: Activity[];
    pagination: {
        page: number;
        limit: number;
        hasMore: boolean;
        total: number;
    };
}

const handleResponse = async <T>(response: Response, defaultError: string): Promise<T> => {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
        const errorMessage = data?.error || defaultError;
        throw new Error(errorMessage);
    }
    return data.data as T;
};

export const activityService = {
    async getRecentActivities(
        accessToken: string,
        page: number = 1,
        limit: number = 20,
        filter?: 'all' | 'expense' | 'payment' | 'group'
    ): Promise<ActivitiesResponse> {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', limit.toString());
        if (filter && filter !== 'all') {
            params.set('filter', filter);
        }

        const response = await fetchWithTokenRefresh(
            `${API_BASE_URL}/activities?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        return handleResponse<ActivitiesResponse>(response, 'fetch_activities_failed');
    }
};
