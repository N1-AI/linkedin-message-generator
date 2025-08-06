"use client"

import React, { useState, useEffect, useRef } from 'react';
import { GeistSans } from 'geist/font/sans';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SendHorizontal, MessageSquare, Heart, ChevronDown, Link, Hourglass } from "lucide-react";
import { StyleSelector } from "@/components/StyleSelector";
import { MessageControls } from "@/components/MessageControls";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from 'date-fns';
import { ProfileCard } from "@/components/ProfileCard";
import { LinkedInProfile } from "@/components/LinkedInSearch";
import { generateRecommendation, GeneralMessage } from "@/lib/ai-recommender";
import { useRouter } from 'next/navigation';
import { ConnectedAccounts } from "@/components/ConnectedAccounts";

interface Reaction {
  type: string;
  post_text: string;
  share_url: string;
  reaction_count: number;
  comment_count: number;
  date?: string;
}

interface Comment {
  text: string;
  date: string;
  reaction_count: number;
  post_text: string;
  share_url?: string;
  post_reaction_count?: number;
  post_comment_count?: number;
}

interface Post {
  text: string;
  date: string;
  reaction_count: number;
  comment_count: number;
  share_url?: string;
}

interface Message {
  sender_id: string;
  is_sender: boolean;
  text: string;
  timestamp: string;
  chat_id: string;
}

interface EnrichedData {
  activity: {
    comments: Comment[];
    posts: Post[];
    reactions: Reaction[];
  };
  messages: Message[];
  profile: {
    id: string;
    name?: string;
    headline: string;
    profile_picture_url: string;
    degree?: string;
  };
  chatId: string; // Add chatId to the interface
}

