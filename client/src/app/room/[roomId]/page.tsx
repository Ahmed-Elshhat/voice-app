// V1
// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useParams } from "next/navigation";
// import io from "socket.io-client";

// const socket = io("http://localhost:5000"); // Connect to Express server

// export default function RoomPage() {
//   const { roomId } = useParams() as { roomId: string };

//   const localAudioRef = useRef<HTMLAudioElement | null>(null);
//   const [micEnabled, setMicEnabled] = useState(true);

//   const localStreamRef = useRef<MediaStream | null>(null);
//   const [joined, setJoined] = useState(false);

//   const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
//   const [remoteAudios, setRemoteAudios] = useState<{
//     [key: string]: MediaStream;
//   }>({});
//   const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

//   const config: RTCConfiguration = {
//     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//   };

//   const joinRoom = async () => {
//     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     localStreamRef.current = stream;

//     if (localAudioRef.current) {
//       localAudioRef.current.srcObject = stream;
//       localAudioRef.current.muted = true;
//     }

//     setJoined(true);
//     socket.emit("join", roomId);
//   };

//   const addRemoteAudio = (userId: string, stream: MediaStream) => {
//     setRemoteAudios((prev) => ({ ...prev, [userId]: stream }));
//   };

//   useEffect(() => {
//     if (!roomId) return;

//     socket.on("all-users", async (users: string[]) => {
//       const stream = localStreamRef.current;
//       for (const userId of users) {
//         const peer = new RTCPeerConnection(config);
//         peersRef.current[userId] = peer;

//         stream?.getTracks().forEach((track) => peer.addTrack(track, stream));

//         peer.onicecandidate = (event) => {
//           if (event.candidate) {
//             socket.emit("ice-candidate", {
//               candidate: event.candidate,
//               to: userId,
//             });
//           }
//         };

//         peer.ontrack = (event) => {
//           addRemoteAudio(userId, event.streams[0]);
//         };

//         const offer = await peer.createOffer();
//         await peer.setLocalDescription(offer);
//         socket.emit("offer", { offer, to: userId });
//       }
//     });

//     socket.on("user-joined", async (userId: string) => {
//       const stream = localStreamRef.current;
//       const peer = new RTCPeerConnection(config);
//       peersRef.current[userId] = peer;

//       stream?.getTracks().forEach((track) => peer.addTrack(track, stream));

//       peer.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit("ice-candidate", {
//             candidate: event.candidate,
//             to: userId,
//           });
//         }
//       };

//       peer.ontrack = (event) => {
//         addRemoteAudio(userId, event.streams[0]);
//       };
//     });

//     socket.on(
//       "offer",
//       async ({
//         offer,
//         from,
//       }: {
//         offer: RTCSessionDescriptionInit;
//         from: string;
//       }) => {
//         let peer = peersRef.current[from];
//         if (!peer) {
//           peer = new RTCPeerConnection(config);
//           peersRef.current[from] = peer;

//           const stream = localStreamRef.current;
//           stream?.getTracks().forEach((track) => peer.addTrack(track, stream));

//           peer.onicecandidate = (event) => {
//             if (event.candidate) {
//               socket.emit("ice-candidate", {
//                 candidate: event.candidate,
//                 to: from,
//               });
//             }
//           };

//           peer.ontrack = (event) => addRemoteAudio(from, event.streams[0]);
//         }

//         await peer.setRemoteDescription(new RTCSessionDescription(offer));
//         const answer = await peer.createAnswer();
//         await peer.setLocalDescription(answer);
//         socket.emit("answer", { answer, to: from });
//       }
//     );

//     socket.on(
//       "answer",
//       async ({
//         answer,
//         from,
//       }: {
//         answer: RTCSessionDescriptionInit;
//         from: string;
//       }) => {
//         const peer = peersRef.current[from];
//         if (!peer) return;
//         await peer.setRemoteDescription(new RTCSessionDescription(answer));
//       }
//     );

//     socket.on(
//       "ice-candidate",
//       async ({
//         candidate,
//         from,
//       }: {
//         candidate: RTCIceCandidateInit;
//         from: string;
//       }) => {
//         const peer = peersRef.current[from];
//         if (!peer) return;
//         try {
//           await peer.addIceCandidate(new RTCIceCandidate(candidate));
//         } catch (err) {
//           console.error("Failed to add ICE Candidate:", err);
//         }
//       }
//     );

//     socket.on("user-left", ({ userId }: { userId: string }) => {
//       const peer = peersRef.current[userId];
//       if (peer) {
//         try {
//           peer.close();
//         } catch {}
//         delete peersRef.current[userId];
//       }

//       setRemoteAudios((prev) => {
//         const copy = { ...prev };
//         delete copy[userId];
//         return copy;
//       });

//       if (audioRefs.current[userId]) {
//         try {
//           audioRefs.current[userId]!.srcObject = null;
//         } catch {}
//         delete audioRefs.current[userId];
//       }
//     });

//     socket.on(
//       "toggle-mic",
//       ({ enabled, userId }: { enabled: boolean; userId: string }) => {
//         const el = audioRefs.current[userId];
//         if (el && el.srcObject) {
//           const stream = el.srcObject as MediaStream;
//           const track = stream.getAudioTracks()[0];
//           if (track) {
//             track.enabled = enabled;
//           } else {
//             el.volume = enabled ? 1 : 0;
//           }
//         }
//       }
//     );

//     return () => {
//       socket.removeAllListeners();
//     };
//   }, [roomId]);

//   const toggleMic = () => {
//     if (!localStreamRef.current) return;
//     const audioTrack = localStreamRef.current.getAudioTracks()[0];
//     if (!audioTrack) return;

//     audioTrack.enabled = !audioTrack.enabled;
//     setMicEnabled(audioTrack.enabled);

//     socket.emit("toggle-mic", { enabled: audioTrack.enabled, roomId });
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <h1>Room: {roomId}</h1>

//       {!joined ? (
//         <button onClick={joinRoom}>Join Call</button>
//       ) : (
//         <p>Connected ✅</p>
//       )}

//       {joined && (
//         <button onClick={toggleMic}>
//           {micEnabled ? "Mute 🔇" : "Unmute 🎤"}
//         </button>
//       )}

//       <h3>Your Voice</h3>
//       <audio ref={localAudioRef} autoPlay />

//       <h3>Others</h3>
//       {Object.entries(remoteAudios).map(([id, stream]) => (
//         <audio
//           key={id}
//           autoPlay
//           ref={(el) => {
//             audioRefs.current[id] = el;
//             if (el && stream) {
//               el.srcObject = stream;
//             }
//           }}
//         />
//       ))}
//     </div>
//   );
// }

