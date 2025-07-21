"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GeistSans } from 'geist/font/sans';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProfileCard } from "@/components/ProfileCard";
import { SendHorizontal, ArrowLeft, Hourglass } from "lucide-react";
import { GeneralMessage } from "@/lib/ai-recommender";
import { LinkedInProfile } from "@/components/LinkedInSearch";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface EnrichedData {
  profile: {
    id: string;
    name?: string;
    headline: string;
    profile_picture_url: string;
    degree?: string;
  };
}

// Inline MessageCard component
function MessageCard({ message, link, setIndex }: { message: string; link?: string; setIndex?: number }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialMessage = link ? message.replace('{url}', link) : message;
    setEditedMessage(initialMessage);
  }, [message, link]);

  const handleSend = async () => {
    setIsSending(true);
    setError(null);
    try {
      const storedData = sessionStorage.getItem('enrichedProfileData');
      if (!storedData) {
        throw new Error('No profile data found');
      }
      
      const { profile } = JSON.parse(storedData);
      if (!profile?.chatId) {
        throw new Error('No chat ID found');
      }

      const response = await fetch(`/api/linkedin/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: profile.chatId,
          text: editedMessage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const displayMessage = link ? message.replace('{url}', link) : message;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {setIndex !== undefined && (
        <div className="bg-gray-50 px-4 py-2 border-b">
          <span className="text-sm text-gray-600">Message Set {setIndex + 1}</span>
        </div>
      )}
      <div className="p-4 relative">
        <p className="text-sm whitespace-pre-wrap">{displayMessage}</p>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-100"
          onClick={() => setIsDialogOpen(true)}
        >
          <SendHorizontal className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogTitle>Send Message</DialogTitle>
            <div className="space-y-4 mt-4">
              <div className="text-sm text-gray-600">
                Review and edit message:
              </div>
              <Textarea
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                className="min-h-[200px] text-sm"
              />
              {error && (
                <div className="text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button
                onClick={handleSend}
                disabled={isSending}
                className="w-full sm:w-auto"
              >
                {isSending ? (
                  <Hourglass className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizontal className="h-4 w-4 mr-2" />
                )}
                Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function PlaygroundResults() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<any>(null);
  const [profileData, setProfileData] = useState<EnrichedData | null>(null);

  useEffect(() => {
    // Retrieve data from sessionStorage
    const storedRecommendations = sessionStorage.getItem('playgroundRecommendations');
    const storedProfileData = sessionStorage.getItem('enrichedProfileData');

    if (storedRecommendations) {
      setRecommendations(JSON.parse(storedRecommendations));
    }

    if (storedProfileData) {
      const parsedProfileData = JSON.parse(storedProfileData);
      setProfileData(parsedProfileData);
    }
  }, []);

  const handleBack = () => {
    router.push('/playground');
  };

  return (
    <div className={`min-h-screen w-full relative ${GeistSans.className}`}>
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

      <div className="relative w-full h-screen p-4 flex items-center justify-center">
        <Card className="w-full max-w-[400px] h-[400px] sm:h-[600px] shadow-lg p-4 flex flex-col">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-sm font-medium">Recommendations</h2>
          </div>

          {profileData && (
            <div className="flex flex-col h-full">
              <div className="flex-shrink-0 mb-4">
                <ProfileCard profile={{
                  ...profileData.profile,
                  name: profileData.profile.name || 'Unknown User'
                }} />
              </div>
              <ScrollArea className="flex-1 overflow-hidden h-[calc(100%-200px)] w-full">
                <div className="pr-4 pb-4">
                  {recommendations && (
                    <div className="space-y-4">
                      {/* Article recommendation */}
                      <MessageCard 
                        message={recommendations.articleRecommendation.message}
                        link={recommendations.articleRecommendation.url}
                        setIndex={0}
                      />

                      {/* Podcast recommendation */}
                      <MessageCard 
                        message={recommendations.podcastRecommendation.message}
                        link={recommendations.podcastRecommendation.url}
                        setIndex={1}
                      />

                      {/* General messages */}
                      {recommendations.generalMessages.map((msg: GeneralMessage, idx: number) => (
                        <MessageCard
                          key={idx}
                          message={msg.text}
                          setIndex={idx + 2}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </Card>
      </div>
      <footer className="w-full flex justify-center items-center py-4 absolute bottom-0 left-0">
        <span className="text-xs text-gray-400">© 2025 Digress, All Rights Reserved</span>
      </footer>
    </div>
  );
} 