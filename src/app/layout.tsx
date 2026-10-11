import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://nodewave-frontend-plum.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Project Management System | Deliverables & Client Visibility",
    template: "%s | Project Management System",
  },
  description:
    "Operational backbone for managing high-value project deliverables with state-based permissions, cross-department dependencies, and client visibility.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "Project Management System | Deliverables & Client Visibility",
    description:
      "Operational backbone for managing high-value project deliverables with state-based permissions, cross-department dependencies, and client visibility.",
    url: baseUrl,
    siteName: "Project Management System",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Management System | Deliverables & Client Visibility",
    description:
      "Operational backbone for managing high-value project deliverables with state-based permissions, cross-department dependencies, and client visibility.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Project Management System",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: baseUrl,
      description:
        "Operational backbone for managing high-value project deliverables with state-based permissions, cross-department dependencies, and client visibility.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Dependency-aware task board",
        "Cross-department prerequisite blocking",
        "Optimistic concurrency control with row versioning",
        "State-based client visibility portal",
        "Dual-layer immutable audit trail",
        "Daily standup summaries",
      ],
    },
    {
      "@type": "Organization",
      name: "Project Management System Enterprise",
      url: baseUrl,
      logo: `${baseUrl}/favicon.ico`,
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Schema.org structured data
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: theme flash prevention script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('pms-theme');var isDark=t==='dark'||(!t&&true)||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(t==='light'||(t==='system'&&!window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}else{document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');document.documentElement.style.colorScheme='dark';}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${inter.className} ${inter.variable}`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
