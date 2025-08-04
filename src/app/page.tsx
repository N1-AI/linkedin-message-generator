"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GeistSans } from 'geist/font/sans';
import { ConnectedAccounts } from "@/components/ConnectedAccounts";
import { LinkedInSearch, LinkedInProfile } from "@/components/LinkedInSearch";
import { SendHorizontal, Hourglass } from "lucide-react";
import { useRouter } from "next/navigation";

interface Account {
  provider: string;
  id: string;
  name: string;
  accountId: string;
  status: string;
}

export default function Home() {
  const [selectedProfile, setSelectedProfile] = useState<LinkedInProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const router = useRouter();

  // Load selected account from session storage
  useEffect(() => {
    const savedAccountId = sessionStorage.getItem('selectedAccountId');
    if (savedAccountId) {
      // We'll set the account after fetching accounts
      return;
    }
  }, []);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/accounts');
        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }
        const data = await response.json();
        setAccounts(data);

        const connectedAccounts = data.filter((account: Account) => account.status === 'connected');
        
        // Try to load saved account from session storage
        const savedAccountId = sessionStorage.getItem('selectedAccountId');
        if (savedAccountId) {
          const savedAccount = connectedAccounts.find((account: Account) => account.id === savedAccountId);
          if (savedAccount) {
            setSelectedAccount(savedAccount);
            return;
          }
        }

        // If no saved account or saved account not found, handle selection
        if (connectedAccounts.length > 1) {
          setIsAccountDialogOpen(true);
        } else if (connectedAccounts.length === 1) {
          setSelectedAccount(connectedAccounts[0]);
          // Save to session storage
          sessionStorage.setItem('selectedAccountId', connectedAccounts[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch accounts', err);
      }
    };

    fetchAccounts();
  }, []);

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    setIsAccountDialogOpen(false);
    // Save to session storage
    sessionStorage.setItem('selectedAccountId', account.id);
  };

  const handleChangeAccount = () => {
    const connectedAccounts = accounts.filter((account) => account.status === 'connected');
    if (connectedAccounts.length > 1) {
      setIsAccountDialogOpen(true);
    }
  };

  const handleSend = async () => {
    if (!selectedProfile?.id || !selectedAccount) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/linkedin/enrich-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: selectedProfile.id,
          accountId: selectedAccount.id 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to enrich profile');
      }

      const data = await response.json();
      
      // Get the first chat_id from the messages (assuming messages are from the same chat)
      const chatId = data.messages?.[0]?.chat_id;
      
      // Store both the enriched data and chat_id in sessionStorage
      sessionStorage.setItem('enrichedProfileData', JSON.stringify({
        ...data,
        chatId // Add chat_id to the stored data
      }));
      
      // Navigate to the playground
      router.push('/playground');
    } catch (error) {
      console.error('Error enriching profile:', error);
      // You might want to show an error toast here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full relative overflow-hidden ${GeistSans.className}`}>
      {/* Account Selection Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select LinkedIn Account</DialogTitle>
            <DialogDescription>
              You have multiple connected LinkedIn accounts. Please choose which one to use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {accounts
              .filter((account) => account.status === 'connected')
              .map((account) => (
                <Button 
                  key={account.id} 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleAccountSelect(account)}
                >
                  {account.accountId}
                </Button>
              ))
            }
          </div>
        </DialogContent>
      </Dialog>

      {/* Grid background with fade effect */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(to top, 
              rgba(255, 255, 255, 1) 0%, 
              rgba(255, 255, 255, 0) 100%
            ),
            linear-gradient(to right, #f7f7f7 1px, transparent 1px),
            linear-gradient(to bottom, #f7f7f7 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          backgroundPosition: 'center center'
        }}
      />

      {/* Main content */}
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-[800px] h-full max-h-[500px] sm:max-h-[700px] shadow-lg flex flex-col sm:w-[800px] sm:h-[700px] relative">
          <div className="p-4 pt-3 h-full flex flex-col flex-1">
            <ConnectedAccounts 
              selectedAccount={selectedAccount} 
              onChangeAccount={handleChangeAccount}
            />
            <div className="flex-1 min-h-0 relative flex flex-col">
              <div className="flex-grow overflow-auto mb-2 pb-14 sm:pb-0 max-h-[300px] sm:max-h-none">
                <LinkedInSearch 
                  onSelect={setSelectedProfile} 
                  selectedAccountId={selectedAccount?.id || null}
                />
              </div>
            </div>
          </div>
          {/* Mobile Send Button - Positioned absolutely */}
          <div className="absolute bottom-4 right-4 sm:hidden z-10">
            <Button
              variant="default"
              size="icon"
              className="bg-black text-white hover:bg-gray-800"
              disabled={!selectedProfile || loading || !selectedAccount}
              onClick={handleSend}
            >
              {loading ? (
                <Hourglass className="h-5 w-5 animate-spin" />
              ) : (
                <SendHorizontal className="h-5 w-5" />
              )}
            </Button>
          </div>
          {/* Card Footer - Only visible on desktop */}
          <div className="w-full flex justify-end items-center pr-3 hidden sm:flex" style={{height: 56}}>
            <Button
              variant="default"
              size="icon"
              className="bg-black text-white hover:bg-gray-800"
              disabled={!selectedProfile || loading || !selectedAccount}
              onClick={handleSend}
            >
              {loading ? (
                <Hourglass className="h-5 w-5 animate-spin" />
              ) : (
                <SendHorizontal className="h-5 w-5" />
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className="w-full flex justify-center items-center py-4 absolute bottom-0 left-0 text-center px-4">
        <span className="text-xs text-gray-400">© 2025 Digress, All Rights Reserved</span>
      </footer>
    </div>
  );
}
