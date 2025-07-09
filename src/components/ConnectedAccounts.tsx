"use client"

import { useEffect, useState } from 'react';

interface Account {
  provider: string;
  id: string;
  name: string;
  accountId: string;
  status: string;
}

export function ConnectedAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/accounts');
        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }
        const data = await response.json();
        setAccounts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      }
    };

    fetchAccounts();
  }, []);

  if (error) {
    return (
      <div className="flex gap-2 mb-4 text-sm text-red-500">
        Error loading accounts: {error}
      </div>
    );
  }

  return (
    <div className="flex gap-2 mb-4">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="flex items-center gap-1.5 bg-gray-100/80 px-3 py-1.5 rounded-full text-sm"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              account.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          {account.status === 'connected' ? account.accountId : account.provider}
        </div>
      ))}
    </div>
  );
} 