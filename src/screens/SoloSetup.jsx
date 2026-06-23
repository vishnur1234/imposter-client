import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateTopic } from "../generateTopic";


function SoloSetup() {
 const navigate = useNavigate();

  const [course, setCourse] = useState("ACCA");
  const [players, setPlayers] = useState(4);


const startGame = async () => {
    try {
      const topic = await generateTopic(course);

      navigate("/reveal", {
        state: {
          course,
          players,
          topic,
        },
      });
    } catch (error) {
      console.log(error);
      alert("Failed to generate topic");
    }
  };


  

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      <div className="max-w-md mx-auto">

        <h1 className="text-4xl font-black mb-8">
          Solo Mode
        </h1>

        <div className="bg-slate-900 p-5 rounded-3xl mb-5">
          <label className="block mb-2">
            Select Course
          </label>

          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-800"
          >
            <option>ACCA</option>
            <option>CMA</option>
          </select>
        </div>

        <div className="bg-slate-900 p-5 rounded-3xl mb-5">
          <label className="block mb-2">
            Number of Players
          </label>

          <input
            type="number"
            min={3}
            max={10}
            value={players}
            onChange={(e) => setPlayers(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-800"
          />
        </div>

        <button
          onClick={startGame}
          className="w-full bg-violet-600 p-4 rounded-2xl font-bold transition hover:bg-violet-700"
        >
          Start Game
        </button>

      </div>
    </div>
  );
}


export default SoloSetup;