function PostCard({ post, comments, reactions, isInteraction = false, interactionText = '' }: { 
  post: Post | Reaction; 
  comments: Comment[];
  reactions: Reaction[];
  isInteraction?: boolean;
  interactionText?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  
  // Handle content based on post type
  const content = 'text' in post ? post.text : post.post_text;
  const previewLines = content.split('\n').slice(0, 3).join('\n');
  const hasMoreLines = content.split('\n').length > 3;

  // Handle both Post and Reaction types
  const metrics = {
    reactions: post.reaction_count,
    comments: post.comment_count,
    date: post.date,
    shareUrl: post.share_url
  };

  return (
    <div className="p-4 border rounded-lg space-y-2 bg-white max-w-full overflow-hidden">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {!isInteraction && (
            <div className="text-sm text-gray-500 mb-2">Posted</div>
          )}
          {isInteraction && interactionText && (
            <div className="text-sm text-gray-500 mb-2">{interactionText}</div>
          )}
        </div>
        {metrics.shareUrl && (
          <a 
            href={metrics.shareUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700 ml-2 flex-shrink-0"
            title="Open in LinkedIn"
          >
            <Link className="h-4 w-4" />
          </a>
        )}
      </div>

      <div className={`text-sm whitespace-pre-line ${expanded ? '' : 'line-clamp-3'}`}>
        {expanded ? content : previewLines}
      </div>
      
      {hasMoreLines && (
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          {expanded ? 'Show less' : 'Show more'}
          <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}

      <div className="flex gap-4 mt-2 items-center">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Heart className="h-3 w-3" />
          {metrics.reactions}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MessageSquare className="h-3 w-3" />
          {metrics.comments}
        </div>
        {metrics.date && (
          <div className="text-xs text-gray-500">
            {metrics.date}
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: string) {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch (error) {
    return '';
  }
}

function RecommendationCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="text-black text-sm mb-2">{title}</h3>
      <div className="text-gray-600 text-sm">{children}</div>
    </div>
  );
}

// Add VisuallyHidden component
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
  <span className="sr-only">{children}</span>
);

function MessageCard({ message, link, setIndex }: { message: string; link?: string; setIndex?: number }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize edited message when dialog opens or message changes
  useEffect(() => {
    // Replace {url} with actual link in edited message
    const initialMessage = link ? message.replace('{url}', link) : message;
    setEditedMessage(initialMessage);
  }, [message, link]);

  const handleSend = async () => {
    setIsSending(true);
    setError(null);
    try {
      // Get the chat_id from sessionStorage
      const storedData = sessionStorage.getItem('enrichedProfileData');
      if (!storedData) {
        throw new Error('No profile data found');
      }
      
      const { profile } = JSON.parse(storedData);
      if (!profile?.chatId) {
        throw new Error('No chat ID found');
      }

      // Create form data
      const formData = new FormData();
      formData.append('text', editedMessage);

      // Send the message using the actual API endpoint
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

  // Replace {url} with the actual link in display view
  const displayMessage = link ? message.replace('{url}', link) : message;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {setIndex !== undefined && (
        <div className="bg-gray-50 px-4 py-2 border-b">
          <span className="text-sm text-gray-600">Message Set {setIndex + 1}</span>
        </div>
      )}
      <div className="p-4 relative group">
        <p className="text-sm whitespace-pre-wrap">{displayMessage}</p>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <SendHorizontal className="h-4 w-4" />
              <VisuallyHidden>Send message</VisuallyHidden>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Send Message</DialogTitle>
            <ScrollArea className="max-h-[60vh] mt-4">
              <div className="space-y-4">
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
            </ScrollArea>
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

interface Account {
  provider: string;
  id: string;
  name: string;
  accountId: string;
  status: string;
}

export default function Playground() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<EnrichedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [messageSettings, setMessageSettings] = useState({
    professional: 2,  // Default to medium formality
    length: 2,       // Default to medium length
    purposes: [] as string[],
    language: 'ENG' as 'ENG' | 'ITA'
  });
  const [recommendations, setRecommendations] = useState<any>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    console.log('Attempting to load data from sessionStorage...');
    const storedData = sessionStorage.getItem('enrichedProfileData');
    console.log('Raw stored data:', storedData);
    
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        console.log('Current profileData state:', data);
        setProfileData(data);
      } catch (error) {
        console.error('Error parsing profile data:', error);
      }
    } else {
      console.log('No data found in sessionStorage');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (profileData?.messages?.length) {
      scrollToBottom();
    }
  }, [profileData?.messages]);

  useEffect(() => {
    if (dialogOpen && !isLoading && profileData?.messages?.length) {
      // Use setTimeout to ensure the dialog is fully rendered
      setTimeout(scrollToBottom, 0);
    }
  }, [dialogOpen, isLoading, profileData?.messages]);

  const handleStyleChange = (professional: number, length: number) => {
    setMessageSettings(prev => ({
      ...prev,
      professional,
      length
    }));
  };

  const handlePurposeChange = (purposes: string[]) => {
    setMessageSettings(prev => ({
      ...prev,
      purposes
    }));
  };

  const handleLanguageChange = (language: 'ENG' | 'ITA') => {
    setMessageSettings(prev => ({
      ...prev,
      language
    }));
  };

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    setIsAccountDialogOpen(false);
    sessionStorage.setItem('selectedAccountId', account.id);
  };

  const handleChangeAccount = () => {
    const connectedAccounts = accounts.filter((account) => account.status === 'connected');
    if (connectedAccounts.length > 1) {
      setIsAccountDialogOpen(true);
    }
  };

  const handleSend = async () => {
    if (!profileData) {
      console.warn('No profile data available');
      return;
    }

    setIsLoading(true);
    try {
      const recommendation = await generateRecommendation({
        profileData,
        settings: {
          professional: messageSettings.professional,
          length: messageSettings.length,
          purposes: messageSettings.purposes,
          language: messageSettings.language
        }
      });
      
      // For mobile, store recommendations and ensure profile data in sessionStorage and navigate
      if (window.innerWidth < 640) {
        // Store recommendations
        sessionStorage.setItem('playgroundRecommendations', JSON.stringify(recommendation));
        
        // Ensure profile data is stored
        if (profileData) {
          sessionStorage.setItem('enrichedProfileData', JSON.stringify(profileData));
        }
        
        router.push('/playground/results');
        return;
      }
      
      // For desktop, set recommendations directly
      setRecommendations(recommendation);
      console.log('AI Recommendation Data:', recommendation);
    } catch (error) {
      console.error('Error generating recommendation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full relative ${GeistSans.className}`}>
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

      <div className="relative w-full h-screen p-4 flex flex-col sm:flex-row gap-4 items-center justify-center">
        <Card className="w-full sm:w-[600px] h-[400px] sm:h-[600px] shadow-lg p-4 flex flex-col">
          <ConnectedAccounts 
            selectedAccount={selectedAccount} 
            onChangeAccount={handleChangeAccount}
          />
          <div className="space-y-4">
            <StyleSelector onStyleChange={handleStyleChange} />
            <MessageControls 
              onPurposeChange={handlePurposeChange}
              onLanguageChange={handleLanguageChange}
            />
          </div>
          <div className="flex justify-between items-center pt-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button className="text-sm text-gray-500 hover:text-gray-900 hover:underline sm:block hidden whitespace-nowrap">
                  View Data
                </button>
              </DialogTrigger>
              <DialogContent
                className="max-w-[70vw] w-[65vw] h-[80vh] p-0 flex flex-col"
                style={{ maxWidth: '70vw', width: '65vw', height: '80vh' }}
              >
                <DialogTitle className="sr-only">Profile Data Dialog</DialogTitle>
                <div className="flex flex-1 h-full w-full overflow-hidden">
                  {/* Messages Panel */}
                  <div className="flex-1 border-r p-4 min-w-0 flex flex-col h-full">
                    <h3 className="text-sm font-medium mb-3">Messages</h3>
                    <div className="flex-1 min-h-0 flex flex-col">
                      <div 
                        ref={scrollAreaRef}
                        className="flex-1 overflow-y-auto"
                      >
                        <div className="space-y-2 pb-4">
                          {isLoading ? (
                            <div className="text-sm text-gray-500">Loading messages...</div>
                          ) : profileData?.messages?.length ? (
                            [...profileData.messages]
                              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                              .map((message, index) => (
                                <div key={`${message.sender_id}-${index}`} className="max-w-full">
                                  <div 
                                    className={`rounded-lg px-3 py-2 text-sm w-fit max-w-[75%] break-words ${
                                      message.is_sender 
                                        ? 'bg-white text-gray-900 border border-gray-200 ml-auto' 
                                        : 'bg-gray-100 text-gray-900'
                                    }`}
                                  >
                                    {message.text}
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="text-sm text-gray-500">No messages found</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Panel */}
                  <div className="flex-1 p-4 min-w-0 flex flex-col">
                    <ScrollArea className="flex-1 min-h-0">
                      <div className="space-y-8">
                        {/* Posts Section */}
                        <div>
                          <h3 className="text-sm font-medium mb-4">Posts</h3>
                          <div className="space-y-4">
                            {isLoading ? (
                              <div className="text-sm text-gray-500">Loading posts...</div>
                            ) : profileData?.activity?.posts?.length ? (
                              profileData.activity.posts.map((post, index) => (
                                <PostCard 
                                  key={`post-${index}`}
                                  post={post}
                                  comments={[]}
                                  reactions={[]}
                                  isInteraction={false}
                                />
                              ))
                            ) : (
                              <div className="text-sm text-gray-500">No posts found</div>
                            )}
                          </div>
                        </div>

                        {/* Comments Section */}
                        <div>
                          <h3 className="text-sm font-medium mb-4">Comments</h3>
                          <div className="space-y-4">
                            {profileData?.activity?.comments.map((comment, index) => {
                              const relatedPost = profileData?.activity?.posts.find(
                                p => p.text === comment.post_text
                              );
                              return relatedPost ? (
                                <PostCard
                                  key={`comment-${index}`}
                                  post={relatedPost}
                                  comments={[]}
                                  reactions={[]}
                                  isInteraction={true}
                                  interactionText={`Commented: "${comment.text}"`}
                                />
                              ) : null;
                            })}
                          </div>
                        </div>

                        {/* Reactions Section */}
                        <div>
                          <h3 className="text-sm font-medium mb-4">Reactions</h3>
                          <div className="space-y-4">
                            {profileData?.activity?.reactions.map((reaction, index) => (
                              <PostCard
                                key={`reaction-${index}`}
                                post={reaction}
                                comments={[]}
                                reactions={[]}
                                isInteraction={true}
                                interactionText={`Reacted with ${reaction.type}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <div className="flex justify-end mt-4 w-full">
              <Button 
                onClick={handleSend}
                disabled={isLoading}
                className="bg-black text-white hover:bg-gray-800 disabled:bg-gray-400"
                size="icon"
              >
                {isLoading ? (
                  <Hourglass className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizontal className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
        <Card className="hidden sm:flex w-[600px] h-[600px] shadow-lg p-4 flex-col">
          {profileData && (
            <div className="flex flex-col h-full">
              <div className="flex-shrink-0 mb-4">
                <ProfileCard profile={{
                  ...profileData.profile,
                  name: profileData.profile.name || 'Unknown User'
                }} />
              </div>
              <ScrollArea className="flex-1 h-[calc(100%-100px)] w-full">
                <div className="pr-4">
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