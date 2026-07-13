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
  applyLink?: string | null;
  publishAt?: string;
  upvoteCount: number;
  upvoterIds: string[];
  userHasUpvoted?: boolean;
  trending?: boolean;        
  featuredHome?: boolean;
  displayIndex?: number; 
  user: {
    id: string;
    name: string;
    image: string;
    role?: "user" | "member" | "editor" | "admin";
  };
};

export type Internship = {
  id: string;
  title: string;
  description?: string | null;
  type?: string | null;
  timing?: string | null;
  link?: string | null;
  tags?: string[];
  location?: string | null;
  deadline?: string | null;
  stipend?: number | null;
  hiringOrganization: string;
  hiringManager?: string | null;
  hiringManagerLinkedin?: string | null;
  hiringManagerEmail?: string | null;
  field?: string | null;
  experience?: string | null;
  duration?: string | null;
  createdAt?: string;
  isVerified?: boolean;
  isFlagged?: boolean;
  isActive?: boolean;
  is_trending?: boolean;
  is_featured_home?: boolean;
  display_index?: number;
  trending_index?: number;
  featured_home_index?: number;
  trending_featured_expiry?: string | null;
  user: {
    id: string;
    name: string;
    image: string;
    role?: "user" | "member" | "editor" | "admin";
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
  hiringManagerLinkedin?: string | null;
  hiringManagerEmail?: string | null;
  field?: string | null;
  contactEmail?: string | null;
  postUrl?: string | null;
  applyLink?: string | null;
  companyDescription?: string | null;
  website?: string | null;
  display_index?: number;
  trending_index?: number;
  featured_home_index?: number;
  trending_featured_expiry?: string | null;
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
  isActionsHidden?: boolean;
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

export type UngatekeepComment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  postId: string;
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
  id: string;
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
  addedAt?: number;
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

export type DigitalProductSection = {
  id: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  mentorshipDetails?: any;
  totalDuration?: string;
  rating?: string;
  subtitle?: string;
  lessonCount?: number;
  isActive?: boolean;
  showSaleBadge?: boolean;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  creatorName?: string;
  contentItems?: ToolkitContentItem[];
  testimonials?: ToolkitTestimonial[];
  is_trending?: boolean;
  is_featured_home?: boolean;
  isBundle?: boolean;
  bundleItems?: string[];
  isBestSeller?: boolean;
  isLimitedSeats?: boolean;
  digitalProductSectionId?: string | null;
  digitalProductSectionTitle?: string | null;
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

export type ToolkitCommunityPostType = "text" | "mcq" | "poll" | "attachment" | "qna";

export type ToolkitCommunityOption = {
  text: string;
  isCorrect?: boolean;
};

export type ToolkitCommunityPost = {
  id: string;
  toolkitId: string;
  type: ToolkitCommunityPostType;
  title: string;
  body?: string | null;
  options?: ToolkitCommunityOption[] | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  orderIndex: number;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** null = not yet answered; number = index of the option the user selected */
  userSelectedIndex?: number | null;
  /** For QnA only: the text response the user submitted */
  userTextResponse?: string | null;
  /** For QnA only: the attachment URL the user submitted */
  userAttachmentUrl?: string | null;
  /** For QnA only: the attachment name the user submitted */
  userAttachmentName?: string | null;
  /** For QnA only: the attachment type the user submitted */
  userAttachmentType?: string | null;
  /** For polls only (after voting): vote count per option index */
  optionVoteCounts?: number[];
  /** For polls only (after voting): total number of votes */
  totalVotes?: number;
};

// Cohort Types
export type CohortSession = {
  id: string;
  cohortId: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  queries?: CohortSessionQuery[];
};

export type CohortSessionContent = {
  id: string;
  sessionId: string;
  sectionType: "live_session" | "meet_mentor" | "resources" | "recording";
  title: string;
  content?: string | null;
  isUnlocked: boolean;
  lockedMessage?: string | null;
  orderIndex: number;
  liveSessionLink?: string | null;
  videoUrl?: string | null;
  images?: string[] | null;
  createdAt: string;
  updatedAt: string;
  resources?: CohortSessionResource[];
  mentors?: CohortSessionMentor[];
};

export type CohortSessionResource = {
  id: string;
  contentId: string;
  name: string;
  url: string;
  type: "file" | "video" | "link" | "image" | "pdf" | "ppt";
  orderIndex: number;
  createdAt: string;
};

export type CohortSessionQuery = {
  id: string;
  sessionId: string;
  userId: string;
  question: string;
  answer?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CohortSessionMentor = {
  id: string;
  contentId: string;
  name: string;
  role?: string | null;
  imageUrl?: string | null;
  bio?: string | null;
  linkedinUrl?: string | null;
  otherLinks?: { title: string; url: string }[] | null;
  orderIndex: number;
  createdAt: string;
};

export type CohortDetailResponse = {
  cohort: { id: string; title: string };
  hasAccess: boolean;
  sessions: CohortSession[];
};

export type CohortSessionResponse = {
  session: CohortSession;
  contents: CohortSessionContent[];
};
