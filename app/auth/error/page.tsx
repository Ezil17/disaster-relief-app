import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle, Package } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ReliefTrack
            </h1>
          </div>
          <Card className="border-2">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Authentication Error</CardTitle>
              <CardDescription className="text-center">Something went wrong during authentication.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
                <p className="text-muted-foreground">Please try again or contact support if the problem persists.</p>
              </div>
              <div className="flex gap-3">
                <Button asChild className="flex-1 h-11 bg-transparent" variant="outline">
                  <Link href="/auth/sign-up">Sign Up</Link>
                </Button>
                <Button asChild className="flex-1 h-11 bg-gradient-to-r from-primary to-secondary">
                  <Link href="/auth/login">Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
