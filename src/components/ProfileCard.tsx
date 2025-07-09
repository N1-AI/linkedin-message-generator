"use client"

import { Card } from "@/components/ui/card";
import { LinkedInProfile } from "./LinkedInSearch";

interface ProfileCardProps {
  profile: LinkedInProfile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  // Get first line of headline and add ellipsis if needed
  const headlineFirstLine = profile.headline?.split('\n')[0] || '';
  const truncatedHeadline = headlineFirstLine.length > 50 
    ? `${headlineFirstLine.substring(0, 50)}...` 
    : headlineFirstLine;

  return (
    <Card className="p-3">
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
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">
            {profile.name}
            {profile.degree && (
              <span className="text-xs text-gray-400"> &bull; {profile.degree}</span>
            )}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {truncatedHeadline}
          </div>
        </div>
      </div>
    </Card>
  );
} 