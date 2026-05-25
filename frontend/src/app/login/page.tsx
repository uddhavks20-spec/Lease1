"use client"

// 1. Added FormEvent to the import list
import React, { useState, FormEvent } from 'react' 
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // 2. Used the imported FormEvent directly instead of React.FormEvent
  const onSubmit = async (e: any) => {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div className="container py-10 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label block text-sm font-medium mb-1">Email</label>
          <input 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
          />
        </div>
        <div>
          <label className="label block text-sm font-medium mb-1">Password</label>
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button disabled={isLoading} className="w-full" type="submit">
          {isLoading ? 'Signing in...' : 'Login'}
        </Button>
      </form>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <strong>Demo accounts:</strong><br />
        Admin: admin@campusrent.in / admin123<br />
        Seller: seller@campusrent.in / seller123
      </div>
    </div>
  )
}