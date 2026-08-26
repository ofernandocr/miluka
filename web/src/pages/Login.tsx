import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { PiggyBank } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function Login() {
  const { user, signIn, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState("")

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      await signIn(email, password)
      navigate("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError("")
    try {
      await resetPassword(forgotEmail)
      setForgotSent(true)
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : "Failed to send reset email")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <PiggyBank className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your miLuka account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby={error ? "auth-error" : undefined}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive" role="alert" id="auth-error">{error}</p>}
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="mt-3 w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Forgot your password?
          </button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              {forgotSent
                ? "Check your email for a link to reset your password."
                : "Enter your email and we'll send you a link to reset your password."}
            </DialogDescription>
          </DialogHeader>
          {!forgotSent && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              {forgotError && <p className="text-sm text-destructive">{forgotError}</p>}
              <DialogFooter>
                <Button type="submit" className="w-full">
                  Send reset link
                </Button>
              </DialogFooter>
            </form>
          )}
          {forgotSent && (
            <DialogFooter>
              <Button onClick={() => { setForgotOpen(false); setForgotSent(false); setForgotEmail("") }} className="w-full">
                Done
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
