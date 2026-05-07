import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET all tasks for the current user
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const where = projectId
    ? { projectId }
    : {
        OR: [
          { project: { ownerId: session.user.id } },
          { project: { members: { some: { userId: session.user.id } } } },
          { assigneeId: session.user.id },
        ],
      };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

// POST create a new task
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, description, projectId, assigneeId, priority, dueDate } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }
    if (!projectId) {
      return NextResponse.json({ error: "Project is required" }, { status: 400 });
    }

    // Check project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: "No access to this project" }, { status: 403 });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        projectId,
        assigneeId: assigneeId || null,
        priority: priority || "MEDIUM",
        status: "TODO",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

// PATCH update a task (status, details)
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, status, title, description, priority, dueDate, assigneeId } = await req.json();

    if (!id) return NextResponse.json({ error: "Task ID is required" }, { status: 400 });

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // Access: project owner, task assignee, or admin
    const isOwner = task.project.ownerId === session.user.id;
    const isAssignee = task.assigneeId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAssignee && !isAdmin) {
      return NextResponse.json({ error: "No permission to update this task" }, { status: 403 });
    }

    // Members can only update status of tasks assigned to them
    if (!isOwner && !isAdmin && isAssignee) {
      // Allow only status update
      const updatedTask = await prisma.task.update({
        where: { id },
        data: { status },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      });
      return NextResponse.json(updatedTask);
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE a task
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await req.json();

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const isOwner = task.project.ownerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Only project owner or admin can delete tasks" }, { status: 403 });
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
