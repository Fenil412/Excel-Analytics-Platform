import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../components/ui/use-toast"
import { Eye, EyeOff } from "lucide-react"

const SignInPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false);
  const { login} = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields.",
      });
    }

    setIsLoading(true);

    const result = await login({ email, password });

    setIsLoading(false);

    if (result.success) return; // not expected in OTP flow

    if (result.requiresOtp) {
      toast({
        title: "OTP Sent",
        description: "Check your email for the OTP.",
      });
      navigate("/verify-otp");
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: result.message,
      });
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md px-6 py-8 border rounded-lg shadow-md bg-white">
          <header className="space-y-1 mb-6">
            <h1 className="text-2xl font-bold text-center">Sign In</h1>
            <p className="text-center text-gray-600">
              Enter your credentials to access your account
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
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

           <div>
  <label htmlFor="password" className="block text-sm font-medium mb-1">
    Password
  </label>
  <div className="relative">
    <input
      id="password"
      type={showPassword ? "text" : "password"}
      placeholder="••••••••"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  </div>
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
            Don’t have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </footer>
        </div>
      </main>

    </div>
  )
}

export default SignInPage
