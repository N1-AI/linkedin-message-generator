"use client"

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Settings, Hourglass } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface LinkedInProfile {
  id: string;
  name: string;
  headline: string;
  profile_picture_url: string;
  degree?: string;
}

interface LinkedInSearchProps {
  onSelect?: (profile: LinkedInProfile | null) => void;
}

export function LinkedInSearch({ onSelect }: LinkedInSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LinkedInProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchContacts = async () => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(null);
      if (onSelect) onSelect(null);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(`/api/linkedin/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      setResults(data.items || []);
      setSelectedIndex(null);
      if (onSelect) onSelect(null);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setSelectedIndex(null);
      if (onSelect) onSelect(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchContacts();
    }
  };

  const handleSelect = (profile: LinkedInProfile, idx: number) => {
    setSelectedIndex(idx);
    if (onSelect) onSelect(profile);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <Input 
            type="text" 
            placeholder="Search LinkedIn contacts..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
          />
        </div>
        <Button 
          variant="default" 
          size="icon" 
          onClick={searchContacts}
          disabled={loading}
        >
          {loading ? (
            <Hourglass className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
        <Button variant="secondary" size="icon">
          <Settings className="h-4 w-4 text-gray-700" />
        </Button>
      </div>
      <ScrollArea className="h-[370px]">
        <div className="space-y-2">
          {results.length === 0 && !loading && !hasSearched && (
            <div className="text-gray-400 text-sm text-center mt-16">search results will appear here</div>
          )}
          {results.map((profile, index) => (
            <Card
              key={index}
              className={`p-3 hover:bg-blue-50 transition-colors cursor-pointer ${
                selectedIndex === index
                  ? 'bg-blue-50 ring-1 ring-blue-300 ring-inset'
                  : ''
              }`}
              onClick={() => handleSelect(profile, index)}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-lg flex-shrink-0">
                  {profile.profile_picture_url ? (
                    <img 
                      src={profile.profile_picture_url} 
                      alt={profile.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {profile.name}
                    {profile.degree && (
                      <span className="text-xs text-gray-400"> &bull; {profile.degree}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{profile.headline}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 