// Predefined avatar options using DiceBear API
// These are URL-based avatars that don't require local storage
// Users select an avatar ID, and we generate the URL from it

export type AvatarId =
    | 'avatar-1' | 'avatar-2' | 'avatar-3' | 'avatar-4' | 'avatar-5'
    | 'avatar-6' | 'avatar-7' | 'avatar-8' | 'avatar-9' | 'avatar-10'
    | 'avatar-11' | 'avatar-12';

export interface AvatarOption {
    id: AvatarId;
    url: string;
    label: string;
}

// Using DiceBear's "adventurer" style for friendly, modern avatars
// Each avatar has a unique seed that generates a consistent look
export const AVATAR_OPTIONS: AvatarOption[] = [
    { id: 'avatar-1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=c0aede', label: 'Aneka' },
    { id: 'avatar-2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4', label: 'Felix' },
    { id: 'avatar-3', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo&backgroundColor=d1f4d1', label: 'Milo' },
    { id: 'avatar-4', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=ffd5dc', label: 'Luna' },
    { id: 'avatar-5', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Max&backgroundColor=ffdfbf', label: 'Max' },
    { id: 'avatar-6', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=ffc8dd', label: 'Zoe' },
    { id: 'avatar-7', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sam&backgroundColor=bde0fe', label: 'Sam' },
    { id: 'avatar-8', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Riley&backgroundColor=a2d2ff', label: 'Riley' },
    { id: 'avatar-9', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jordan&backgroundColor=caffbf', label: 'Jordan' },
    { id: 'avatar-10', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=ffc6ff', label: 'Alex' },
    { id: 'avatar-11', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Casey&backgroundColor=fdffb6', label: 'Casey' },
    { id: 'avatar-12', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Morgan&backgroundColor=9bf6ff', label: 'Morgan' },
];

// Helper function to get avatar URL from ID
export function getAvatarUrl(avatarId?: string): string {
    if (!avatarId) return AVATAR_OPTIONS[0].url;
    const avatar = AVATAR_OPTIONS.find(a => a.id === avatarId);
    return avatar?.url || AVATAR_OPTIONS[0].url;
}

// Helper function to get avatar option by ID
export function getAvatarById(avatarId?: string): AvatarOption {
    if (!avatarId) return AVATAR_OPTIONS[0];
    return AVATAR_OPTIONS.find(a => a.id === avatarId) || AVATAR_OPTIONS[0];
}
