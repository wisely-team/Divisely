import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card } from '../components/UIComponents';
import { useApp } from '../context/AppContext';

export const JoinGroupPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { currentUser, joinGroup } = useApp();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState<string>('Joining group...');

  useEffect(() => {
    const runJoin = async () => {
      if (!groupId) {
        setStatus('error');
        setMessage('Invalid invite link.');
        return;
      }
      if (!currentUser) {
        navigate('/login');
        return;
      }
      try {
        await joinGroup(groupId);
        setStatus('success');
        setMessage('You have joined the group.');
        setTimeout(() => navigate(`/group/${groupId}`), 100);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not join group.';
        setStatus('error');
        setMessage(msg);
      }
    };
    runJoin();
  }, [groupId, currentUser, joinGroup, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Card className="p-8 max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Joining Group</h1>
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>{message}</p>
        {status !== 'pending' && (
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/dashboard')} variant="secondary">
              Go to Dashboard
            </Button>
            {groupId && (
              <Button onClick={() => navigate(`/group/${groupId}`)} className="bg-teal-600 hover:bg-teal-700 text-white">
                Open Group
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
