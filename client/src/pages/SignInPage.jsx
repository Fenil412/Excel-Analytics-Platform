import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../components/ui/use-toast"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { Github } from "lucide-react"

const SignInPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { login, oauthLogin } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await login({ email, password })

      if (result.success) {
        if (result.requiresTwoFactor) {
          navigate("/verify-otp")
          return
        }

        toast({
          title: "Success",
          description: "You have successfully signed in.",
        })
        navigate("/dashboard")
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = (provider) => {
    oauthLogin(provider)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4 border rounded-lg shadow-md">
          <header className="space-y-1 mb-6">
            <h1 className="text-2xl font-bold text-center">Sign In</h1>
            <p className="text-center text-gray-600">Enter your credentials to access your account</p>
          </header>

          <div className="grid gap-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2 border rounded hover:bg-gray-100"
                onClick={() => handleOAuthLogin("google")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8" />
                  <path d="M8 12h8" />
                </svg>
                Google
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2 border rounded hover:bg-gray-100"
                onClick={() => handleOAuthLogin("github")}
              >
                <Github className="h-4 w-4" />
                GitHub
              </button>
            </div>

            <div className="relative flex items-center my-4">
              <hr className="flex-grow border-gray-300" />
              <span className="px-3 text-xs uppercase text-gray-500 bg-white">Or continue with</span>
              <hr className="flex-grow border-gray-300" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full px-4 py-2 text-white rounded ${
                isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <footer className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </footer>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default SignInPage
