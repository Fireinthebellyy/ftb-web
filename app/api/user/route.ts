import { db } from "@/lib/db";
import { users_sync } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const userInfo = await req.json();

    const { name, image, bio, email, interested_field } = userInfo;

    const existingUser = await db
      .select()
      .from(users_sync)
      .where(eq(users_sync.email, email));

    if (existingUser.length > 0) {
      // Update existing user
      await db
        .update(users_sync)
        .set({
          name: name,
          image: image,
          bio: bio,
          updatedAt: new Date(),
          interestedField: interested_field,
        })
        .where(eq(users_sync.email, email));

      return NextResponse.json(
        { message: "User updated successfully" },
        { status: 200 }
      );
    } else {
      // Insert new user
      await db.insert(users_sync).values({
        name: name,
        image: image,
        bio: bio,
        email: email,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "student",
        bookmarks: "[]",
        interestedField: interested_field,
      });

      return NextResponse.json(
        { message: "User created successfully" },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error saving user info:", error);
    return NextResponse.json(
      { error: "Failed to save user info" },
      { status: 500 }
    );
  }
}
