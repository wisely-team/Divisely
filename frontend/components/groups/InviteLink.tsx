import React, { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Card, Button } from '../UIComponents';

interface InviteLinkProps {
  groupId: string;
  isOwner: boolean;
}

export const InviteLink: React.FC<InviteLinkProps> = ({ groupId, isOwner }) => {
  const inviteUrl = useMemo(() => {
    const base = window.location.origin;
    const usesHash = window.location.protocol !== 'blob:';
    const path = `/join/${groupId}`;
    return usesHash ? `${base}/#${path}` : `${base}${path}`;
  }, [groupId]);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Invite Link</h3>
      <p className="text-sm text-gray-500 mb-4">
        Share this link with others to let them join the group.
      </p>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            readOnly
            value={inviteUrl}
            className="w-full pl-4 pr-10 py-3 bg-gray-100 border border-transparent rounded-lg text-gray-600 font-mono text-sm focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-teal-600 rounded-md transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </Card>
  );
};
