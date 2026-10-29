import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { MessProvider } from '@/context/MessContext';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Smart Mess - Shared Bachelor Mess Management System',
  description: 'Production-ready financial dashboard and meal management for bachelor messes in Bangladesh',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased light">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <AuthProvider>
          <MessProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '13px',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </MessProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
