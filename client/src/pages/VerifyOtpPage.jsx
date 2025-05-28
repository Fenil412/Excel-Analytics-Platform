import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/use-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { verifyOtp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast({ variant: "destructive", title: "Missing OTP" });
      return;
    }

    setIsLoading(true);
    const result = await verifyOtp(otp);
    setIsLoading(false);

    if (result.success) {
      toast({ title: "OTP Verified", description: "Signed in successfully." });
      navigate("/dashboard");
    } else {
      toast({ variant: "destructive", title: "Invalid OTP", description: result.message });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md bg-white border p-6 rounded shadow">
          <h1 className="text-2xl font-bold text-center mb-4">Verify OTP</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              required
              className="w-full px-3 py-2 border rounded"
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full text-white py-2 rounded ${
                isLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VerifyOtpPage;
