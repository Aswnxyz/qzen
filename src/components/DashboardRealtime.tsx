"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

interface DashboardRealtimeProps {
  queueId: string;
}

export default function DashboardRealtime({
  queueId,
}: DashboardRealtimeProps) {
  const router = useRouter();

  useEffect(() => {
    const socket = io();

    socket.on("connect", () => {
      console.log("Dashboard socket connected:", socket.id);

      socket.emit("joinQueue", queueId);
    });

    socket.on("queueUpdated", () => {
      console.log("Dashboard queue updated");

      router.refresh();
    });

    return () => {
      socket.disconnect();
    };
  }, [queueId, router]);

  return null;
}