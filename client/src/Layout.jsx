import Header from "./components/Header";
import Footer from "./components/Footer";
import { Outlet } from "react-router-dom";

function Layout() {

  return (
    <div className="relative min-h-screen">
      
      {/* Page Structure */}
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}

export default Layout;
