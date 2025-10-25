// V1
// "use client";
// import { useEffect, useRef, useState } from "react";
// import io from "socket.io-client";

import Link from "next/link"

// const socket = io("http://localhost:5000"); // Connect to Express Signaling Server
// const roomId = "room1"; // Temporary room id

// export default function Home() {
//   const localAudioRef = useRef<HTMLAudioElement | null>(null);
//   const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
//   const [micEnabled, setMicEnabled] = useState(true);

//   const pcRef = useRef<RTCPeerConnection | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);

//   const [joined, setJoined] = useState(false);
//   const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
//   const [remoteAudios, setRemoteAudios] = useState<{
//     [key: string]: MediaStream;
//   }>({});
//   const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

//   const config = {
//     iceServers: [
//       { urls: "stun:stun.l.google.com:19302" }, // Free STUN server
//     ],
//   };

//   const joinRoom = async () => {
//     setJoined(true);

//     // طلب إذن المايك
//     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     localStreamRef.current = stream;

//     if (localAudioRef.current) {
//       localAudioRef.current.srcObject = stream;
//       localAudioRef.current.muted = true; // عشان تسمعش صوت نفسك
//     }

//     pcRef.current = new RTCPeerConnection(config);

//     stream.getTracks().forEach((track) => {
//       pcRef.current?.addTrack(track, stream);
//     });

//     pcRef.current.ontrack = (event) => {
//       if (remoteAudioRef.current) {
//         remoteAudioRef.current.srcObject = event.streams[0];
//       }
//     };

//     pcRef.current.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit("ice-candidate", {
//           candidate: event.candidate,
//           to: otherUser.current,
//         });
//       }
//     };

//     socket.emit("join", roomId);
//   };

//   const otherUser = useRef<string | null>(null);

//   const addRemoteAudio = (userId: string, stream: MediaStream) => {
//     setRemoteAudios((prev) => ({
//       ...prev,
//       [userId]: stream,
//     }));
//   };

//   useEffect(() => {
//     // socket.on("user-joined", async (userId: string) => {
//     //   otherUser.current = userId;
//     //   console.log("user joined:", userId);

//     //   const pc = pcRef.current;
//     //   if (!pc) return;

//     //   const offer = await pc.createOffer();
//     //   await pc.setLocalDescription(offer);

//     //   socket.emit("offer", {
//     //     offer,
//     //     to: userId,
//     //   });
//     // });

//     // socket.on(
//     //   "offer",
//     //   async ({
//     //     offer,
//     //     from,
//     //   }: {
//     //     offer: RTCSessionDescriptionInit;
//     //     from: string;
//     //   }) => {
//     //     otherUser.current = from;
//     //     const pc = pcRef.current;
//     //     if (!pc) return;

//     //     await pc.setRemoteDescription(new RTCSessionDescription(offer));
//     //     const answer = await pc.createAnswer();
//     //     await pc.setLocalDescription(answer);

//     //     socket.emit("answer", {
//     //       answer,
//     //       to: from,
//     //     });
//     //   }
//     // );

//     // socket.on(
//     //   "answer",
//     //   async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
//     //     const pc = pcRef.current;
//     //     if (!pc) return;

//     //     await pc.setRemoteDescription(new RTCSessionDescription(answer));
//     //   }
//     // );

//     // socket.on(
//     //   "ice-candidate",
//     //   async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
//     //     const pc = pcRef.current;
//     //     if (!pc) return;

//     //     try {
//     //       await pc.addIceCandidate(new RTCIceCandidate(candidate));
//     //     } catch (e) {
//     //       console.error("Error adding ice candidate", e);
//     //     }
//     //   }
//     // );

//     socket.on("user-joined", async (userId: string) => {
//       const stream = localStreamRef.current;

//       const peer = new RTCPeerConnection(config);
//       peersRef.current[userId] = peer;

//       stream?.getTracks().forEach((track) => {
//         peer.addTrack(track, stream);
//       });

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
//         const peer = peersRef.current[from];
//         if (!peer) return;

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
//           console.error(err);
//         }
//       }
//     );

//     // socket.on("user-left", () => {
//     //   remoteAudioRef.current!.srcObject = null;
//     //   otherUser.current = null;
//     // });

//     socket.on("user-left", ({ userId }: { userId: string }) => {
//       delete peersRef.current[userId];
//       setRemoteAudios((prev) => {
//         const updated = { ...prev };
//         delete updated[userId];
//         return updated;
//       });
//     });

//     socket.on("toggle-mic", ({ enabled }: { enabled: boolean }) => {
//       if (remoteAudioRef.current?.srcObject) {
//         console.log("Other mic:", enabled);
//         const remoteStream = remoteAudioRef.current.srcObject as MediaStream;
//         const remoteAudioTrack = remoteStream.getAudioTracks()[0];
//         if (remoteAudioTrack) {
//           remoteAudioTrack.enabled = enabled;
//         }
//       }
//     });

//     socket.on("all-users", async (users: string[]) => {
//       const stream = localStreamRef.current;
//       users.forEach(async (userId) => {
//         const peer = new RTCPeerConnection(config);
//         peersRef.current[userId] = peer;

//         stream?.getTracks().forEach((track) => {
//           peer.addTrack(track, stream);
//         });

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
//       });
//     });
//   }, []);

//   const toggleMic = () => {
//     if (!localStreamRef.current) return;

//     const audioTrack = localStreamRef.current.getAudioTracks()[0];

//     audioTrack.enabled = !audioTrack.enabled;
//     setMicEnabled(audioTrack.enabled);

