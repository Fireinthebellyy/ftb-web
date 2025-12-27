import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toolkits, user } from "@/lib/schema";

// POST - Seed sample toolkits (for testing only)
export async function POST() {
  try {
    // Get existing user ID for seeding
    const existingUser = await db.select({ id: user.id }).from(user).limit(1);
    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "No users found in database. Please create a user first." },
        { status: 500 }
      );
    }
    const userId = existingUser[0].id;

    // Sample toolkit data
    const sampleToolkits = [
      {
        title: "Advanced Python Programming",
        description:
          "Master advanced Python concepts including decorators, generators, async/await, and more.",
        price: 29900, // ₹299.00
        coverImageUrl:
          "https://images.unsplash.com/photo-1571171637578-4e5b7c34aa56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
        contentUrl: "https://example.com/python-advanced-content",
        userId, // Use the existing user ID
      },
      {
        title: "React Hooks Mastery",
        description:
          "Deep dive into React Hooks - useState, useEffect, useContext, custom hooks, and performance optimization.",
        price: 39900, // ₹399.00
        coverImageUrl:
          "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        videoUrl: "https://www.youtube.com/watch?v=O6P86uwfdR0",
        contentUrl: "https://example.com/react-hooks-content",
        userId, // Use the existing user ID
      },
      {
        title: "Data Science with Python",
        description:
          "Comprehensive guide to data science using Python - Pandas, NumPy, Matplotlib, and machine learning basics.",
        price: 49900, // ₹499.00
        coverImageUrl:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        videoUrl: "https://www.youtube.com/watch?v=LHBE6Q9XlzI",
        contentUrl: "https://example.com/data-science-content",
        userId, // Use the existing user ID
      },
      {
        title: "Full Stack Web Development",
        description:
          "Complete full stack development course covering frontend, backend, databases, and deployment.",
        price: 59900, // ₹599.00
        coverImageUrl:
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        videoUrl: "https://www.youtube.com/watch?v=8Mm1jxD5D1Y",
        contentUrl: "https://example.com/fullstack-content",
        userId, // Use the existing user ID
      },
    ];

    // Insert sample toolkits
    for (const toolkit of sampleToolkits) {
      await db.insert(toolkits).values(toolkit);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sample toolkits seeded successfully",
        count: sampleToolkits.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error seeding toolkits:", error);
    return NextResponse.json(
      { error: "Failed to seed toolkits" },
      { status: 500 }
    );
  }
}
