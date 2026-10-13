import { ArrowRight, ChevronDown, CircleCheckBig } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/landing/brand-mark";
import { FAQS, FEATURES, ROLES } from "@/components/landing/content";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { SectionHeading } from "@/components/landing/section-heading";
import { SectionMotion } from "@/components/landing/section-motion";
import { Workflow3D } from "@/components/landing/workflow-3d";
import { ThemeSelector } from "@/components/theme-toggle";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: {
    absolute:
      "Project Management System | Projects, tasks, and client progress",
  },
  description:
    "Manage projects, assign work across departments, track task dependencies, and share approved progress with clients.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main
      data-landing
      className="min-h-screen overflow-x-clip bg-background text-foreground"
    >
      <SectionMotion />
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-[72px] sm:px-8 lg:px-10"
          aria-label="Main navigation"
        >
          <Link href="/" aria-label="PM System home">
            <BrandMark />
          </Link>

          <div className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground lg:flex">
            <a
              className={`${styles.navLink} transition-colors hover:text-foreground`}
              href="#features"
            >
              Features
            </a>
            <a
              className={`${styles.navLink} transition-colors hover:text-foreground`}
              href="#how-it-works"
            >
              How it works
            </a>
            <a
              className={`${styles.navLink} transition-colors hover:text-foreground`}
              href="#access-control"
            >
              Access control
            </a>
            <a
              className={`${styles.navLink} transition-colors hover:text-foreground`}
              href="#faq"
            >
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeSelector className="hidden sm:flex" />
            <Link
              href="/login"
              className="hidden h-10 items-center justify-center rounded-full px-4 text-sm font-bold text-foreground transition-colors hover:bg-muted sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary-2 sm:px-5 sm:text-sm"
            >
              Get started
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </nav>
        <span className={styles.scrollProgress} aria-hidden="true" />
      </header>

      <section className="relative border-b border-border">
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-16 text-center sm:px-8 sm:pb-24 sm:pt-24 lg:px-10 lg:pb-28 lg:pt-28">
          <h1
            className={`${styles.heroTitle} mx-auto max-w-5xl text-balance text-[2.75rem] font-black leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-[5.25rem]`}
          >
            Manage projects, tasks, and
            <span className="relative mx-2 inline-block">
              client progress
              <span className="absolute inset-x-0 bottom-0.5 -z-10 h-1 bg-primary sm:h-1.5" />
            </span>
            in one place.
          </h1>

          <p
            className={`${styles.heroDescription} mx-auto mt-7 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8`}
          >
            Assign work across departments, track blocked tasks, and let clients
            follow approved project updates.
          </p>

          <div
            className={`${styles.heroActions} mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row`}
          >
            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-extrabold text-primary-foreground transition-colors hover:bg-primary-2 sm:w-auto"
            >
              Sign in to your workspace
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href="#product-preview"
              className="inline-flex h-12 w-full items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-bold shadow-sm transition-colors hover:bg-secondary sm:w-auto"
            >
              View the workspace
            </a>
          </div>

          <Workflow3D />
        </div>
      </section>

      <section
        id="product-preview"
        className="scroll-mt-24 bg-background-2 px-5 py-16 sm:px-8 sm:py-24 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Product preview"
            title="See project status and the tasks behind it."
            description="Review ongoing work, completed tasks, and dependencies across your departments."
          />
          <div data-reveal="tilt" className={styles.reveal}>
            <DashboardPreview />
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-24 border-y border-border bg-card px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="How it works"
            title="Set up a project. Assign tasks. Track delivery."
            description="Project managers organize the work, internal teams update their tasks, and clients follow the progress shared with them."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Create a project",
                description:
                  "Set up the project and add the departments and team members who will work on it.",
              },
              {
                number: "02",
                title: "Assign tasks and prerequisites",
                description:
                  "Assign owners and departments, then link the tasks that need to be completed first.",
              },
              {
                number: "03",
                title: "Review project progress",
                description:
                  "Follow task status internally and let clients view the progress available to their role.",
              },
            ].map((step, index) => (
              <article
                data-reveal="slide"
                data-motion-order={index}
                key={step.number}
                className={`${styles.card} ${styles.reveal} group rounded-[1.5rem] border border-border bg-background p-6 hover:border-primary/60 sm:p-8`}
              >
                <div className="mb-6">
                  <span className="font-mono text-xs font-bold text-muted-foreground">
                    STEP {step.number}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Features"
            title="Projects, dependencies, and permissions."
            description="Manage assignments, dependencies, permissions, and project history from the same workspace."
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <article
                data-reveal="scale"
                data-motion-order={index}
                key={feature.title}
                className={`${styles.card} ${styles.reveal} rounded-2xl border border-border bg-card p-6 sm:p-7`}
              >
                <feature.icon
                  className="mb-6 size-5 text-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-xl font-extrabold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="access-control"
        className="scroll-mt-24 border-y border-border bg-background-2 px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div
            data-reveal="rise"
            className="mb-12 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end"
          >
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Access control
              </p>
              <h2 className="text-balance text-3xl font-bold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                What each role can manage and view.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base lg:justify-self-end">
              A user's role, department, and the task's current status determine
              which information they can see and which actions they can take.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {ROLES.map((role, index) => (
              <article
                data-reveal="tilt"
                data-motion-order={index}
                key={role.label}
                className={`${styles.card} ${styles.reveal} rounded-2xl border border-border bg-card p-6 sm:p-8`}
              >
                <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <role.icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-extrabold">{role.label}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {role.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {role.capabilities.map((capability) => (
                    <li
                      key={capability}
                      className="flex items-center gap-2 text-xs font-bold"
                    >
                      <CircleCheckBig
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      />
                      {capability}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="scroll-mt-24 border-b border-border bg-card px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div data-reveal="slide">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              FAQ
            </p>
            <h2 className="text-balance text-3xl font-bold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
              Questions about the workspace.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
              A quick guide to how projects, permissions, dependencies, and
              client visibility work together.
            </p>
          </div>

          <div
            className={`${styles.reveal} divide-y divide-border border-y border-border`}
          >
            {FAQS.map((faq, index) => (
              <details
                data-reveal="rise"
                data-motion-order={index % 3}
                key={faq.question}
                className={`${styles.faqItem} group`}
                open={index === 0}
              >
                <summary className="flex min-h-16 cursor-pointer list-none items-center gap-4 py-5 text-left text-sm font-extrabold marker:hidden sm:text-base [&::-webkit-details-marker]:hidden">
                  <span className="font-mono text-[10px] font-bold text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">{faq.question}</span>
                  <ChevronDown
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </summary>
                <p className="pb-6 pl-9 pr-8 text-sm leading-7 text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        <div
          data-reveal="scale"
          className={`${styles.reveal} relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-center text-primary-foreground sm:px-10 sm:py-20`}
        >
          <div className="relative">
            <h2 className="mx-auto max-w-3xl text-balance text-3xl font-bold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
              Start managing your next project.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 opacity-70 sm:text-base">
              Create an account, or sign in to continue working with your team.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary-foreground px-6 text-sm font-extrabold text-primary shadow-sm transition-opacity hover:opacity-90 sm:w-auto"
              >
                Create an account
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-primary-foreground/25 px-6 text-sm font-extrabold transition-colors hover:bg-primary-foreground/10 sm:w-auto"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card px-5 py-8 sm:px-8 lg:px-10">
        <div
          data-reveal="rise"
          className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <BrandMark />
          <p className="text-xs leading-5 text-muted-foreground">
            Projects, tasks, and client updates.
          </p>
          <div className="flex items-center gap-5 text-xs font-bold">
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="/register"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
