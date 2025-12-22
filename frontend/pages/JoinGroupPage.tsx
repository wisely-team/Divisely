import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Input } from '../components/UIComponents';
import { useApp } from '../context/AppContext';

export const JoinGroupPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { currentUser, joinGroup } = useApp();
  const [status, setStatus] = useState<'loading' | 'pending' | 'input' | 'joining' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Checking authentication...');
  const [displayName, setDisplayName] = useState<string>('');
  const hasCheckedRef = React.useRef(false);

  const getStoredUser = () => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { username?: string; name?: string };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (hasCheckedRef.current) return;

      if (!groupId) {
        setStatus('error');
        setMessage('Invalid invite link.');
        return;
      }

      // Wait for AppContext to potentially load user from localStorage
      // Check multiple times over 500ms to handle slow renders in production
      let attempts = 0;
      while (attempts < 5) {
        const token = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) break;
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        // Not authenticated - store redirect and go to login
        console.log('[JoinGroup] Not authenticated, setting redirect:', `/join/${groupId}`);
        localStorage.setItem('redirectAfterLogin', `/join/${groupId}`);
        // Small delay to ensure localStorage is written
        setTimeout(() => navigate('/login'), 10);
        return;
      }

      // On a fresh tab load, AppContext may not have hydrated currentUser yet.
      // If we already have a token, use localStorage as a fallback instead of bouncing to /login.
      const effectiveUser = currentUser || getStoredUser();
      if (!effectiveUser) {
        console.log('[JoinGroup] Token exists but no user, setting redirect:', `/join/${groupId}`);
        localStorage.setItem('redirectAfterLogin', `/join/${groupId}`);
        setTimeout(() => navigate('/login'), 10);
        return;
      }

      hasCheckedRef.current = true;
      // Clear the redirect storage since we've arrived at the destination
      console.log('[JoinGroup] Arrived at destination, clearing redirect');
      localStorage.removeItem('redirectAfterLogin');
      // Set default displayName from user data
      setDisplayName(effectiveUser.username || effectiveUser.name || '');
      setStatus('input');
      setMessage('Enter your name for this group');
    };
    checkAuth();
  }, [groupId, currentUser, navigate]);

  const handleJoin = async () => {
    if (!groupId) return;

    setStatus('joining');
    setMessage('Joining group...');

    try {
      await joinGroup(groupId, displayName);
      setStatus('success');
      setMessage('You have joined the group.');
      setTimeout(() => navigate(`/group/${groupId}`), 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not join group.';
      setStatus('error');
      setMessage(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Card className="p-8 max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Join Group</h1>

        {status === 'input' && (
          <div className="space-y-4 text-left">
            <Input
              label="Your Name in This Group"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. John"
            />
            <Button
              onClick={handleJoin}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              disabled={!displayName.trim()}
            >
              Join Group
            </Button>
          </div>
        )}

        {status !== 'input' && (
          <>
            <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>{message}</p>
            {status !== 'joining' && status !== 'loading' && (
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/dashboard')} variant="secondary">
                  Go to Dashboard
                </Button>
                {groupId && status === 'success' && (
                  <Button onClick={() => navigate(`/group/${groupId}`)} className="bg-teal-600 hover:bg-teal-700 text-white">
                    Open Group
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

