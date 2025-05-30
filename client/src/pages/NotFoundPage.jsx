import { Link } from "react-router-dom"

const NotFoundPage = () => {
  return (
    <div className="flex flex-col min-h-screen">

      <main className="flex-1 flex items-center justify-center">
        <div className="container flex flex-col items-center justify-center px-5 text-center">
          <h1 className="text-9xl font-extrabold tracking-widest">404</h1>
          <div className="bg-primary px-2 text-sm rounded rotate-12 absolute text-white">Page Not Found</div>
          <p className="text-xl mt-8 mb-8">Oops! The page you're looking for doesn't exist.</p>
          <Link to="/">
            <button>Go to Home</button>
          </Link>
        </div>
      </main>

    </div>
  )
}

export default NotFoundPage
