import { createContext, useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL;
const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("token") || null)
  const [loading, setLoading] = useState(true)
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [tempCredentials, setTempCredentials] = useState(null)

  const navigate = useNavigate()

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common["Authorization"]
    }
  }, [token])

  // Check if token is valid on initial load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        // Check if token is expired
        const decodedToken = parseJwt(token)
        const currentTime = Date.now() / 1000

        if (decodedToken.exp < currentTime) {
          // Token is expired
          logout()
          return
        }

        // Verify token with backend
        const response = await axios.get(`${API_URL}/api/auth/verify`)
        setUser(response.data.user)
      } catch (error) {
        console.error("Token verification failed:", error)
        logout()
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [token])

  // Helper function to parse JWT without external library
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1]))
    } catch (e) {
      return null
    }
  }

  const login = async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, credentials)

      // Check if 2FA is required
      if (response.data.requiresTwoFactor) {
        setRequiresTwoFactor(true)
        setTempCredentials(credentials)
        return { success: true, requiresTwoFactor: true }
      }

      // Normal login flow
      const { token, user } = response.data
      setToken(token)
      setUser(user)
      localStorage.setItem("token", token)

      return { success: true }
    } catch (error) {
      console.error("Login failed:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Login failed. Please try again.",
      }
    }
  }

  const verifyOtp = async (otp) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        ...tempCredentials,
        otp,
      })

      const { token, user } = response.data
      setToken(token)
      setUser(user)
      localStorage.setItem("token", token)
      setRequiresTwoFactor(false)
      setTempCredentials(null)

      return { success: true }
    } catch (error) {
      console.error("OTP verification failed:", error)
      return {
        success: false,
        message: error.response?.data?.message || "OTP verification failed. Please try again.",
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, userData)
      return { success: true, message: response.data.message }
    } catch (error) {
      console.error("Registration failed:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed. Please try again.",
      }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("token")
    navigate("/signin")
  }

  const oauthLogin = async (provider) => {
    // Open OAuth provider login window
    window.open(`${API_URL}/api/auth/${provider}`, "_self")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        requiresTwoFactor,
        login,
        register,
        logout,
        verifyOtp,
        oauthLogin,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
