import { fetchWithTokenRefresh } from '../utils/tokenRefresh';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface CreateGroupResponse {
  groupId: string;
  name: string;
  description?: string;
  createdBy: string;
  members: Array<{
    userId: string;
    username?: string;
    displayName?: string;
    email?: string;
  }>;
  createdAt: string;
}

const handleResponse = async <T>(response: Response, defaultError: string): Promise<T> => {
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    const errorMessage = data?.error || defaultError;
    throw new Error(errorMessage);
  }
  return data.data as T;
};

export const groupService = {
  async createGroup(name: string, description: string, displayName: string, accessToken: string) {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ name, description, displayName })
    });

    return handleResponse<CreateGroupResponse>(response, 'create_group_failed');
  },

  async getGroups(accessToken: string) {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/groups`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return handleResponse<
      Array<{
        groupId: string;
        name: string;
        description?: string;
        memberCount: number;
        totalExpenses: number;
        yourBalance: number;
        lastActivity: string;
      }>
    >(response, 'fetch_groups_failed');
  },

  async getGroupDetails(groupId: string, accessToken: string) {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/groups/${groupId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return handleResponse<{
      groupId: string;
      name: string;
      description?: string;
      createdBy?: string;
      members: Array<{
        userId: string;
        username?: string;
        displayName?: string;
        email?: string;
      }>;
      createdAt: string;
    }>(response, 'fetch_group_details_failed');
  },

  async joinGroup(groupId: string, displayName: string, accessToken: string) {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/groups/${groupId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ displayName })
    });

    return handleResponse<{
      groupId: string;
      name: string;
      description?: string;
      members?: Array<{ userId: string; username?: string; displayName?: string; email?: string }>;
      memberCount?: number;
    }>(response, 'join_group_failed');
  },

  async updateGroup(groupId: string, updates: { name?: string; description?: string }, accessToken: string) {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/groups/${groupId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(updates)
    });
    return handleResponse<void>(response, 'update_group_failed');
  },

  async deleteGroup(groupId: string, accessToken: string) {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/groups/${groupId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return handleResponse<void>(response, 'delete_group_failed');
  },

  async removeMember(groupId: string, userId: string, accessToken: string) {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return handleResponse<void>(response, 'remove_member_failed');
  },

  async updateMyDisplayName(groupId: string, displayName: string, accessToken: string) {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/groups/${groupId}/my-display-name`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ displayName })
    });
    return handleResponse<{ groupId: string; displayName: string }>(response, 'update_display_name_failed');
  }
};