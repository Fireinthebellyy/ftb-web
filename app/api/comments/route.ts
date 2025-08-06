import { db2 } from "@/lib/db2";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Comment schema for validation
const commentSchema = z.object({
  opportunityId: z.string().min(1, "Opportunity ID is required"),
  content: z.string().min(1, "Comment content is required").max(500, "Comment too long"),
});

// GET - Fetch comments for an opportunity
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const opportunityId = searchParams.get('opportunityId');

    if (!opportunityId) {
      return NextResponse.json(
        { error: "Opportunity ID is required" },
        { status: 400 }
      );
    }

    // For now, we'll use a simple in-memory storage
    // In a real app, you'd query the database
    const comments = getCommentsForOpportunity(opportunityId);

    return NextResponse.json(
      { success: true, comments },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const validatedData = commentSchema.parse(body);

    const newComment = {
      id: Date.now().toString(),
      opportunityId: validatedData.opportunityId,
      content: validatedData.content,
      userId: user.currentUser.id,
      userName: user.currentUser.name || 'Anonymous',
      createdAt: new Date().toISOString(),
    };

    // For now, we'll use in-memory storage
    // In a real app, you'd insert into the database
    addComment(newComment);

    return NextResponse.json(
      { success: true, comment: newComment },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

// In-memory storage for comments (replace with database in production)
let commentsStorage: any[] = [];

function getCommentsForOpportunity(opportunityId: string) {
  return commentsStorage
    .filter(comment => comment.opportunityId === opportunityId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function addComment(comment: any) {
  commentsStorage.push(comment);
} 