import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET members of a project
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const members = await prisma.teamMember.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members);
}

// POST add a member to a project
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { projectId, userId } = await req.json();

    if (!projectId || !userId) {
      return NextResponse.json({ error: "projectId and userId are required" }, { status: 400 });
    }

    // Only owner or admin can add members
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (project.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only project owner or admin can add members" }, { status: 403 });
    }

    // Check user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if already a member
    const existing = await prisma.teamMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    if (existing) {
      return NextResponse.json({ error: "User is already a member of this project" }, { status: 400 });
    }

    const member = await prisma.teamMember.create({
      data: { userId, projectId, role: "MEMBER" },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}

// DELETE remove a member from a project
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { projectId, userId } = await req.json();

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (project.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only project owner or admin can remove members" }, { status: 403 });
    }

    await prisma.teamMember.delete({
      where: { userId_projectId: { userId, projectId } },
    });

    return NextResponse.json({ message: "Member removed" });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
