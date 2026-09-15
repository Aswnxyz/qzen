"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";

interface QueueQRCodeProps {
  businessSlug: string;
  queueSlug: string;
}

export default function QueueQRCode({
  businessSlug,
  queueSlug,
}: QueueQRCodeProps) {
  const [qrCode, setQrCode] = useState("");
  const [error, setError] = useState("");

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${businessSlug}/${queueSlug}`
      : "";

  useEffect(() => {
    if (!joinUrl) {
      return;
    }

    async function generateQRCode() {
      try {
        const dataUrl = await QRCode.toDataURL(joinUrl, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "H",
        });

        setQrCode(dataUrl);
      } catch (error) {
        console.error("QR code generation error:", error);
        setError("Failed to generate QR code.");
      }
    }

    generateQRCode();
  }, [joinUrl]);

  function downloadQRCode() {
    const link = document.createElement("a");

    link.href = qrCode;
    link.download = `qzen-${queueSlug}-qr.png`;

    link.click();
  }
  function printQRCode() {
    window.print();
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!qrCode) {
    return <p className="text-sm text-zinc-500">Generating QR code...</p>;
  }

  return (
    <div className="text-center">
      <Image
        src={qrCode}
        alt={`QR code for ${queueSlug}`}
        width={256}
        height={256}
        className="mx-auto h-64 w-64"
      />
      <div className="mt-6 flex justify-center gap-3 print:hidden">
        <button
          onClick={downloadQRCode}
          className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Download QR
        </button>

        <button
          onClick={printQRCode}
          className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
        >
          Print QR
        </button>
      </div>
      <p className="mt-4 break-all text-xs text-zinc-500 print:hidden">
        {joinUrl}
      </p>{" "}
    </div>
  );
}