// V2
// "use client";
// import { useEffect, useRef, useState } from "react";
// import { useParams, useSearchParams } from "next/navigation";
// import io from "socket.io-client";

// const socket = io("http://localhost:5000");

// type UserInfo = {
//   userId: string;
//   name: string;
//   micEnabled: boolean;
//   speaking?: boolean;
// };

// export default function RoomPage() {
//   // const { roomId } = useParams() as { roomId: string };
//   const params = useParams();
//   const roomId = (params?.roomId ?? "") as string;

//   const search = useSearchParams();
//   const name = search?.get("name") || "Guest";

//   const localAudioRef = useRef<HTMLAudioElement | null>(null);
//   const [micEnabled, setMicEnabled] = useState(true);
//   const localStreamRef = useRef<MediaStream | null>(null);
//   const [joined, setJoined] = useState(false);

//   const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
//   const [remoteAudios, setRemoteAudios] = useState<{
//     [key: string]: MediaStream;
//   }>({});
//   const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

//   const [users, setUsers] = useState<UserInfo[]>([]); // full user list with names & states
//   const [speakingMap, setSpeakingMap] = useState<{ [key: string]: boolean }>(
//     {}
//   );

//   const config: RTCConfiguration = {
//     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//   };

//   const endCall = () => {
//     // stop local tracks
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach((track) => track.stop());
//     }

//     // close peers
//     Object.values(peersRef.current).forEach((peer) => {
//       try {
//         peer.close();
//       } catch {}
//     });

//     peersRef.current = {};
//     setRemoteAudios({});
//     setUsers([]);
//     setJoined(false);

//     socket.disconnect();

//     // optional: رجّع للمستخدم صفحة الانضمام
//     window.location.href = "/";
//   };

//   const copyRoomLink = async () => {
//     const link = `${
//       window.location.origin
//     }/room/${roomId}?name=${encodeURIComponent(name)}`;
//     try {
//       await navigator.clipboard.writeText(link);
//       alert("✅ Room link copied!");
//     } catch {
//       alert("Failed to copy link ❌");
//     }
//   };

//   // --- join and announce name to server
//   const joinRoom = async () => {
//     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     localStreamRef.current = stream;

//     if (localAudioRef.current) {
//       localAudioRef.current.srcObject = stream;
//       localAudioRef.current.muted = true;
//     }

//     setJoined(true);

//     socket.emit("join", { roomId, userName: name });

//     // start simple VAD: detect when user is speaking and emit
//     startVAD(stream);
//   };

//   // add or update remote audio stream
//   const addRemoteAudio = (userId: string, stream: MediaStream) => {
//     setRemoteAudios((prev) => ({ ...prev, [userId]: stream }));
//   };

//   useEffect(() => {
//     if (!roomId) return;

//     // receives list of users with metadata
//     socket.on("users-in-room", (userList: UserInfo[]) => {
//       setUsers(userList);
//       // keep speaking map in sync
//       const m: { [key: string]: boolean } = {};
//       userList.forEach((u) => (m[u.userId] = !!u.speaking));
//       setSpeakingMap(m);
//     });

//     // existing members' ids when we join (we will create peers to them)
//     socket.on("all-users", async (userIds: string[]) => {
//       const stream = localStreamRef.current;
//       for (const userId of userIds) {
//         const peer = new RTCPeerConnection(config);
//         peersRef.current[userId] = peer;

//         stream?.getTracks().forEach((track) => peer.addTrack(track, stream));

//         peer.onicecandidate = (event) => {
//           if (event.candidate) {
//             socket.emit("ice-candidate", {
//               candidate: event.candidate,
//               to: userId,
//             });
//           }
//         };

//         peer.ontrack = (event) => addRemoteAudio(userId, event.streams[0]);

//         const offer = await peer.createOffer();
//         await peer.setLocalDescription(offer);
//         socket.emit("offer", { offer, to: userId });
//       }
//     });

//     // someone joined after us -> create peer placeholder (they'll offer)
//     socket.on("user-joined", async (userId: string) => {
//       const stream = localStreamRef.current;
//       const peer = new RTCPeerConnection(config);
//       peersRef.current[userId] = peer;

//       stream?.getTracks().forEach((track) => peer.addTrack(track, stream));

//       peer.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit("ice-candidate", {
//             candidate: event.candidate,
//             to: userId,
//           });
//         }
//       };

//       peer.ontrack = (event) => addRemoteAudio(userId, event.streams[0]);
//     });

//     // offer -> answer
//     socket.on(
//       "offer",
//       async ({
//         offer,
//         from,
//       }: {
//         offer: RTCSessionDescriptionInit;
//         from: string;
//       }) => {
//         let peer = peersRef.current[from];
//         if (!peer) {
//           peer = new RTCPeerConnection(config);
//           peersRef.current[from] = peer;

//           const stream = localStreamRef.current;
//           stream?.getTracks().forEach((track) => peer.addTrack(track, stream));

//           peer.onicecandidate = (event) => {
//             if (event.candidate) {
//               socket.emit("ice-candidate", {
//                 candidate: event.candidate,
//                 to: from,
//               });
//             }
//           };

//           peer.ontrack = (event) => addRemoteAudio(from, event.streams[0]);
//         }

//         await peer.setRemoteDescription(new RTCSessionDescription(offer));
//         const answer = await peer.createAnswer();
//         await peer.setLocalDescription(answer);
//         socket.emit("answer", { answer, to: from });
//       }
//     );

//     // answer to our offer
//     socket.on(
//       "answer",
//       async ({
//         answer,
//         from,
//       }: {
//         answer: RTCSessionDescriptionInit;
//         from: string;
//       }) => {
//         const peer = peersRef.current[from];
//         if (!peer) return;
//         await peer.setRemoteDescription(new RTCSessionDescription(answer));
//       }
//     );

//     // remote ice candidate
//     socket.on(
//       "ice-candidate",
//       async ({
//         candidate,
//         from,
//       }: {
//         candidate: RTCIceCandidateInit;
//         from: string;
//       }) => {
//         const peer = peersRef.current[from];
//         if (!peer) return;
//         try {
//           await peer.addIceCandidate(new RTCIceCandidate(candidate));
//         } catch (err) {
//           console.error("Failed to add ICE Candidate:", err);
//         }
//       }
//     );

