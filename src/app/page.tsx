"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GeistSans } from 'geist/font/sans';
import { ConnectedAccounts } from "@/components/ConnectedAccounts";
import { LinkedInSearch, LinkedInProfile } from "@/components/LinkedInSearch";
import { SendHorizontal, Hourglass } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [selectedProfile, setSelectedProfile] = useState<LinkedInProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSend = async () => {
    if (!selectedProfile?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/linkedin/enrich-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: selectedProfile.id }),
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
        <Card className="w-[800px] h-[600px] shadow-lg flex flex-col">
          <div className="p-4 pt-3 h-full flex flex-col flex-1">
            <ConnectedAccounts />
            <div className="flex-1 min-h-0">
              <LinkedInSearch onSelect={setSelectedProfile} />
            </div>
          </div>
          {/* Card Footer */}
          <div className="w-full flex justify-end items-center pr-3" style={{height: 56}}>
            <Button
              variant="default"
              size="icon"
              className="bg-black text-white hover:bg-gray-800"
              disabled={!selectedProfile || loading}
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
      <footer className="w-full flex justify-center items-center py-4 absolute bottom-0 left-0">
        <span className="text-xs text-gray-400">© 2025 Digress, All Rights Reserved</span>
      </footer>
    </div>
  );
}
