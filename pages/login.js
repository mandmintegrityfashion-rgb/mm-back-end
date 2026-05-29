"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
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
  const [isForgotPin, setIsForgotPin] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: enter code + new pin
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const router = useRouter();

  const parseJsonSafely = async (res) => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  const handleNumberClick = (num) => {
    if (isForgotPin && forgotStep === 2) {
      setNewPin((prev) => prev + num);
    } else {
      setPin((prev) => prev + num);
    }
  };
  const handleDelete = () => {
    if (isForgotPin && forgotStep === 2) {
      setNewPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  };
  const handleClear = () => {
    if (isForgotPin && forgotStep === 2) {
      setNewPin("");
    } else {
      setPin("");
    }
  };

  const toCamelCase = (str) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase());

  const handleUsernameChange = (e) => {
    setUsername(toCamelCase(e.target.value));
  };

  const handleForgotSubmit = async () => {
    setLoading(true);
    try {
      if (forgotStep === 1) {
        const res = await fetch("/api/auth/forgot-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail }),
        });
        const data = await parseJsonSafely(res);
        if (res.ok && data.ok) {
          alert("Reset code sent to your email!");
          setForgotStep(2);
        } else {
          alert(data.error || "Failed to send reset code.");
        }
      } else {
        const res = await fetch("/api/auth/reset-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail, resetCode, newPin }),
        });
        const data = await parseJsonSafely(res);
        if (res.ok && data.ok) {
          alert("PIN reset successful! Please log in with your new PIN.");
          setIsForgotPin(false);
          setForgotStep(1);
          setForgotEmail("");
          setResetCode("");
          setNewPin("");
        } else {
          alert(data.error || "Failed to reset PIN.");
        }
      }
    } catch (error) {
      alert("Unable to complete the PIN reset request right now.");
    } finally {
      setLoading(false);
    }
  };

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

      const data = await parseJsonSafely(res);

      if (res.ok && data.ok) {
        if (isRegister) {
          alert("Registration successful! Please log in.");
          setIsRegister(false);
        } else {
          try {
            await router.replace("/");
          } catch {
            window.location.replace("/");
          }
        }
        setUsername("");
        setEmail("");
        setPin("");
      } else {
        alert(data.error || "Something went wrong.");
      }
    } catch (error) {
      alert("Unable to complete login right now. Please try again.");
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
        <div className="absolute bottom-0 right-0 w-full h-full">
          <Image
            src="/images/login_model.png"
            alt="M&M Fashion Model"
            fill
            priority
            sizes="50vw"
            className="object-cover opacity-90"
          />
        </div>

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
            {isForgotPin
              ? "Reset Your PIN"
              : isRegister
              ? "Create an Account"
              : "Welcome Back"}
          </h2>
          <p className="text-center text-gray-500 mb-10">
            {isForgotPin
              ? forgotStep === 1
                ? "Enter your registered email to receive a reset code."
                : "Enter the code from your email and set a new PIN."
              : isRegister
              ? "Join M&M Fashion and discover timeless designs."
              : "Log in to continue your style journey."}
          </p>

          {isForgotPin ? (
            <div className="space-y-5">
              {forgotStep === 1 ? (
                <>
                  <input
                    type="email"
                    placeholder="Registered Email Address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border border-gray-300 text-center ${inter.className} text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm bg-white/90`}
                  />
                  <button
                    onClick={handleForgotSubmit}
                    disabled={loading || !forgotEmail}
                    className={`w-full py-3 px-4 rounded-xl font-semibold shadow-lg text-white transition-all ${
                      loading || !forgotEmail
                        ? "bg-blue-300 cursor-not-allowed"
                        : "bg-[#2563eb] hover:bg-[#1e40af]"
                    }`}
                  >
                    {loading ? "Sending..." : "Send Reset Code"}
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="6-digit Reset Code"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className={`w-full px-4 py-3 rounded-xl border border-gray-300 text-center tracking-[0.4em] ${inter.className} text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm bg-white/90`}
                  />
                  <input
                    type="password"
                    placeholder="New PIN"
                    value={newPin}
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
                        className="bg-gradient-to-b from-blue-50 to-white border border-blue-100 text-[#0a1e40] py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-blue-500 hover:text-white active:scale-90 active:shadow-inner active:from-blue-700 active:to-blue-600 active:text-white transition-all duration-150 shadow-sm select-none"
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleForgotSubmit}
                    disabled={loading || !resetCode || !newPin}
                    className={`w-full py-3 px-4 rounded-xl font-semibold shadow-lg text-white transition-all ${
                      loading || !resetCode || !newPin
                        ? "bg-blue-300 cursor-not-allowed"
                        : "bg-[#2563eb] hover:bg-[#1e40af]"
                    }`}
                  >
                    {loading ? "Resetting..." : "Reset PIN"}
                  </button>
                </>
              )}

              <p className="mt-4 text-center text-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPin(false);
                    setForgotStep(1);
                    setForgotEmail("");
                    setResetCode("");
                    setNewPin("");
                  }}
                  className="text-blue-700 font-semibold hover:underline"
                >
                  Back to Login
                </button>
              </p>
            </div>
          ) : (
          <>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={handleUsernameChange}
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
                  className="bg-gradient-to-b from-blue-50 to-white border border-blue-100 text-[#0a1e40] py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-blue-500 hover:text-white active:scale-90 active:shadow-inner active:from-blue-700 active:to-blue-600 active:text-white transition-all duration-150 shadow-sm select-none"
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

          {/* Forgot PIN link */}
          {!isRegister && (
            <p className="mt-3 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPin(true);
                  setForgotStep(1);
                  setPin("");
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot PIN?
              </button>
            </p>
          )}

          {/* Switch link */}
          <p className="mt-8 text-center text-gray-700">
            {isRegister
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button
              type="button"
              disabled={loading}
              onClick={() => setIsRegister((prev) => !prev)}
              className="text-blue-700 font-semibold hover:underline disabled:opacity-50"
            >
              {isRegister ? "Login" : "Register"}
            </button>
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
