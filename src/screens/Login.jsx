import { useState, useEffect } from "react";
import { auth } from "../firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate=useNavigate()
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  const login = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Login Success");
      navigate("/home")
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">

      <div className="w-full max-w-md">

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">

          <div className="text-center mb-8">
            <h1 className="text-5xl font-black text-violet-500 mb-3">
              IMPOSTER
            </h1>

            <p className="text-slate-400">
              ACCA & CMA Study Game
            </p>
          </div>

          <div className="space-y-5">

            <div>
              <label className="text-slate-300 text-sm block mb-2">
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-slate-300 text-sm block mb-2">
                Password
              </label>

              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white outline-none focus:border-violet-500"
              />
            </div>

            <button
              onClick={login}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-2xl font-bold transition"
            >
              Login
            </button>

            <button
            onClick={()=>navigate("/register")}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold transition"
            >
              Create Account
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;