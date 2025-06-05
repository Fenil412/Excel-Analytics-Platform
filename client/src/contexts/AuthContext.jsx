import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Add axios configuration
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
axios.defaults.timeout = 10000;

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // ✅ OTP states
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState("");

  const navigate = useNavigate();

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Check if token is valid on initial load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Check if token is expired
        const decodedToken = parseJwt(token);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
          // Token is expired
          logout();
          return;
        }

        // Get user profile to verify token
        const response = await axios.get(`/api/user/profile`);
        setUser(response.data);
      } catch (error) {
        console.error("Token verification failed:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Helper function to parse JWT without external library
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  };

  const register = async (userData) => {
    try {
      console.log("Attempting registration with:", userData);
      const response = await axios.post("/api/auth/register", userData);
      console.log("Registration response:", response.data);
      return {
        success: true,
        message: "Account created successfully. Please sign in.",
      };
    } catch (error) {
      console.error("Registration failed:", error);
      console.error("Error response:", error.response?.data);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
      };
    }
  };

  const login = async ({ email, password }) => {
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      if (res.data.requiresOtp) {
        setRequiresTwoFactor(true);
        setEmailForOtp(email);
        return { success: false, requiresOtp: true };
      }
      return { success: false, message: "Unexpected response." };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Login error.",
      };
    }
  };

  const verifyOtp = async (otp) => {
    try {
      const res = await axios.post("/api/auth/verify-otp", {
        email: emailForOtp,
        otp,
      });
      const { token, user } = res.data;
      setToken(token);
      setUser(user);
      setRequiresTwoFactor(false);
      setEmailForOtp("");
      localStorage.setItem("token", token);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "OTP verification failed.",
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    navigate("/signin");
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(
        `/api/user/profile`,
        profileData
      );
      setUser(response.data);
      return { success: true, message: "Profile updated successfully." };
    } catch (error) {
      console.error("Profile update failed:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Profile update failed. Please try again.",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        verifyOtp,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        requiresTwoFactor,
        setRequiresTwoFactor,
        emailForOtp,
        setEmailForOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