//     // user left
//     socket.on("user-left", ({ userId }: { userId: string }) => {
//       const peer = peersRef.current[userId];
//       if (peer) {
//         try {
//           peer.close();
//         } catch {}
//         delete peersRef.current[userId];
//       }
//       setRemoteAudios((prev) => {
//         const copy = { ...prev };
//         delete copy[userId];
//         return copy;
//       });
//       if (audioRefs.current[userId]) {
//         try {
//           audioRefs.current[userId]!.srcObject = null;
//         } catch {}
//         delete audioRefs.current[userId];
//       }
//       setUsers((prev) => prev.filter((u) => u.userId !== userId));
//     });

//     // speaking update (fast update)
//     socket.on(
//       "user-speaking",
//       ({ userId, speaking }: { userId: string; speaking: boolean }) => {
//         setSpeakingMap((prev) => ({ ...prev, [userId]: speaking }));
//       }
//     );

//     // cleanup
//     return () => {
//       socket.off("users-in-room");
//       socket.off("all-users");
//       socket.off("user-joined");
//       socket.off("offer");
//       socket.off("answer");
//       socket.off("ice-candidate");
//       socket.off("user-left");
//       socket.off("user-speaking");
//     };
//   }, [roomId]);

//   // toggle mic -> tell server (server will broadcast updated user list)
//   const toggleMic = () => {
//     if (!localStreamRef.current) return;
//     const audioTrack = localStreamRef.current.getAudioTracks()[0];
//     if (!audioTrack) return;

//     audioTrack.enabled = !audioTrack.enabled;
//     setMicEnabled(audioTrack.enabled);

//     socket.emit("toggle-mic", { enabled: audioTrack.enabled, roomId });
//   };

//   // --- Simple VAD implementation using AnalyserNode
//   const vadRef = useRef<{
//     audioCtx?: AudioContext;
//     analyser?: AnalyserNode;
//     rafId?: number;
//     lastEmit?: number;
//   }>({});

//   const startVAD = (stream: MediaStream) => {
//     try {
//       const AudioContextClass: typeof AudioContext =
//         window.AudioContext ||
//         (window as unknown as { webkitAudioContext: typeof AudioContext })
//           .webkitAudioContext;

//       const audioCtx = new AudioContextClass();
//       const source = audioCtx.createMediaStreamSource(stream);
//       const analyser = audioCtx.createAnalyser();
//       analyser.fftSize = 512;
//       source.connect(analyser);

//       vadRef.current.audioCtx = audioCtx;
//       vadRef.current.analyser = analyser;
//       vadRef.current.lastEmit = 0;

//       const data = new Uint8Array(analyser.frequencyBinCount);
//       const THRESHOLD = 30; // tweak this: lower = more sensitive
//       const EMIT_INTERVAL = 150; // ms between speaking emits

//       const check = () => {
//         analyser.getByteFrequencyData(data);
//         // compute simple RMS-ish value
//         let sum = 0;
//         for (let i = 0; i < data.length; i++) sum += data[i];
//         const avg = sum / data.length;

//         const now = Date.now();
//         const speaking = avg > THRESHOLD;

//         // emit speaking only sometimes to avoid flooding
//         if (
//           !vadRef.current.lastEmit ||
//           now - (vadRef.current.lastEmit || 0) > EMIT_INTERVAL
//         ) {
//           vadRef.current.lastEmit = now;
//           socket.emit("speaking", { speaking, roomId });
//         }

//         requestAnimationFrame(check);
//       };

//       vadRef.current.rafId = requestAnimationFrame(check);
//     } catch (err) {
//       console.warn("VAD start failed:", err);
//     }
//   };

//   // --- render user card circle
//   const UserCard = ({ u }: { u: UserInfo }) => {
//     const speaking = speakingMap[u.userId] || false;
//     const micOff = !u.micEnabled;
//     const initial = u.name && u.name[0] ? u.name[0].toUpperCase() : "?";

//     const borderColor = speaking ? "#4ade80" : micOff ? "#f87171" : "#60a5fa"; // green speaking, red muted, blue default
//     const bg = speaking ? "linear-gradient(135deg,#86efac,#4ade80)" : "#fff";

//     return (
//       <div
//         style={{
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//           width: 100,
//           margin: 8,
//           fontFamily: "sans-serif",
//         }}
//       >
//         <div
//           style={{
//             width: 72,
//             height: 72,
//             borderRadius: "50%",
//             border: `3px solid ${borderColor}`,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             fontSize: 28,
//             fontWeight: 700,
//             background: bg,
//             boxShadow: speaking ? "0 6px 18px rgba(74,222,128,0.25)" : "none",
//           }}
//         >
//           {initial}
//         </div>
//         <div style={{ marginTop: 8, textAlign: "center" }}>
//           <div style={{ fontWeight: 600 }}>
//             {u.name === name ? `${u.name} (You)` : u.name}
//           </div>
//           <div style={{ fontSize: 12, color: "#666" }}>
//             {u.micEnabled ? "🎤 On" : "🔇 Muted"}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // set audio element srcObjects when remoteAudios changes
//   useEffect(() => {
//     for (const [id, stream] of Object.entries(remoteAudios)) {
//       const el = audioRefs.current[id];
//       if (el) el.srcObject = stream;
//     }
//   }, [remoteAudios]);

//   return (
//     <div style={{ padding: 20, fontFamily: "sans-serif" }}>
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <h1 style={{ margin: 0 }}>Room: {roomId}</h1>
//         <div>
//           {!joined ? (
//             <button onClick={joinRoom}>Join Call</button>
//           ) : (
//             <span style={{ marginRight: 12, color: "#16a34a" }}>
//               Connected ✅
//             </span>
//           )}
//           {joined && (
//             <>
//               <button onClick={toggleMic} style={{ marginLeft: 8 }}>
//                 {micEnabled ? "Mute 🔇" : "Unmute 🎤"}
//               </button>

//               {/* ✅ نسخ الرابط */}
//               <button onClick={copyRoomLink} style={{ marginLeft: 8 }}>
//                 Copy Link 🔗
//               </button>

//               {/* ✅ إنهاء المكالمة */}
//               <button
//                 onClick={endCall}
//                 style={{
//                   marginLeft: 8,
//                   backgroundColor: "#ef4444",
//                   color: "white",
//                 }}
//               >
//                 End Call ❌
//               </button>
//             </>
//           )}
//         </div>
//       </div>

//       <div style={{ marginTop: 20 }}>
//         <strong>Participants</strong>
//         <div style={{ display: "flex", flexWrap: "wrap", marginTop: 12 }}>
//           {users.map((u) => (
//             <div key={u.userId}>
//               <UserCard u={u} />
//               {/* hidden audio element for the incoming stream (if exists) */}
//               <audio
//                 autoPlay
//                 ref={(el) => {
//                   audioRefs.current[u.userId] = el;
//                   const s = remoteAudios[u.userId];
//                   if (el && s) el.srcObject = s;
//                 }}
//               />
//             </div>
//           ))}
//         </div>
//       </div>

