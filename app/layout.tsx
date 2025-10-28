// app/layout.tsx
import './globals.css';
import Providers from './providers'; // if you have one; otherwise remove

export const metadata = {
  title: 'IDS Supplier Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* DO NOT put AppShell/Sidebar here */}
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
