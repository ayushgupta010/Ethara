# TaskFlow — Team Task Manager

A full-stack web application for creating projects, assigning tasks, and tracking progress with role-based access control (Admin/Member).

Built with **Next.js 14 (App Router)**, **Prisma ORM**, **SQLite**, and **NextAuth.js**.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Role-Based Access Control](#-role-based-access-control)
- [Pages & Workflow](#-pages--workflow)
- [Screenshots](#-screenshots)

---

## ✨ Features

### Authentication
- User registration with email, name, password, and role selection
- Secure login using NextAuth.js (Credentials Provider)
- Passwords hashed with bcryptjs
- JWT-based session management
- Auto-login after signup

### Project Management
- Create projects with name and description (Admin only)
- View all projects with progress tracking
- Delete projects and all related tasks (Admin/Owner only)
- Search/filter projects

### Task Management
- Create tasks with title, description, project, assignee, priority, and due date
- Assign tasks to any team member
- Update task status inline (Todo → In Progress → Completed)
- Filter tasks by status (All / Todo / In Progress / Completed)
- Search tasks by title
- Delete tasks (Admin only)
- Priority levels: Low, Medium, High

### Dashboard
- Real-time statistics from the database:
  - Total Projects
  - Tasks In Progress
  - Completed Tasks
  - Overdue Tasks (tasks past due date and not completed)
- Recent tasks table
- Project progress bars with completion percentages

### Team Management
- View all registered users
- See each member's role, project count, task count, and join date

### Settings
- **Profile**: Update name and email (saved to database)
- **Security**: Change password with current password verification
- **Notifications**: Toggle notification preferences (6 options)
- **Appearance**: Theme selection (Light mode active)

---

## 🛠 Tech Stack

| Layer         | Technology                     |
|---------------|-------------------------------|
| Framework     | Next.js 14 (App Router)       |
| Database      | SQLite (via Prisma ORM)       |
| Auth          | NextAuth.js (Credentials)     |
| Hashing       | bcryptjs                      |
| Icons         | Lucide React                  |
| Styling       | Vanilla CSS (custom design system) |
| Language      | JavaScript (ES6+)             |

---

## 📁 Project Structure

```
ASSIGNMENT/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.js   # NextAuth config (login)
│   │   │   └── signup/route.js          # User registration API
│   │   ├── dashboard/route.js           # Dashboard stats API
│   │   ├── projects/route.js            # Projects CRUD API
│   │   ├── tasks/route.js               # Tasks CRUD API
│   │   ├── team/route.js                # Team listing API
│   │   └── user/
│   │       ├── profile/route.js         # Profile update API
│   │       └── password/route.js        # Password change API
│   ├── login/page.js                    # Login page
│   ├── signup/page.js                   # Registration page
│   ├── projects/page.js                 # Projects management
│   ├── tasks/page.js                    # Task management
│   ├── team/page.js                     # Team overview
│   ├── settings/page.js                 # User settings (4 tabs)
│   ├── page.js                          # Dashboard (home)
│   ├── layout.js                        # Root layout + providers
│   ├── providers.js                     # NextAuth SessionProvider
│   └── globals.css                      # Global styles
├── components/
│   ├── Sidebar.js                       # Navigation sidebar
│   └── LayoutShell.js                   # Conditional layout wrapper
├── lib/
│   └── prisma.js                        # Prisma client singleton
├── prisma/
│   ├── schema.prisma                    # Database schema
│   └── dev.db                           # SQLite database file
├── .env                                 # Environment variables
├── jsconfig.json                        # Path aliases (@/)
├── package.json                         # Dependencies
└── README.md                            # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# 1. Navigate to the project directory
cd ASSIGNMENT

# 2. Install dependencies
npm install

# 3. Set up the database
npx prisma db push

# 4. Generate Prisma client
npx prisma generate

# 5. Start the development server
npm run dev
```

The app will be running at **http://localhost:3000**

### Environment Variables

The `.env` file contains:

```env
NEXTAUTH_SECRET=my-super-secret-key-for-task-manager-2026
NEXTAUTH_URL=http://localhost:3000
```

---

## 🗄 Database Schema

The application uses 4 models with proper relationships:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     User     │     │   Project    │     │     Task     │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │──┐  │ id (PK)      │──┐  │ id (PK)      │
│ name         │  │  │ name         │  │  │ title        │
│ email (UQ)   │  │  │ description  │  │  │ description  │
│ password     │  ├─→│ ownerId (FK) │  ├─→│ projectId(FK)│
│ role         │  │  │ createdAt    │  │  │ assigneeId   │
│ createdAt    │  │  │ updatedAt    │  │  │ status       │
│ updatedAt    │  │  └──────────────┘  │  │ priority     │
└──────────────┘  │                     │  │ dueDate      │
                  │  ┌──────────────┐  │  │ createdAt    │
                  │  │ TeamMember   │  │  │ updatedAt    │
                  │  ├──────────────┤  │  └──────────────┘
                  │  │ id (PK)      │  │
                  ├─→│ userId (FK)  │  │
                     │ projectId(FK)│←─┘
                     │ role         │
                     │ createdAt    │
                     └──────────────┘
```

### Relationships
- **User → Project**: One user can own many projects (via `ownerId`)
- **User → Task**: One user can be assigned many tasks (via `assigneeId`)
- **Project → Task**: One project has many tasks
- **User ↔ Project** (many-to-many via TeamMember): Users can be members of multiple projects

### Field Details

| Model    | Field     | Values                         |
|----------|-----------|-------------------------------|
| User     | role      | `ADMIN` or `MEMBER`           |
| Task     | status    | `TODO`, `IN_PROGRESS`, `COMPLETED` |
| Task     | priority  | `LOW`, `MEDIUM`, `HIGH`       |

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint                 | Description          | Auth Required |
|--------|--------------------------|----------------------|--------------|
| POST   | `/api/auth/signup`       | Register a new user  | No           |
| POST   | `/api/auth/[...nextauth]`| Login (NextAuth)     | No           |

### Projects

| Method | Endpoint        | Description           | Auth Required | Role     |
|--------|-----------------|----------------------|--------------|----------|
| GET    | `/api/projects` | List user's projects  | Yes          | Any      |
| POST   | `/api/projects` | Create a project      | Yes          | Admin    |
| DELETE | `/api/projects` | Delete a project      | Yes          | Admin/Owner |

### Tasks

| Method | Endpoint     | Description            | Auth Required | Role        |
|--------|-------------|------------------------|--------------|-------------|
| GET    | `/api/tasks` | List user's tasks      | Yes          | Any         |
| POST   | `/api/tasks` | Create a task          | Yes          | Any (with project access) |
| PATCH  | `/api/tasks` | Update task status/details | Yes      | Admin/Owner/Assignee |
| DELETE | `/api/tasks` | Delete a task          | Yes          | Admin/Owner |

### Team

| Method | Endpoint     | Description        | Auth Required |
|--------|--------------|--------------------|--------------|
| GET    | `/api/team`  | List all users     | Yes          |

### User Settings

| Method | Endpoint             | Description       | Auth Required |
|--------|----------------------|-------------------|--------------|
| GET    | `/api/user/profile`  | Get user profile  | Yes          |
| PATCH  | `/api/user/profile`  | Update profile    | Yes          |
| PATCH  | `/api/user/password` | Change password   | Yes          |

### Dashboard

| Method | Endpoint          | Description          | Auth Required |
|--------|-------------------|----------------------|--------------|
| GET    | `/api/dashboard`  | Get workspace stats  | Yes          |

---

## 🔒 Role-Based Access Control

### Admin
- ✅ Create projects
- ✅ Delete any project
- ✅ Create tasks in any accessible project
- ✅ Update any task
- ✅ Delete any task
- ✅ View all team members

### Member
- ❌ Cannot create projects
- ❌ Cannot delete projects
- ✅ Create tasks in projects they belong to
- ✅ Update status of tasks assigned to them
- ❌ Cannot delete tasks
- ✅ View team members

### Access Control Implementation

```
Server-side (API routes):
  → Every API checks getServerSession() for authentication
  → Role checks enforce Admin-only operations
  → Ownership checks ensure users can only access their data

Client-side (UI):
  → "New Project" button only shown to Admins
  → Delete icons only shown to Admins/Owners
  → Sidebar shows user role next to their name
```

---

## 📄 Pages & Workflow

### 1. Signup (`/signup`)
New users register with name, email, password, and role (Admin/Member). On successful registration, the user is automatically logged in and redirected to the dashboard.

### 2. Login (`/login`)
Existing users log in with email and password. On success, a JWT session is created and the user is redirected to the dashboard.

### 3. Dashboard (`/`)
Displays real-time workspace statistics fetched from the database:
- Stat cards (Projects, In Progress, Completed, Overdue)
- Recent tasks table with status and priority
- Project progress bars with completion percentages

### 4. Projects (`/projects`)
- Grid layout showing all projects the user has access to
- Each project card shows: name, owner, description, progress bar, task count
- Admin users can create new projects via a modal dialog
- Admin/Owner can delete projects (with confirmation)
- Search bar to filter projects by name

### 5. My Tasks (`/tasks`)
- Table showing all tasks with columns: Task, Project, Assignee, Priority, Due Date, Status
- Filter tabs: All / Todo / In Progress / Completed (with counts)
- Inline status dropdown to change task status directly
- Create new tasks via modal (with project selection, assignee, priority, due date)
- Admin can delete tasks

### 6. Team (`/team`)
- Stats cards showing total members, admins, and member counts
- Table listing all registered users with their role, project count, task count, and join date
- Current user is marked with "(You)"

### 7. Settings (`/settings`)
Four functional tabs:
- **Profile**: Edit name and email (saved to database via API)
- **Security**: Change password with current password verification
- **Notifications**: Toggle 6 notification preferences (saved locally)
- **Appearance**: Theme selection (Light/Dark/System)

---

## 🔄 Typical User Workflow

```
1. Admin signs up → Auto-login → Dashboard (empty state)
         ↓
2. Admin creates a project → "Website Redesign"
         ↓
3. Admin creates tasks → Assigns to team members
         ↓
4. Members sign up/login → See assigned tasks
         ↓
5. Members update task status → Todo → In Progress → Completed
         ↓
6. Dashboard auto-updates → Shows real-time progress
         ↓
7. Admin tracks overdue tasks → Takes action
```

---

## ✅ Validations

### Server-Side
- Email uniqueness check on signup
- Password minimum length (6 characters)
- Required field validation (name, email, project name, task title)
- Project access verification before task creation
- Role-based permission checks on all write operations
- Current password verification before password change

### Client-Side
- Form validation with error messages
- Loading states with disabled buttons
- Confirmation dialogs before delete operations
- Empty state handling with helpful messages

---

## 📝 Notes

- The database file (`prisma/dev.db`) is auto-created by Prisma
- Sessions use JWT strategy (stored client-side, no server session storage needed)
- The `@/` import alias maps to the project root (configured in `jsconfig.json`)
- All API routes return proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
