import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../components/ui/use-toast"
import Header from "../components/Header"
import Footer from "../components/Footer"

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)

  const { verifyOtp, requiresTwoFactor } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!requiresTwoFactor) {
      navigate("/signin")
    }
  }, [requiresTwoFactor, navigate])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await verifyOtp(otp)

      if (result.success) {
        toast({
          title: "Success",
          description: "Two-factor authentication successful.",
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

  const handleResendOtp = () => {
    // In a real app, trigger resend OTP API here
    toast({
      title: "OTP Sent",
      description: "A new OTP has been sent to your email or phone.",
    })
    setCountdown(60)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4 bg-white shadow-md rounded-lg p-6">
          <header className="space-y-1 mb-6">
            <h1 className="text-2xl font-bold text-center">Two-Factor Authentication</h1>
            <p className="text-center text-gray-500">Enter the verification code sent to your device</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                maxLength={6}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 rounded-md text-white font-semibold ${
                isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </button>
          </form>

          <footer className="mt-6 text-center text-sm text-gray-600">
            <p>
              Didn't receive a code?{" "}
              {countdown > 0 ? (
                <span>Resend in {countdown} seconds</span>
              ) : (
                <button
                  onClick={handleResendOtp}
                  className="text-blue-600 hover:underline font-medium focus:outline-none"
                >
                  Resend code
                </button>
              )}
            </p>
          </footer>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default VerifyOtpPage
