import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET dashboard stats
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // All tasks the user can see
  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { project: { ownerId: userId } },
        { project: { members: { some: { userId } } } },
        { assigneeId: userId },
      ],
    },
    include: {
      project: { select: { name: true } },
      assignee: { select: { name: true } },
    },
  });

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      tasks: { select: { status: true } },
    },
  });

  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((t) => t.status === "TODO").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "COMPLETED"
  ).length;

  return NextResponse.json({
    stats: {
      totalProjects: projects.length,
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
    },
    recentTasks: tasks.slice(0, 5),
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      taskCount: p.tasks.length,
      completed: p.tasks.filter((t) => t.status === "COMPLETED").length,
      progress: p.tasks.length > 0 ? Math.round((p.tasks.filter((t) => t.status === "COMPLETED").length / p.tasks.length) * 100) : 0,
    })),
  });
}
