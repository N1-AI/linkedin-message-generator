export interface LinkedInProfile {
  id: string;
  name?: string;
  headline: string;
  profile_picture_url: string;
  degree?: string;
}

export interface Post {
  text: string;
  date: string;
  reaction_count: number;
  comment_count: number;
  share_url?: string;
}

export interface Comment {
  text: string;
  date: string;
  reaction_count: number;
  post_text: string;
  share_url?: string;
  post_reaction_count?: number;
  post_comment_count?: number;
}

export interface Reaction {
  type: string;
  post_text: string;
  share_url: string;
  reaction_count: number;
  comment_count: number;
  date?: string;
}

export interface Message {
  sender_id: string;
  is_sender: boolean;
  text: string;
  timestamp: string;
}

export interface EnrichedData {
  activity: {
    comments: Comment[];
    posts: Post[];
    reactions: Reaction[];
  };
  messages: Message[];
  profile: LinkedInProfile;
} 