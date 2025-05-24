import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { Moon, Sun, Menu, X } from "lucide-react"

const Header = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const buttonBase = "px-4 py-2 rounded-md text-sm font-medium transition-colors"
  const buttonGhost = `${buttonBase} bg-transparent hover:bg-accent hover:text-accent-foreground`
  const buttonSolid = `${buttonBase} bg-primary text-white hover:bg-primary/90`
  const buttonIcon = "p-2 rounded-full hover:bg-accent"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xl font-bold">
            SecureApp
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary">
            Home
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium hover:text-primary">
                Dashboard
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-sm font-medium hover:text-primary">
                  Admin
                </Link>
              )}
              <button className={buttonGhost} onClick={logout}>
                Logout
              </button>
              <span className="text-sm font-medium">Hi, {user?.username || "User"}</span>
            </>
          ) : (
            <>
              <Link to="/signin" className="text-sm font-medium hover:text-primary">
                Sign In
              </Link>
              <Link to="/signup">
                <button className={buttonSolid}>Sign Up</button>
              </Link>
            </>
          )}
          <button className={buttonIcon} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <button className={buttonIcon} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button className={buttonIcon} onClick={toggleMenu} aria-label="Toggle menu">
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="container md:hidden py-4 border-t">
          <nav className="flex flex-col space-y-4">
            <Link to="/" className="text-sm font-medium hover:text-primary" onClick={toggleMenu}>
              Home
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium hover:text-primary" onClick={toggleMenu}>
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="text-sm font-medium hover:text-primary" onClick={toggleMenu}>
                    Admin
                  </Link>
                )}
                <button
                  className={buttonGhost}
                  onClick={() => {
                    logout()
                    toggleMenu()
                  }}
                >
                  Logout
                </button>
                <span className="text-sm font-medium">Hi, {user?.username || "User"}</span>
              </>
            ) : (
              <>
                <Link to="/signin" className="text-sm font-medium hover:text-primary" onClick={toggleMenu}>
                  Sign In
                </Link>
                <Link to="/signup" onClick={toggleMenu}>
                  <button className={buttonSolid}>Sign Up</button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header
