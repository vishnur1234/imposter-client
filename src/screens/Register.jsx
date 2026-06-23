import { useState } from "react";
import { auth } from "../firebase/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate=useNavigate();

  const register = async () => {
    try {
      const user = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log(user.user);
      alert("Account Created");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">

          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white mb-2">
              Create Account
            </h1>

            <p className="text-slate-400">
              Join the Imposter Game
            </p>
          </div>

          <div className="space-y-5">

            <div>
              <label className="block text-slate-300 mb-2 font-medium">
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 outline-none focus:border-violet-500 transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-2 font-medium">
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 outline-none focus:border-violet-500 transition"
              />
            </div>

            <button
              onClick={register}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-xl font-bold text-lg transition"
            >
              Create Account
            </button>

          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-400">
              Already have an account?
            </p>

            <button
            onClick={()=>navigate('/')}
              className="mt-2 text-violet-400 hover:text-violet-300 font-semibold"
            >
              Login Here
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Register;