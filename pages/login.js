"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function Login() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNumberClick = (num) => setPin((prev) => prev + num);
  const handleDelete = () => setPin((prev) => prev.slice(0, -1));
  const handleClear = () => setPin("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister
        ? { username, email, pin }
        : { username, pin };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.ok) {
        if (isRegister) {
          alert("Registration successful! Please log in.");
          setIsRegister(false);
        } else {
          router.push("/");
        }
        setUsername("");
        setEmail("");
        setPin("");
      } else {
        alert(data.error || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-tr from-[#e6efff] via-[#f6f9ff] to-[#dce8ff] text-[#1a1a1a] overflow-hidden relative">
      {/* Background section (Left Side) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center brightness-90"
          style={{ backgroundImage: "url('/images/login_bg.png')" }}
        ></div>

        {/* Model image overlay */}
        <img
          src="/images/login_model.png"
          alt="M&M Fashion Model"
          className="absolute bottom-0 right-0 w-full h-full object-cover opacity-90"
        />

        {/* Brand overlay text */}
        <div className="absolute z-10 text-center text-white drop-shadow-lg">
          <h1
            className={`${playfair.className} text-6xl font-extrabold tracking-tight`}
          >
            M&M <span className="text-[#93c5fd]">Fashion</span>
          </h1>
          <p className="text-lg mt-2 font-light">
            Where Elegance Meets Confidence
          </p>
        </div>
      </div>

      {/* Form section (Right Side) */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-8 sm:px-12 lg:px-20 py-10 bg-white/70 backdrop-blur-xl shadow-2xl relative z-20">
        <div className="max-w-md mx-auto w-full">
          <h2
            className={`${playfair.className} text-4xl font-bold text-center text-[#0a1e40] mb-3`}
          >
            {isRegister ? "Create an Account" : "Welcome Back"}
          </h2>
          <p className="text-center text-gray-500 mb-10">
            {isRegister
              ? "Join M&M Fashion and discover timeless designs."
              : "Log in to continue your style journey."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border border-gray-300 text-center ${inter.className} text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm bg-white/90`}
            />

            {/* Email (only for registration) */}
            {isRegister && (
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border border-gray-300 text-center ${inter.className} text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm bg-white/90`}
              />
            )}

            {/* PIN field */}
            <input
              type="password"
              placeholder="PIN"
              value={pin}
              readOnly
              className={`w-full px-4 py-3 rounded-xl border border-gray-300 text-center tracking-[0.6em] ${inter.className} text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm bg-white/90`}
            />

            {/* Number keypad */}
            <div className="grid grid-cols-3 gap-3 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "Clear", 0, "Del"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    if (item === "Del") handleDelete();
                    else if (item === "Clear") handleClear();
                    else handleNumberClick(item);
                  }}
                  className="bg-gradient-to-b from-blue-50 to-white border border-blue-100 text-[#0a1e40] py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-blue-500 hover:text-white transition-all shadow-sm"
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-semibold shadow-lg text-white transition-all ${
                loading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-[#2563eb] hover:bg-[#1e40af]"
              }`}
            >
              {loading
                ? isRegister
                  ? "Registering..."
                  : "Logging in..."
                : isRegister
                ? "Register"
                : "Login"}
            </button>
          </form>

          {/* Switch link */}
          <p className="mt-8 text-center text-gray-700">
            {isRegister
              ? "Already have an account?"
              : "Don’t have an account?"}{" "}
            <button
              type="button"
              disabled={loading}
              onClick={() => setIsRegister((prev) => !prev)}
              className="text-blue-700 font-semibold hover:underline disabled:opacity-50"
            >
              {isRegister ? "Login" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
