import type { Metadata, Viewport } from 'next' // 1. Added Viewport type
import Script from "next/script";
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/auth-context'
import { CartProvider } from '@/lib/cart-context'
import { Header } from '@/components/Header'
import { Suspense } from 'react' // Import Suspense

const inter = Inter({ subsets: ['latin'] })

// 2. Extracted viewport into its own export to fix terminal warnings
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Lease - Student Rental Marketplace',
  description: 'Rent and lend items securely within your campus community. Student-only rental marketplace starting in Kanpur.',
  keywords: 'rental, marketplace, students, campus, kanpur, india',
  authors: [{ name: 'Lease Team' }],
  // Viewport removed from here
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* 3. Razorpay Script must be inside the body to work with afterInteractive */}
        <Script
          id="razorpay-checkout-script"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <CartProvider>
              <Suspense>
                <Header />
              </Suspense>
              <main className="flex-1">
                <Suspense>
                  {children}
                </Suspense>
              </main>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                }}
              />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}