//       <div style={{ marginTop: 24 }}>
//         <strong>Your Voice (local monitor)</strong>
//         <div>
//           <audio ref={localAudioRef} autoPlay />
//         </div>
//       </div>
//     </div>
//   );
// }

// V3
// "use client";
// import { useEffect, useRef, useState } from "react";
// import { useParams, useSearchParams } from "next/navigation";
// import io from "socket.io-client";
// import "./RoomPage.scss";

// const socket = io("http://localhost:5000");

// type UserInfo = {
//   userId: string;
//   name: string;
//   micEnabled: boolean;
//   speaking?: boolean;
// };

// export default function RoomPage() {
//   // const { roomId } = useParams() as { roomId: string };
//   const params = useParams();
//   const roomId = (params?.roomId ?? "") as string;

//   const search = useSearchParams();
//   const name = search?.get("name") || "Guest";

//   const localAudioRef = useRef<HTMLAudioElement | null>(null);
//   const [micEnabled, setMicEnabled] = useState(true);
//   const localStreamRef = useRef<MediaStream | null>(null);
//   const [joined, setJoined] = useState(false);

//   const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
//   const [remoteAudios, setRemoteAudios] = useState<{
//     [key: string]: MediaStream;
//   }>({});
//   const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

//   const [users, setUsers] = useState<UserInfo[]>([]); // full user list with names & states
//   const [speakingMap, setSpeakingMap] = useState<{ [key: string]: boolean }>(
//     {}
//   );
//   const [ping, setPing] = useState<number | null>(null);

//   const config: RTCConfiguration = {
//     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//   };

//   const endCall = () => {
//     // stop local tracks
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach((track) => track.stop());
//     }

//     // close peers
//     Object.values(peersRef.current).forEach((peer) => {
//       try {
//         peer.close();
//       } catch {}
//     });

//     peersRef.current = {};
//     setRemoteAudios({});
//     setUsers([]);
//     setJoined(false);

//     socket.disconnect();

//     // optional: رجّع للمستخدم صفحة الانضمام
//     window.location.href = "/";
//   };

//   const copyRoomLink = async () => {
//     const link = `${
//       window.location.origin
//     }/room/${roomId}?name=${encodeURIComponent(name)}`;
//     try {
//       await navigator.clipboard.writeText(link);
//       alert("✅ Room link copied!");
//     } catch {
//       alert("Failed to copy link ❌");
//     }
//   };

//   // --- join and announce name to server
//   const joinRoom = async () => {
//     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     localStreamRef.current = stream;

//     if (localAudioRef.current) {
//       localAudioRef.current.srcObject = stream;
//       localAudioRef.current.muted = true;
//     }

//     setJoined(true);

//     socket.emit("join", { roomId, userName: name });

//     // start simple VAD: detect when user is speaking and emit
//     startVAD(stream);
//   };

//   // add or update remote audio stream
//   const addRemoteAudio = (userId: string, stream: MediaStream) => {
//     setRemoteAudios((prev) => ({ ...prev, [userId]: stream }));
//   };

//   useEffect(() => {
//     const interval = setInterval(() => {
//       const start = Date.now();
//       socket.emit("ping-check");
//       socket.once("pong-check", () => {
//         setPing(Date.now() - start);
//       });
//     }, 2000);

//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     if (!roomId) return;

//     // receives list of users with metadata
//     socket.on("users-in-room", (userList: UserInfo[]) => {
//       setUsers(userList);
//       // keep speaking map in sync
//       const m: { [key: string]: boolean } = {};
//       userList.forEach((u) => (m[u.userId] = !!u.speaking));
//       setSpeakingMap(m);
//     });

//     // existing members' ids when we join (we will create peers to them)
//     socket.on("all-users", async (userIds: string[]) => {
//       const stream = localStreamRef.current;
//       for (const userId of userIds) {
//         const peer = new RTCPeerConnection(config);
//         peersRef.current[userId] = peer;

//         stream?.getTracks().forEach((track) => peer.addTrack(track, stream));

//         peer.onicecandidate = (event) => {
//           if (event.candidate) {
//             socket.emit("ice-candidate", {
//               candidate: event.candidate,
//               to: userId,
//             });
//           }
//         };

//         peer.ontrack = (event) => addRemoteAudio(userId, event.streams[0]);

//         const offer = await peer.createOffer();
//         await peer.setLocalDescription(offer);
//         socket.emit("offer", { offer, to: userId });
//       }
//     });

//     // someone joined after us -> create peer placeholder (they'll offer)
//     socket.on("user-joined", async (userId: string) => {
//       const stream = localStreamRef.current;
//       const peer = new RTCPeerConnection(config);
//       peersRef.current[userId] = peer;

//       stream?.getTracks().forEach((track) => peer.addTrack(track, stream));

//       peer.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit("ice-candidate", {
//             candidate: event.candidate,
//             to: userId,
//           });
//         }
//       };

//       peer.ontrack = (event) => addRemoteAudio(userId, event.streams[0]);
//     });

//     // offer -> answer
//     socket.on(
//       "offer",
//       async ({
//         offer,
//         from,
//       }: {
//         offer: RTCSessionDescriptionInit;
//         from: string;
//       }) => {
//         let peer = peersRef.current[from];
//         if (!peer) {
//           peer = new RTCPeerConnection(config);
//           peersRef.current[from] = peer;

//           const stream = localStreamRef.current;
//           stream?.getTracks().forEach((track) => peer.addTrack(track, stream));

//           peer.onicecandidate = (event) => {
//             if (event.candidate) {
//               socket.emit("ice-candidate", {
//                 candidate: event.candidate,
//                 to: from,
//               });
//             }
//           };

//           peer.ontrack = (event) => addRemoteAudio(from, event.streams[0]);
//         }

//         await peer.setRemoteDescription(new RTCSessionDescription(offer));
//         const answer = await peer.createAnswer();
//         await peer.setLocalDescription(answer);
//         socket.emit("answer", { answer, to: from });
//       }
//     );

//     // answer to our offer
//     socket.on(
//       "answer",
//       async ({
//         answer,
//         from,
//       }: {
//         answer: RTCSessionDescriptionInit;
//         from: string;
//       }) => {
//         const peer = peersRef.current[from];
//         if (!peer) return;
//         await peer.setRemoteDescription(new RTCSessionDescription(answer));
//       }
//     );