//     socket.emit("toggle-mic", {
//       enabled: audioTrack.enabled,
//       to: otherUser.current,
//     });
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <h1>Voice Chat App</h1>
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
//       <audio ref={localAudioRef} autoPlay></audio>
//       {/* <h3>Friends Voice</h3>
//       <audio ref={remoteAudioRef} autoPlay></audio> */}
//       <h3>Others</h3>
//       {Object.entries(remoteAudios).map(([id, stream]) => (
//         <audio
//           key={id}
//           autoPlay
//           ref={(el) => {
//             if (el) {
//               audioRefs.current[id] = el;
//               el.srcObject = stream;
//             }
//           }}
//         ></audio>
//       ))}{" "}
//     </div>
//   );
// }

// V2
// "use client";
// import { useEffect, useRef, useState } from "react";
// import io from "socket.io-client";

// const socket = io("http://localhost:5000"); // Connect to Express Signaling Server
// const roomId = "room1"; // Temporary room id

// export default function Home() {
//   const localAudioRef = useRef<HTMLAudioElement | null>(null);
//   const [micEnabled, setMicEnabled] = useState(true);

//   const localStreamRef = useRef<MediaStream | null>(null);
//   const [joined, setJoined] = useState(false);

//   // peers: map userId -> RTCPeerConnection
//   const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
//   // remote audio streams map userId -> MediaStream
//   const [remoteAudios, setRemoteAudios] = useState<{
//     [key: string]: MediaStream;
//   }>({});
//   // refs to actual audio elements so we can set srcObject and control tracks
//   const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

//   const config: RTCConfiguration = {
//     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//   };

//   const joinRoom = async () => {
//     // get mic permission and local stream
//     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     localStreamRef.current = stream;

//     if (localAudioRef.current) {
//       localAudioRef.current.srcObject = stream;
//       localAudioRef.current.muted = true;
//     }

//     setJoined(true);
//     // notify server to join room
//     socket.emit("join", roomId);
//   };

//   const addRemoteAudio = (userId: string, stream: MediaStream) => {
//     setRemoteAudios((prev) => ({ ...prev, [userId]: stream }));
//   };

//   useEffect(() => {
//     // When server tells us who is already in the room -> create peer for each and send offer
//     socket.on("all-users", async (users: string[]) => {
//       const stream = localStreamRef.current;
//       for (const userId of users) {
//         // create peer
//         const peer = new RTCPeerConnection(config);
//         peersRef.current[userId] = peer;

//         // add local tracks
//         stream?.getTracks().forEach((track) => peer.addTrack(track, stream));

//         // ICE -> send candidate to that user
//         peer.onicecandidate = (event) => {
//           if (event.candidate) {
//             socket.emit("ice-candidate", {
//               candidate: event.candidate,
//               to: userId,
//             });
//           }
//         };

//         // when remote track arrives -> store it
//         peer.ontrack = (event) => {
//           addRemoteAudio(userId, event.streams[0]);
//         };

//         // create offer and send
//         const offer = await peer.createOffer();
//         await peer.setLocalDescription(offer);
//         socket.emit("offer", { offer, to: userId });
//       }
//     });

//     // When an existing user is notified that someone joined, they will expect to create a peer (handled above by "all-users"),
//     // but when we receive "user-joined" it means *someone else* joined after us; create a peer but don't send offer immediately.
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
//       // Note: the new user (who joined) will create the offer to us (via "all-users" flow) so we wait for "offer".
//     });

//     // When we receive an offer from a peer -> set remote desc and answer
//     socket.on(
//       "offer",
//       async ({
//         offer,
//         from,
//       }: {
//         offer: RTCSessionDescriptionInit;
//         from: string;
//       }) => {
//         // ensure peer exists (peer should have been created in user-joined or all-users)
//         let peer = peersRef.current[from];
//         if (!peer) {
//           // fallback: create peer
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

//     // When we receive an answer to an offer we sent
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

//     // ICE candidate from remote peer
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

//     // handle someone leaving
//     socket.on("user-left", ({ userId }: { userId: string }) => {
//       // close and delete peer connection
//       const peer = peersRef.current[userId];
//       if (peer) {
//         try {
//           peer.close();
//         } catch {}
//         delete peersRef.current[userId];
//       }

//       // remove audio stream and audio element ref
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

//     // toggle-mic broadcast: get who toggled and the state
//     socket.on(
//       "toggle-mic",
//       ({ enabled, userId }: { enabled: boolean; userId: string }) => {
//         const el = audioRefs.current[userId];
//         if (el && el.srcObject) {
//           const stream = el.srcObject as MediaStream;
//           const track = stream.getAudioTracks()[0];
//           if (track) {
//             try {
//               track.enabled = enabled;
//             } catch {}
//           } else {
//             // fallback: use element volume if no track
//             el.volume = enabled ? 1 : 0;
//           }
//         }
//       }
//     );

//     // cleanup on unmount
//     return () => {
//       socket.off("all-users");
//       socket.off("user-joined");
//       socket.off("offer");
//       socket.off("answer");
//       socket.off("ice-candidate");
//       socket.off("user-left");
//       socket.off("toggle-mic");
//     };
//   }, []);

//   const toggleMic = () => {
//     if (!localStreamRef.current) return;

//     const audioTrack = localStreamRef.current.getAudioTracks()[0];
//     if (!audioTrack) return;

//     audioTrack.enabled = !audioTrack.enabled;
//     setMicEnabled(audioTrack.enabled);

//     // broadcast to whole room (server will forward to all in that room)
//     socket.emit("toggle-mic", { enabled: audioTrack.enabled, roomId });
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <h1>Voice Chat App</h1>

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

function Home() {
  return (
    <div>
      <Link href="/join">Join page</Link>
      <Link href="/room/1">Room page</Link>
    </div>
  )
}

export default Home