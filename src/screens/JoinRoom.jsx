import { useState } from "react";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

function JoinRoom() {
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const joinRoom = async () => {
    const roomRef = doc(db, "rooms", roomCode);

    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      alert("Room not found");
      return;
    }

    await updateDoc(roomRef, {
      playerList: arrayUnion({
        uid: auth.currentUser.uid,
        name: auth.currentUser.email,
      }),
    });

    navigate("/waiting-room", {
      state: {
        roomCode,
        isHost: false,
      },
    });
  };

  return (
    <div>
      <input
        placeholder="Enter Room Code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
      />

      <button onClick={joinRoom}>
        Join Room
      </button>
    </div>
  );
}

export default JoinRoom;