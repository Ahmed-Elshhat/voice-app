// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";

// export default function Join() {
//   const router = useRouter();
//   const [name, setName] = useState("");
//   const [room, setRoom] = useState("");

//   const createRoom = () => {
//     const newRoom = Math.random().toString(36).substring(2, 10);
//     router.push(`/room/${newRoom}?name=${name}`);
//   };

//   const joinRoom = () => {
//     if (!name || !room) return;
//     router.push(`/room/${room}?name=${name}`);
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Join Voice Room</h2>
//       <input
//         placeholder="Your Name"
//         value={name}
//         onChange={(e) => setName(e.target.value)}
//       />
//       <br />
//       <input
//         placeholder="Room ID"
//         value={room}
//         onChange={(e) => setRoom(e.target.value)}
//       />

//       <br />
//       <button onClick={joinRoom}>Join Room ✅</button>
//       <button onClick={createRoom}>Create New Room ➕</button>
//     </div>
//   );
// }


"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Join() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");

  const createRoom = () => {
    const newRoom = Math.random().toString(36).substring(2, 10);
    router.push(`/room/${newRoom}?name=${encodeURIComponent(name)}`);
  };

  const joinRoom = () => {
    if (!name || !room) {
      alert("Please enter your name and room id");
      return;
    }
    router.push(`/room/${room}?name=${encodeURIComponent(name)}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Join Voice Room</h2>
      <input
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <br />
      <input
        placeholder="Room ID"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />

      <br />
      <button onClick={joinRoom}>Join Room ✅</button>
      <button onClick={createRoom}>Create New Room ➕</button>
    </div>
  );
}
