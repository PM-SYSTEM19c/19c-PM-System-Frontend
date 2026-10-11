import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Register a new account to collaborate on project deliverables and tasks.",
  alternates: {
    canonical: "/register",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
