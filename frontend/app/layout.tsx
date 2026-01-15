import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from '../components/providers/Web3Provider';
import BackgroundLogo from '../components/BackgroundLogo';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BlackBox - Privacy-Preserving Compliance",
  description: "Privacy-preserving compliance and audit system for Mantle Network",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
          <BackgroundLogo />
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
