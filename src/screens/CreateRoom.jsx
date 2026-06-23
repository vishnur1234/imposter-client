import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
  import { auth } from "../firebase/firebase";
function CreateRoom() {
  const navigate = useNavigate();

  const [course, setCourse] = useState("ACCA");
  const [players, setPlayers] = useState(4);

  const createRoom = async () => {
    const roomCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    try {
      const timeout = (ms) => new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: Firestore did not respond.")), ms)
      );

      // await Promise.race([
      //   setDoc(doc(db, "rooms", roomCode), {
      //     roomCode,
      //     course,
      //     players,
      //     started: false,
      //     createdAt: Date.now(),
      //     playerList: [],
      //   }),
      //   timeout(2500)
      // ]);



await setDoc(doc(db, "rooms", roomCode), {
  roomCode,
  course,
  players,
  started: false,
  createdAt: Date.now(),
  playerList: [
    {
      uid: auth.currentUser.uid,
      name: auth.currentUser.email,
    },
  ],
});

      navigate("/waiting-room", {
        state: {
          roomCode,
          course,
          players,
          isHost: true,
          isDemoMode: false,
        },
      });
    } catch (error) {
      console.error("Firestore Write Failed:", error);
      
      const proceedOffline = window.confirm(
        `Failed to create online room (Firestore Error: ${error.message || error}).\n\n` +
        `Would you like to proceed in Local Demo Mode instead?`
      );

      if (proceedOffline) {
        navigate("/waiting-room", {
          state: {
            roomCode,
            course,
            players,
            isHost: true,
            isDemoMode: true,
          },
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 p-8 rounded-3xl">

        <h1 className="text-3xl font-black text-white mb-6">
          Create Room
        </h1>

        <select
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="w-full bg-slate-800 p-4 rounded-xl text-white mb-4"
        >
          <option>ACCA</option>
          <option>CMA</option>
        </select>

        <input
          type="number"
          min="3"
          max="10"
          value={players}
          onChange={(e) => setPlayers(e.target.value)}
          className="w-full bg-slate-800 p-4 rounded-xl text-white mb-4"
        />

        <button
          onClick={createRoom}
          className="w-full bg-violet-600 p-4 rounded-xl text-white font-bold"
        >
          Create Room
        </button>

      </div>
    </div>
  );
}

export default CreateRoom;