"use client"

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
  const { register, isLoading } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const onSubmit = async (e: any) => {
    e.preventDefault()
    await register({ firstName, lastName, email, password, role: 'renter' })
  }

  return (
    <div className="container py-10 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Create Account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">First Name</label>
          <input className="input-field" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="label">Last Name</label>
          <input className="input-field" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button disabled={isLoading} className="w-full" type="submit">
          {isLoading ? 'Creating...' : 'Sign Up'}
        </Button>
      </form>
    </div>
  )
}
