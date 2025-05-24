import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../components/ui/use-toast"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { Github } from "lucide-react"

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    enable2FA: false,
  })
  const [isLoading, setIsLoading] = useState(false)

  const { register, oauthLogin } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match.",
      })
      return
    }

    setIsLoading(true)

    try {
      const { confirmPassword, ...userData } = formData
      const result = await register(userData)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Account created successfully. Please sign in.",
        })
        navigate("/signin")
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
            <h1 className="text-2xl font-bold text-center">Create an account</h1>
            <p className="text-center text-gray-600">Enter your information to create an account</p>
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
              <label htmlFor="username" className="block text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                name="username"
                placeholder="johndoe"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="enable2FA"
                name="enable2FA"
                type="checkbox"
                checked={formData.enable2FA}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="enable2FA"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Enable Two-Factor Authentication
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full px-4 py-2 text-white rounded ${
                isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <footer className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/signin" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </footer>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default SignUpPage
