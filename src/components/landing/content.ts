import {
  Building2,
  Eye,
  FileClock,
  GitBranch,
  KanbanSquare,
  Layers3,
  LockKeyhole,
  UsersRound,
} from "lucide-react";

export const FEATURES = [
  {
    icon: KanbanSquare,
    title: "Project tracking",
    description:
      "Track projects and tasks by owner, department, and delivery status.",
  },
  {
    icon: GitBranch,
    title: "Task dependencies",
    description:
      "Link prerequisite tasks and see which work must finish before the next task can start.",
  },
  {
    icon: Building2,
    title: "Department assignments",
    description:
      "Assign UI/UX, frontend, and backend teams to the same project with department-specific responsibilities.",
  },
  {
    icon: Eye,
    title: "Client visibility",
    description:
      "Let clients view their projects and the task information available to their role.",
  },
  {
    icon: FileClock,
    title: "Activity history",
    description:
      "Review task changes and daily standup summaries to follow what happened on a project.",
  },
  {
    icon: LockKeyhole,
    title: "Access permissions",
    description:
      "Control available actions by role, department, and the current task status.",
  },
];

export const ROLES = [
  {
    label: "Project Manager",
    icon: Layers3,
    description:
      "Create projects, add team members, assign tasks, and review project activity.",
    capabilities: ["Full project oversight", "Team and task management"],
  },
  {
    label: "Internal Team",
    icon: UsersRound,
    description:
      "View your department's tasks, check prerequisites, and update task status when permitted.",
    capabilities: ["Department-scoped work", "Clear blockers and priorities"],
  },
  {
    label: "Client",
    icon: Eye,
    description:
      "View your projects and the task progress shared with you through the client portal.",
    capabilities: ["Assigned project access", "Client-visible task progress"],
  },
];

export const FAQS = [
  {
    question: "What is the Project Management System?",
    answer:
      "It is a shared workspace for planning projects, coordinating teams, tracking task delivery, and keeping stakeholders informed. It brings project execution and client visibility into one connected system.",
  },
  {
    question: "Who can use the system?",
    answer:
      "The workspace supports Project Managers, internal team members, and clients. Each role receives a focused experience based on what they need to manage, update, or review.",
  },
  {
    question: "How does access control work?",
    answer:
      "Access is evaluated across three dimensions: a user's role, their department, and the current task status. This keeps actions and information aligned with each person's responsibility.",
  },
  {
    question: "What can clients see?",
    answer:
      "Clients use a dedicated portal that surfaces approved project and task information. Internal-only activity remains separated so teams can work freely while clients receive useful, relevant updates.",
  },
  {
    question: "How are task dependencies handled?",
    answer:
      "Tasks can be linked to prerequisite work. The system makes those relationships visible, helping teams understand why work is blocked and what must be completed next.",
  },
  {
    question: "Can project activity be tracked?",
    answer:
      "Yes. The system records important task activity and status changes, and also supports daily standup summaries for a clearer view of delivery over time.",
  },
  {
    question: "Does it support multiple departments?",
    answer:
      "Yes. Projects can involve multiple departments such as UI/UX, frontend, and backend, while assignments and visibility remain scoped to the right teams.",
  },
  {
    question: "How do I get started?",
    answer:
      "Create an account if registration is available for your workspace, or sign in with credentials provided by your Project Manager or system administrator.",
  },
];