//     // remote ice candidate
//     socket.on(
//       "ice-candidate",
//       async ({
//         candidate,
//         from,
//       }: {
//         candidate: RTCIceCandidateInit;
//         from: string;
//       }) => {
//         const peer = peersRef.current[from];
//         if (!peer) return;
//         try {
//           await peer.addIceCandidate(new RTCIceCandidate(candidate));
//         } catch (err) {
//           console.error("Failed to add ICE Candidate:", err);
//         }
//       }
//     );

//     // user left
//     socket.on("user-left", ({ userId }: { userId: string }) => {
//       const peer = peersRef.current[userId];
//       if (peer) {
//         try {
//           peer.close();
//         } catch {}
//         delete peersRef.current[userId];
//       }
//       setRemoteAudios((prev) => {
//         const copy = { ...prev };
//         delete copy[userId];
//         return copy;
//       });
//       if (audioRefs.current[userId]) {
//         try {
//           audioRefs.current[userId]!.srcObject = null;
//         } catch {}
//         delete audioRefs.current[userId];
//       }
//       setUsers((prev) => prev.filter((u) => u.userId !== userId));
//     });

//     // speaking update (fast update)
//     socket.on(
//       "user-speaking",
//       ({ userId, speaking }: { userId: string; speaking: boolean }) => {
//         setSpeakingMap((prev) => ({ ...prev, [userId]: speaking }));
//       }
//     );

//     // cleanup
//     return () => {
//       socket.off("users-in-room");
//       socket.off("all-users");
//       socket.off("user-joined");
//       socket.off("offer");
//       socket.off("answer");
//       socket.off("ice-candidate");
//       socket.off("user-left");
//       socket.off("user-speaking");
//     };
//   }, [roomId]);

//   // toggle mic -> tell server (server will broadcast updated user list)
//   const toggleMic = () => {
//     if (!localStreamRef.current) return;
//     const audioTrack = localStreamRef.current.getAudioTracks()[0];
//     if (!audioTrack) return;

//     audioTrack.enabled = !audioTrack.enabled;
//     setMicEnabled(audioTrack.enabled);

//     socket.emit("toggle-mic", { enabled: audioTrack.enabled, roomId });
//   };

//   // --- Simple VAD implementation using AnalyserNode
//   const vadRef = useRef<{
//     audioCtx?: AudioContext;
//     analyser?: AnalyserNode;
//     rafId?: number;
//     lastEmit?: number;
//   }>({});

//   const startVAD = (stream: MediaStream) => {
//     try {
//       const AudioContextClass: typeof AudioContext =
//         window.AudioContext ||
//         (window as unknown as { webkitAudioContext: typeof AudioContext })
//           .webkitAudioContext;

//       const audioCtx = new AudioContextClass();
//       const source = audioCtx.createMediaStreamSource(stream);
//       const analyser = audioCtx.createAnalyser();
//       analyser.fftSize = 512;
//       source.connect(analyser);

//       vadRef.current.audioCtx = audioCtx;
//       vadRef.current.analyser = analyser;
//       vadRef.current.lastEmit = 0;

//       const data = new Uint8Array(analyser.frequencyBinCount);
//       const THRESHOLD = 30; // tweak this: lower = more sensitive
//       const EMIT_INTERVAL = 150; // ms between speaking emits

//       const check = () => {
//         analyser.getByteFrequencyData(data);
//         // compute simple RMS-ish value
//         let sum = 0;
//         for (let i = 0; i < data.length; i++) sum += data[i];
//         const avg = sum / data.length;

//         const now = Date.now();
//         const speaking = avg > THRESHOLD;

//         // emit speaking only sometimes to avoid flooding
//         if (
//           !vadRef.current.lastEmit ||
//           now - (vadRef.current.lastEmit || 0) > EMIT_INTERVAL
//         ) {
//           vadRef.current.lastEmit = now;
//           socket.emit("speaking", { speaking, roomId });
//         }

//         requestAnimationFrame(check);
//       };

//       vadRef.current.rafId = requestAnimationFrame(check);
//     } catch (err) {
//       console.warn("VAD start failed:", err);
//     }
//   };

//   // --- render user card circle
//   // const UserCard = ({ u }: { u: UserInfo }) => {
//   //   const speaking = speakingMap[u.userId] || false;
//   //   const micOff = !u.micEnabled;
//   //   const initial = u.name && u.name[0] ? u.name[0].toUpperCase() : "?";

//   //   const borderColor = speaking ? "#4ade80" : micOff ? "#f87171" : "#60a5fa"; // green speaking, red muted, blue default
//   //   const bg = speaking ? "linear-gradient(135deg,#86efac,#4ade80)" : "#fff";

//   //   return (
//   //     <div
//   //       style={{
//   //         display: "flex",
//   //         flexDirection: "column",
//   //         alignItems: "center",
//   //         width: 100,
//   //         margin: 8,
//   //         fontFamily: "sans-serif",
//   //       }}
//   //     >
//   //       <div
//   //         style={{
//   //           width: 72,
//   //           height: 72,
//   //           borderRadius: "50%",
//   //           border: `3px solid ${borderColor}`,
//   //           display: "flex",
//   //           alignItems: "center",
//   //           justifyContent: "center",
//   //           fontSize: 28,
//   //           fontWeight: 700,
//   //           background: bg,
//   //           boxShadow: speaking ? "0 6px 18px rgba(74,222,128,0.25)" : "none",
//   //         }}
//   //       >
//   //         {initial}
//   //       </div>
//   //       <div style={{ marginTop: 8, textAlign: "center" }}>
//   //         <div style={{ fontWeight: 600 }}>
//   //           {u.name === name ? `${u.name} (You)` : u.name}
//   //         </div>
//   //         <div style={{ fontSize: 12, color: "#666" }}>
//   //           {u.micEnabled ? "🎤 On" : "🔇 Muted"}
//   //         </div>
//   //       </div>
//   //     </div>
//   //   );
//   // };

//   const UserCard = ({ u }: { u: UserInfo }) => {
//     const speaking = speakingMap[u.userId] || false;
//     const micOff = !u.micEnabled;
//     const initial = u.name && u.name[0] ? u.name[0].toUpperCase() : "?";

//     const className = `
//     user-card
//     ${speaking ? "speaking" : ""}
//     ${micOff ? "muted" : ""}
//   `;

//     return (
//       <div className={className}>
//         <div className="avatar">{initial}</div>
//         <div className="info">
//           <div className="name">
//             {u.name === name ? `${u.name} (You)` : u.name}
//           </div>
//           <div className="mic-status">
//             {u.micEnabled ? "🎤 On" : "🔇 Muted"}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // set audio element srcObjects when remoteAudios changes
//   useEffect(() => {
//     for (const [id, stream] of Object.entries(remoteAudios)) {
//       const el = audioRefs.current[id];
//       if (el) el.srcObject = stream;
//     }
//   }, [remoteAudios]);

