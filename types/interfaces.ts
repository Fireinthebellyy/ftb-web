export type Opportunity = {
  id: string;
  title: string;
  description: string;
  type: string;
  tags?: string[];
  images?: string[];
  attachments?: string[];
  createdAt?: string;
  location?: string;
  organiserInfo?: string;
  startDate?: string;
  endDate?: string;
  publishAt?: string;
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

export type Internship = {
  id: string;
  title: string;
  description?: string | null;
  type?: string | null;
  timing?: string | null;
  link: string;
  tags?: string[];
  location?: string | null;
  deadline?: string | null;
  stipend?: number | null;
  hiringOrganization: string;
  hiringManager?: string | null;
  experience?: string | null;
  duration?: string | null;
  createdAt?: string;
  isVerified?: boolean;
  isFlagged?: boolean;
  isActive?: boolean;
  user: {
    id: string;
    name: string;
    image: string;
    role?: "user" | "member" | "admin";
  };
};

export interface InternshipData extends Omit<
  Internship,
  "tags" | "deadline" | "createdAt" | "user"
> {
  tags: string[];
  deadline: string | null;
  createdAt: string | null;
  poster?: string | null;
  eligibility?: string[];
  hiringManagerEmail?: string | null;
  contactEmail?: string | null;
  postUrl?: string | null;
  applyLink?: string | null;
  companyDescription?: string | null;
  website?: string | null;
  user: {
    id: string;
    name: string;
    image: string;
    role: string;
  };
}

// Flexible interface for ApplyModal
export interface ApplyModalOpportunity {
  id: number | string;
  kind?: "internship" | "opportunity";
  title: string;
  company?: string;
  hiringOrganization?: string;
  organiserInfo?: string;
  logo?: string;
  poster?: string;
  images?: string[];
  skills?: string[];
  tags?: string[];
  [key: string]: unknown;
}

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

export interface InternshipPostProps {
  internship: Internship;
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

export type FileKind = "image" | "pdf" | "ppt";

export interface FileItem {
  name: string;
  size: number;
  file: File;
  preview: string;
  kind: FileKind;
  uploading?: boolean;
  progress?: number;
  fileId?: string;
  error?: boolean;
  errorMessage?: string;
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

export type ToolkitTestimonial = {
  name: string;
  role: string;
  message: string;
};

export type Toolkit = {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  coverImageUrl?: string;
  bannerImageUrl?: string;
  videoUrl?: string;
  contentUrl?: string;
  category?: string;
  highlights?: string[];
  totalDuration?: string;
  lessonCount?: number;
  isActive?: boolean;
  showSaleBadge?: boolean;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  creatorName?: string;
  contentItems?: ToolkitContentItem[];
  testimonials?: ToolkitTestimonial[];
};

export type ToolkitContentItem = {
  id: string;
  toolkitId: string;
  title: string;
  type: "article" | "video";
  content?: string;
  bunnyVideoUrl?: string;
  orderIndex: number;
  createdAt?: string;
  updatedAt?: string;
};
