import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloudGuard AI | The Autonomous Cloud Security Intelligence Platform",
  description: "CloudGuard AI is a next-generation AI-native Cloud Security Operating System designed to understand, explain, predict, and autonomously protect cloud infrastructure.",
  keywords: ["Cloud Security", "AI Security", "Cybersecurity", "Autonomous Security", "DevSecOps", "EKS", "AWS", "Digital Twin"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