//   return (
//     <div className="room-page">
//       <header className="room-header">
//         <h1>Room: {roomId}</h1>

//         <div className="actions">
//           {!joined ? (
//             <button className="btn primary" onClick={joinRoom}>
//               Join Call
//             </button>
//           ) : (
//             <>
//               {joined && (
//                 <div className="connection-info">
//                   <span className="status connected">Connected ✅</span>
//                   <span className="ping">Ping: {ping ?? "--"} ms</span>
//                 </div>
//               )}
//             </>
//           )}

//           {joined && (
//             <>
//               <button className="btn" onClick={toggleMic}>
//                 {micEnabled ? "Mute 🔇" : "Unmute 🎤"}
//               </button>

//               <button className="btn" onClick={copyRoomLink}>
//                 Copy Link 🔗
//               </button>

//               <button className="btn danger" onClick={endCall}>
//                 End Call ❌
//               </button>
//             </>
//           )}
//         </div>
//       </header>

//       <section className="participants">
//         <h2>Participants</h2>
//         <div className="users-grid">
//           {users.map((u) => (
//             <div key={u.userId} className="user-wrapper">
//               <UserCard u={u} />
//               <audio
//                 autoPlay
//                 ref={(el) => {
//                   audioRefs.current[u.userId] = el;
//                   const s = remoteAudios[u.userId];
//                   if (el && s) el.srcObject = s;
//                 }}
//               />
//             </div>
//           ))}
//         </div>
//       </section>

//       <section className="local-monitor">
//         <h2>Your Voice Monitor</h2>
//         <audio ref={localAudioRef} autoPlay />
//       </section>
//     </div>
//   );
// }

// V4

"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import io from "socket.io-client";
import "./RoomPage.scss";

/**
 * نسخة محدثة: Metrics (RTT, bitrate up/down, packet loss) + auto-reconnect banner.
 * - Metrics تُحسب كل ثانية عبر getStats()
 * - Socket.io مع إعادة محاولة تلقائية (config below)
 * - عند إعادة الاتصال نعيد إرسال "join" تلقائياً
 */

/* -------------------- config -------------------- */
const SOCKET_URL = "http://localhost:5000";
const RECONNECT_INTERVAL_MS = 5000; // retry every 5s for banner display (socket.io also tries)
const STATS_INTERVAL_MS = 1000; // how often we sample getStats()

const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: RECONNECT_INTERVAL_MS,
});

type UserInfo = {
  userId: string;
  name: string;
  micEnabled: boolean;
  speaking?: boolean;
};

type PeerMetrics = {
  rttMs?: number;
  inboundKbps?: number;
  outboundKbps?: number;
  packetLossPct?: number;
  lastUpdated?: number;
};

