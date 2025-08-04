"use client"

import { Button } from '@/components/ui/button';

interface Account {
  provider: string;
  id: string;
  name: string;
  accountId: string;
  status: string;
}

interface ConnectedAccountsProps {
  selectedAccount: Account | null;
  onChangeAccount: () => void;
}

export function ConnectedAccounts({ selectedAccount, onChangeAccount }: ConnectedAccountsProps) {
  if (!selectedAccount) {
    return (
      <div className="flex gap-2 mb-4 text-sm text-gray-500">
        No account selected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center gap-1.5 bg-gray-100/80 px-3 py-1.5 rounded-full text-sm">
        <div
          className={`w-2 h-2 rounded-full ${
            selectedAccount.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        {selectedAccount.status === 'connected' ? selectedAccount.accountId : selectedAccount.provider}
      </div>
      <Button 
        variant="outline" 
        size="sm"
        onClick={onChangeAccount}
        className="text-xs px-2 py-1"
      >
        Change
      </Button>
    </div>
  );
} 