"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { Send, UserCircle2, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export function CohortChat({ 
  toolkitId, 
  currentUserId, 
  mentorId, 
  initialRoomId,
  headerName,
  headerImage
}: { 
  toolkitId?: string, 
  currentUserId: string, 
  mentorId?: string, 
  initialRoomId?: string,
  headerName?: string,
  headerImage?: string
}) {
  const [roomId, setRoomId] = useState<string | null>(initialRoomId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [mentorDetails, setMentorDetails] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to socket to the standalone socket server
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const defaultSocketUrl = `http://${hostname}:3001`;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || defaultSocketUrl;
    
    socketRef.current = io(socketUrl, {
      reconnectionAttempts: 3
    });

    socketRef.current.on("connect", () => {
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Robustly join the room when connected and roomId is available
  useEffect(() => {
    if (isConnected && roomId && socketRef.current) {
      // Leave previous room if any (socket.io handles this gracefully on server side, but good practice to emit a leave if we had one)
      socketRef.current.emit("join_room", roomId);
    }
  }, [isConnected, roomId]);

  useEffect(() => {
    // Fetch mentor details
    if (mentorId) {
      axios.get(`/api/mentors/${mentorId}`)
        .then(res => setMentorDetails(res.data))
        .catch(err => console.error("Failed to fetch mentor", err));
    }
  }, [mentorId]);

  useEffect(() => {
    // Initialize or fetch room
    const initChat = async () => {
      try {
        let room = initialRoomId;
        if (!room && toolkitId && mentorId) {
          const res = await axios.post("/api/chat/rooms", { toolkitId, mentorId });
          room = res.data.room?.id;
        }
        
        if (room) {
          setRoomId(room);
          // join_room is now handled by the robust useEffect above
          const msgRes = await axios.get(`/api/chat/messages?roomId=${room}`);
          setMessages(msgRes.data.messages);
        }
      } catch (err) {
        console.error("Failed to init chat", err);
      } finally {
        setLoading(false);
      }
    };
    if (initialRoomId || (toolkitId && mentorId)) initChat();
  }, [toolkitId, mentorId, initialRoomId]);

  useEffect(() => {
    if (!socketRef.current) return;

    const handleReceive = (msg: Message) => {
      setMessages((prev) => {
        // Prevent duplicate messages
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socketRef.current.on("receive_message", handleReceive);

    return () => {
      socketRef.current?.off("receive_message", handleReceive);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId) return;

    const content = newMessage;
    setNewMessage(""); // optimistic clear

    try {
      const res = await axios.post("/api/chat/messages", { roomId, content });
      const savedMessage = res.data.message;
      setMessages((prev) => [...prev, savedMessage]);
      
      socketRef.current?.emit("send_message", {
        roomId,
        message: savedMessage
      });
    } catch (err) {
      console.error("Failed to send message", err);
      setNewMessage(content); // restore on fail
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#FFF4EC] min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff5e14]"></div>
        <p className="mt-4 text-gray-500 font-medium">Connecting to chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full flex-1 bg-[#FFF4EC] relative overflow-hidden">
      {/* WhatsApp-style Header */}
      <div className="flex items-center px-4 py-3 bg-white border-b shadow-sm z-10 sticky top-0">
        <Avatar className="h-10 w-10 mr-3 border-2 border-gray-100">
          <AvatarImage src={headerImage || mentorDetails?.mentorImage} alt={headerName || mentorDetails?.mentorName || "Chat"} />
          <AvatarFallback className="bg-orange-100 text-[#ff5e14]">
            {(headerName || mentorDetails?.mentorName)?.charAt(0) || <UserCircle2 className="h-6 w-6" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <h3 className="font-semibold text-gray-900 leading-tight">
            {headerName || mentorDetails?.mentorName || "Your Mentor"}
          </h3>
          <p className="text-xs font-medium text-gray-500 flex items-center">
            {isConnected ? (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                Connected
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-gray-400 rounded-full mr-1.5"></span>
                Offline
              </>
            )}
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 scroll-smooth" style={{ backgroundImage: "url('https://pub-a2d956f6fdd5468b8e57c6aa4b76ec9f.r2.dev/subtle-pattern-opacity.png')", backgroundBlendMode: "overlay" }}>
        {messages.length === 0 ? (
          <div className="flex justify-center mt-6">
            <div className="bg-[#ffebde] text-[#d64c0e] px-4 py-2 rounded-lg text-sm text-center font-medium max-w-[280px] shadow-sm">
              This is the start of your conversation with {mentorDetails?.mentorName || "your mentor"}. Say hi!
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUserId;
            // Determine if we need to show the tail based on the previous message sender
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`
                    relative px-3 pt-2 pb-1.5 max-w-[85%] md:max-w-[70%] shadow-sm
                    ${isMe 
                      ? 'bg-[#ff5e14] text-white' 
                      : 'bg-white text-gray-800'
                    }
                    ${isMe && isFirstInGroup ? 'rounded-tl-xl rounded-bl-xl rounded-tr-xl' : ''}
                    ${isMe && !isFirstInGroup ? 'rounded-xl' : ''}
                    ${!isMe && isFirstInGroup ? 'rounded-tr-xl rounded-br-xl rounded-tl-xl' : ''}
                    ${!isMe && !isFirstInGroup ? 'rounded-xl' : ''}
                  `}
                >
                  {/* WhatsApp style tails for the first message in a group */}
                  {isFirstInGroup && isMe && (
                    <div className="absolute top-0 -right-2 w-3 h-4 bg-[#ff5e14] [clip-path:polygon(0_0,0%_100%,100%_0)]" />
                  )}
                  {isFirstInGroup && !isMe && (
                    <div className="absolute top-0 -left-2 w-3 h-4 bg-white [clip-path:polygon(100%_0,0_0,100%_100%)]" />
                  )}
                  
                  <div className="flex flex-col">
                    <p className="text-[15px] leading-relaxed break-words mr-10">{msg.content}</p>
                    <div className={`flex items-center justify-end gap-1 -mt-2 -mr-1 ${isMe ? 'text-orange-200' : 'text-gray-400'}`}>
                      <span className="text-[10px] uppercase font-medium">{formatTime(msg.createdAt)}</span>
                      {isMe && <CheckCheck className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>
      
      {/* Input Area */}
      <div className="bg-[#f0f2f5] p-3 md:p-4 border-t z-10">
        <form onSubmit={sendMessage} className="flex gap-2 max-w-4xl mx-auto items-end">
          <div className="flex-1 bg-white rounded-2xl flex items-center shadow-sm overflow-hidden min-h-[44px]">
            <input 
              type="text" 
              placeholder="Type a message" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none border-none text-gray-700 placeholder-gray-400"
              autoComplete="off"
            />
          </div>
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-[#ff5e14] text-white p-3 rounded-full hover:bg-[#e04f0d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center h-[44px] w-[44px] shadow-sm"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