export default function RoomPage() {
  const params = useParams();
  const roomId = (params?.roomId ?? "") as string;

  const search = useSearchParams();
  const name = search?.get("name") || "Guest";

  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [joined, setJoined] = useState(false);

  const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const [remoteAudios, setRemoteAudios] = useState<{
    [key: string]: MediaStream;
  }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  const [users, setUsers] = useState<UserInfo[]>([]);
  const [speakingMap, setSpeakingMap] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [ping, setPing] = useState<number | null>(null);

  // metrics state shown in UI per peer
  const [metrics, setMetrics] = useState<{ [peerId: string]: PeerMetrics }>({});

  // keep prev stats to calculate deltas for bitrate / packet loss
  const statsPrevRef = useRef<
    Partial<{
      [peerId: string]: {
        timestamp: number;
        bytesReceived: number;
        bytesSent: number;
        packetsLost: number;
        packetsReceived: number;
      };
    }>
  >({});

  // connection banner state
  const [connectionBanner, setConnectionBanner] = useState<{
    visible: boolean;
    text: string;
  }>({ visible: false, text: "" });

  const config: RTCConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  /* ---------------- utility: end call / copy link ---------------- */
  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    Object.values(peersRef.current).forEach((peer) => {
      try {
        peer.close();
      } catch {}
    });

    peersRef.current = {};
    setRemoteAudios({});
    setUsers([]);
    setJoined(false);

    // disconnect socket (will stop reconnect attempts)
    socket.disconnect();

    window.location.href = "/";
  };

  const copyRoomLink = async () => {
    const link = `${
      window.location.origin
    }/room/${roomId}?name=${encodeURIComponent(name)}`;
    try {
      await navigator.clipboard.writeText(link);
      alert("✅ Room link copied!");
    } catch {
      alert("Failed to copy link ❌");
    }
  };

  /* ---------------- join room ---------------- */
  const joinRoom = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;

    if (localAudioRef.current) {
      localAudioRef.current.srcObject = stream;
      localAudioRef.current.muted = true;
    }

    setJoined(true);
    socket.emit("join", { roomId, userName: name });

    // start VAD emissions and metrics sampling
    startVAD(stream);
  };

  /* ---------------- add remote audio helper ---------------- */
  const addRemoteAudio = (userId: string, stream: MediaStream) => {
    setRemoteAudios((prev) => ({ ...prev, [userId]: stream }));
  };

  /* ---------------- ping-check (simple RTT to server) ---------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const start = Date.now();
      socket.emit("ping-check");
      socket.once("pong-check", () => {
        setPing(Date.now() - start);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- socket event handlers & peer setup ---------------- */
  useEffect(() => {
    if (!roomId) return;

    // users list w/ metadata
    socket.on("users-in-room", (userList: UserInfo[]) => {
      setUsers(userList);
      const m: { [key: string]: boolean } = {};
      userList.forEach((u) => (m[u.userId] = !!u.speaking));
      setSpeakingMap(m);
    });

    // existing members when we join -> create peers & offer
    socket.on("all-users", async (userIds: string[]) => {
      const stream = localStreamRef.current;
      for (const userId of userIds) {
        const peer = new RTCPeerConnection(config);
        peersRef.current[userId] = peer;

        // add local audio
        stream?.getTracks().forEach((track) => peer.addTrack(track, stream));

        // ICE
        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", {
              candidate: event.candidate,
              to: userId,
            });
          }
        };

        // remote audio
        peer.ontrack = (event) => addRemoteAudio(userId, event.streams[0]);

        // create & send offer
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("offer", { offer, to: userId });
      }
    });

    // someone joined after
    socket.on("user-joined", async (userId: string) => {
      const stream = localStreamRef.current;
      const peer = new RTCPeerConnection(config);
      peersRef.current[userId] = peer;

      stream?.getTracks().forEach((track) => peer.addTrack(track, stream));

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            to: userId,
          });
        }
      };

      peer.ontrack = (event) => addRemoteAudio(userId, event.streams[0]);
    });

    // handle offer -> answer
    socket.on(
      "offer",
      async (payload: { offer: RTCSessionDescriptionInit; from: string }) => {
        const { offer, from } = payload;
        let peer = peersRef.current[from];
        if (!peer) {
          peer = new RTCPeerConnection(config);
          peersRef.current[from] = peer;

          const stream = localStreamRef.current;
          stream?.getTracks().forEach((track) => peer.addTrack(track, stream));

          peer.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit("ice-candidate", {
                candidate: event.candidate,
                to: from,
              });
            }
          };

          peer.ontrack = (event) => addRemoteAudio(from, event.streams[0]);
        }

        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("answer", { answer, to: from });
      }
    );

    // handle answer to our offer
    socket.on(
      "answer",
      async (payload: { answer: RTCSessionDescriptionInit; from: string }) => {
        const { answer, from } = payload;
        const peer = peersRef.current[from];
        if (!peer) return;
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
      }
    );

    // remote ice candidate
    socket.on(
      "ice-candidate",
      async (payload: { candidate: RTCIceCandidateInit; from: string }) => {
        const { candidate, from } = payload;
        const peer = peersRef.current[from];
        if (!peer) return;
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Failed to add ICE Candidate:", err);
        }
      }
    );

    // user left
    socket.on("user-left", ({ userId }: { userId: string }) => {
      const peer = peersRef.current[userId];
      if (peer) {
        try {
          peer.close();
        } catch {}
        delete peersRef.current[userId];
      }
      setRemoteAudios((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      if (audioRefs.current[userId]) {
        try {
          audioRefs.current[userId]!.srcObject = null;
        } catch {}
        delete audioRefs.current[userId];
      }
      setUsers((prev) => prev.filter((u) => u.userId !== userId));
      // cleanup prev stats for that peer
      const prev = statsPrevRef.current;
      if (prev[userId]) delete prev[userId];
      setMetrics((m) => {
        const copy = { ...m };
        delete copy[userId];
        return copy;
      });
    });

    // speaking updates
    socket.on(
      "user-speaking",
      ({ userId, speaking }: { userId: string; speaking: boolean }) => {
        setSpeakingMap((prev) => ({ ...prev, [userId]: speaking }));
      }
    );

    /* ---------------- socket connection handling (banner + auto rejoin) ---------------- */
    const onDisconnect = (reason: string) => {
      console.warn("socket disconnected:", reason);
      setConnectionBanner({
        visible: true,
        text: "🔌 Connection lost — reconnecting...",
      });
    };

    const onReconnect = (attempt: number) => {
      console.log("socket reconnected on attempt", attempt);
      setConnectionBanner({ visible: false, text: "" });
      // re-join the room automatically so server re-sends user list and signaling events
      socket.emit("join", { roomId, userName: name });
    };

    socket.on("disconnect", onDisconnect);
    socket.on("reconnect", onReconnect);
    socket.on("reconnect_attempt", () => {
      setConnectionBanner({ visible: true, text: "🔌 Reconnecting..." });
    });
    socket.on("reconnect_error", () => {
      setConnectionBanner({
        visible: true,
        text: "🔌 Reconnect attempt failed...",
      });
    });

    /* ---------------- cleanup ---------------- */
    return () => {
      socket.off("users-in-room");
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-left");
      socket.off("user-speaking");

      socket.off("disconnect", onDisconnect);
      socket.off("reconnect", onReconnect);
      socket.off("reconnect_attempt");
      socket.off("reconnect_error");
    };
  }, [roomId, name]);

  /* ---------------- toggle mic ---------------- */
  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setMicEnabled(audioTrack.enabled);
    socket.emit("toggle-mic", { enabled: audioTrack.enabled, roomId });
  };

  /* ---------------- VAD (unchanged) ---------------- */
  const vadRef = useRef<{
    audioCtx?: AudioContext;
    analyser?: AnalyserNode;
    rafId?: number;
    lastEmit?: number;
  }>({});

  const startVAD = (stream: MediaStream) => {
    try {
      const AudioContextClass: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;

      const audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      vadRef.current.audioCtx = audioCtx;
      vadRef.current.analyser = analyser;
      vadRef.current.lastEmit = 0;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const THRESHOLD = 30;
      const EMIT_INTERVAL = 150;

      const check = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;

        const now = Date.now();
        const speaking = avg > THRESHOLD;

        if (
          !vadRef.current.lastEmit ||
          now - (vadRef.current.lastEmit || 0) > EMIT_INTERVAL
        ) {
          vadRef.current.lastEmit = now;
          socket.emit("speaking", { speaking, roomId });
        }

        vadRef.current.rafId = requestAnimationFrame(check);
      };

      vadRef.current.rafId = requestAnimationFrame(check);
    } catch (err) {
      console.warn("VAD start failed:", err);
    }
  };

  /* ---------------- Stats monitoring (getStats) ----------------
     We'll poll every STATS_INTERVAL_MS and update metrics state.
  ----------------------------------------------------------- */
  useEffect(() => {
    // let statsInterval: number | undefined;

    const collectStats = async () => {
      const peerIds = Object.keys(peersRef.current);
      const newMetrics: { [peerId: string]: PeerMetrics } = {};

      for (const peerId of peerIds) {
        const pc = peersRef.current[peerId];
        if (!pc) continue;

        try {
          const stats = await pc.getStats();
          let bytesReceived = 0;
          let bytesSent = 0;
          let packetsLost = 0;
          let packetsReceived = 0;
          let candidateRtt: number | undefined;

          stats.forEach((report) => {
            // inbound RTP (remote audio that we receive)
            if (
              report.type === "inbound-rtp" &&
              (report as RTCRtpStreamStats).kind === "audio"
            ) {
              const r = report as RTCRtpStreamStats & {
                bytesReceived?: number;
                packetsLost?: number;
                packetsReceived?: number;
                timestamp?: number;
              };
              bytesReceived = (r.bytesReceived as number) || bytesReceived;
              packetsLost = (r.packetsLost as number) || packetsLost;
              packetsReceived =
                (r.packetsReceived as number) || packetsReceived;
            }

            // outbound RTP (what we send to that peer)
            if (
              report.type === "outbound-rtp" &&
              (report as RTCRtpStreamStats).kind === "audio"
            ) {
              const r = report as RTCRtpStreamStats & {
                bytesSent?: number;
                timestamp?: number;
              };
              bytesSent = (r.bytesSent as number) || bytesSent;
            }

            // candidate pair -> RTT (currentRoundTripTime is in seconds)
            if (
              report.type === "candidate-pair" &&
              report.state === "succeeded"
            ) {
              const r = report as RTCIceCandidatePairStats & {
                currentRoundTripTime?: number;
              };
              if (typeof r.currentRoundTripTime === "number") {
                candidateRtt = r.currentRoundTripTime * 1000;
              }
            }
          });

          const now = Date.now();
          const prev = statsPrevRef.current[peerId];

          let inboundKbps: number | undefined;
          let outboundKbps: number | undefined;
          let packetLossPct: number | undefined;

          if (prev && prev.timestamp) {
            const dt = (now - prev.timestamp) / 1000; // seconds
            if (dt > 0) {
              inboundKbps =
                ((bytesReceived - (prev.bytesReceived || 0)) * 8) / dt / 1000;
              outboundKbps =
                ((bytesSent - (prev.bytesSent || 0)) * 8) / dt / 1000;

              const lostDelta = packetsLost - (prev.packetsLost || 0) || 0;
              const recvDelta =
                packetsReceived - (prev.packetsReceived || 0) || 0;
              const total = lostDelta + recvDelta;
              if (total > 0) {
                packetLossPct = (lostDelta / total) * 100;
              } else {
                packetLossPct = 0;
              }
            }
          }

          // store current for next round
          statsPrevRef.current[peerId] = {
            timestamp: now,
            bytesReceived,
            bytesSent,
            packetsLost,
            packetsReceived,
          };

          newMetrics[peerId] = {
            rttMs: candidateRtt,
            inboundKbps: inboundKbps
              ? Math.max(0, +inboundKbps.toFixed(1))
              : undefined,
            outboundKbps: outboundKbps
              ? Math.max(0, +outboundKbps.toFixed(1))
              : undefined,
            packetLossPct: packetLossPct ? +packetLossPct.toFixed(2) : 0,
            lastUpdated: now,
          };
        } catch {
          // ignore per-peer stats errors
        }
      }

      // merge with previous metrics
      setMetrics((prev) => ({ ...prev, ...newMetrics }));
    };

    // statsInterval = window.setInterval(collectStats, STATS_INTERVAL_MS);
    const interval = window.setInterval(collectStats, STATS_INTERVAL_MS);

    collectStats().catch(() => {});

    return () => clearInterval(interval);
    // return () => {
    //   if (statsInterval) clearInterval(statsInterval);
    // };
  }, [roomId]);

  /* ---------------- Auto reconnect visual (banner) behavior ---------------- */
  useEffect(() => {
    const checkConnection = () => {
      if (!socket.connected) {
        setConnectionBanner({
          visible: true,
          text: "🔌 Connection lost — reconnecting...",
        });
      } else {
        setConnectionBanner({ visible: false, text: "" });
      }
    };

    const interval = window.setInterval(checkConnection, RECONNECT_INTERVAL_MS);
    checkConnection();

    return () => clearInterval(interval);
  }, []);

  /* ---------------- UserCard with expanded metrics ---------------- */
  const UserCard = ({ u }: { u: UserInfo }) => {
    const speaking = speakingMap[u.userId] || false;
    const micOff = !u.micEnabled;
    const initial = u.name && u.name[0] ? u.name[0].toUpperCase() : "?";
    const m = metrics[u.userId];

    const className = `user-card ${speaking ? "speaking" : ""} ${
      micOff ? "muted" : ""
    }`;

    return (
      <div className={className}>
        <div className="avatar">{initial}</div>

        <div className="info">
          <div className="name">
            {u.name === name ? `${u.name} (You)` : u.name}
          </div>
          <div className="mic-status">
            {u.micEnabled ? "🎤 On" : "🔇 Muted"}
          </div>

          {/* Expanded Metrics Card */}
          <div className="metrics-card">
            <div className="metric-row">
              <div className="metric-label">RTT</div>
              <div className="metric-value">
                {m?.rttMs ? `${Math.round(m.rttMs)} ms` : "--"}
              </div>
            </div>
            <div className="metric-row">
              <div className="metric-label">Inbound</div>
              <div className="metric-value">
                {m?.inboundKbps ? `${m.inboundKbps} kbps` : "--"}
              </div>
            </div>
            <div className="metric-row">
              <div className="metric-label">Outbound</div>
              <div className="metric-value">
                {m?.outboundKbps ? `${m.outboundKbps} kbps` : "--"}
              </div>
            </div>
            <div className="metric-row">
              <div className="metric-label">Packet Loss</div>
              <div className="metric-value">
                {typeof m?.packetLossPct === "number"
                  ? `${m.packetLossPct}%`
                  : "--"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // attach remote audio srcObject when remoteAudios updates
  useEffect(() => {
    for (const [id, stream] of Object.entries(remoteAudios)) {
      const el = audioRefs.current[id];
      if (el) el.srcObject = stream;
    }
  }, [remoteAudios]);

  return (
    <div className="room-page">
      {/* Banner */}
      {connectionBanner.visible && (
        <div className="connection-banner">{connectionBanner.text}</div>
      )}

      <header className="room-header">
        <h1>Room: {roomId}</h1>

        <div className="actions">
          {!joined ? (
            <button className="btn primary" onClick={joinRoom}>
              Join Call
            </button>
          ) : (
            <>
              <div className="connection-info">
                <span className="status connected">Connected ✅</span>
                <span className="ping">Ping: {ping ?? "--"} ms</span>
              </div>
            </>
          )}

          {joined && (
            <>
              <button className="btn" onClick={toggleMic}>
                {micEnabled ? "Mute 🔇" : "Unmute 🎤"}
              </button>

              <button className="btn" onClick={copyRoomLink}>
                Copy Link 🔗
              </button>

              <button className="btn danger" onClick={endCall}>
                End Call ❌
              </button>
            </>
          )}
        </div>
      </header>

      <section className="participants">
        <h2>Participants</h2>
        <div className="users-grid">
          {users.map((u) => (
            <div key={u.userId} className="user-wrapper">
              <UserCard u={u} />
              <audio
                autoPlay
                ref={(el) => {
                  audioRefs.current[u.userId] = el;
                  const s = remoteAudios[u.userId];
                  if (el && s) el.srcObject = s;
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="local-monitor">
        <h2>Your Voice Monitor</h2>
        <audio ref={localAudioRef} autoPlay />
      </section>
    </div>
  );
}
