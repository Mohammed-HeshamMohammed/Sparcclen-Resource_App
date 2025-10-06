import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface AuthErrorProps {
  error?: string
}

export default function AuthError({ error }: AuthErrorProps) {
  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sorry, something went wrong.</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-sm text-muted-foreground">
                Code error: {error}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">An unspecified error occurred.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
