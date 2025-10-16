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
  user: {
    id: string;
    name: string;
    image: string;
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
