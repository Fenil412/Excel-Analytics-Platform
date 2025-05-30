import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const HomePage = () => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex flex-col min-h-screen">

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Secure Authentication & Dashboard Solution
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  A complete authentication system with JWT, 2FA, and OAuth integration.
                </p>
              </div>
              <div className="space-x-4">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="inline-block px-6 py-3 text-white bg-primary hover:bg-primary/90 rounded-md text-lg font-medium transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/signin"
                      className="inline-block px-6 py-3 text-primary border border-primary rounded-md text-lg font-medium transition-colors hover:bg-primary hover:text-white"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="inline-block px-6 py-3 text-white bg-primary hover:bg-primary/90 rounded-md text-lg font-medium transition-colors"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-16 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 md:gap-10 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 border p-6 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Secure Authentication</h3>
                <p className="text-center text-muted-foreground">
                  JWT-based authentication with secure token handling and storage.
                </p>
              </div>

              <div className="flex flex-col items-center space-y-2 border p-6 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Two-Factor Authentication</h3>
                <p className="text-center text-muted-foreground">
                  Enhanced security with optional two-factor authentication.
                </p>
              </div>

              <div className="flex flex-col items-center space-y-2 border p-6 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">OAuth Integration</h3>
                <p className="text-center text-muted-foreground">
                  Sign in with popular providers like Google, Facebook, and GitHub.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  )
}

export default HomePage
