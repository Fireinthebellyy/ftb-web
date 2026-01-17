export type Opportunity = {
  id: string;
  title: string;
  description: string;
  type: string;
  tags?: string[];
  images?: string[];
  createdAt?: string;
  location?: string;
  organiserInfo?: string;
  startDate?: string;
  endDate?: string;
  upvoteCount: number;
  upvoterIds: string[];
  userHasUpvoted?: boolean;
  user: {
    id: string;
    name: string;
    image: string;
    role?: "user" | "member" | "admin";
  };
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  opportunityLink?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export interface OpportunityPostProps {
  opportunity: Opportunity;
  onBookmarkChange?: (id: string, isBookmarked: boolean) => void;
  isCardExpanded?: boolean;
}

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  opportunityId: string;
  user: {
    id: string;
    name: string;
    image: string;
  };
};

export type CreateCommentData = {
  content: string;
};

export type ProfileUser = {
  id: string;
  name: string;
  email: string;
  image: string;
  fieldInterests?: string[];
  opportunityInterests?: string[];
  dateOfBirth?: string | null;
  collegeInstitute?: string | null;
  contactNumber?: string | null;
  currentRole?: string | null;
};

export type UploadProgress = {
  progress: number;
};

export interface FileItem {
  name: string;
  size: number;
  file: File;
  preview: string;
  uploading?: boolean;
  progress?: number;
  fileId?: string;
  error?: boolean;
}

export type PrivacyPolicy = {
  title: string;
  content: string;
  lastUpdated: string;
};

export type TermsType = {
  title: string;
  content: string;
  lastUpdated: string;
};

export type Toolkit = {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  coverImageUrl?: string;
  videoUrl?: string;
  contentUrl?: string;
  category?: string;
  highlights?: string[];
  totalDuration?: string;
  lessonCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  creatorName?: string;
  contentItems?: ToolkitContentItem[];
};

export type ToolkitContentItem = {
  id: string;
  toolkitId: string;
  title: string;
  type: "article" | "video";
  content?: string;
  vimeoVideoId?: string;
  bunnyVideoUrl?: string;
  orderIndex: number;
  createdAt?: string;
  updatedAt?: string;
};
