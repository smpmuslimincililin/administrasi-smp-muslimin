// src/attendance-teacher/QRCodeGenerator.js
import React, { useState, useRef, useEffect } from "react";
import { Download, RefreshCw } from "lucide-react";

const QRCodeGenerator = () => {
  const qrCode = "QR_PRESENSI_GURU_SMP_MUSLIMIN_CILILIN";
  const [qrUrl, setQrUrl] = useState("");
  const [finalQrUrl, setFinalQrUrl] = useState("");
  const canvasRef = useRef(null);

  const generateQR = () => {
    // Using QR Server API to generate QR code - high resolution
    const size = 600;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
      qrCode
    )}`;
    setQrUrl(url);
  };

  useEffect(() => {
    if (qrUrl && canvasRef.current) {
      addBorderAndBranding();
    }
  }, [qrUrl]);

  const addBorderAndBranding = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const qrSize = 600;
    const padding = 40;
    const bottomSpace = 150; // Space for logo and text
    const width = qrSize + padding * 2;
    const height = qrSize + padding * 2 + bottomSpace;

    canvas.width = width;
    canvas.height = height;

    // Draw white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    // Draw outer border
    ctx.strokeStyle = "#1e40af";
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Draw inner border (double border effect)
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";

    qrImg.onload = () => {
      // Draw QR code (no logo in center - clean for scanning)
      ctx.drawImage(qrImg, padding, padding, qrSize, qrSize);

      // Draw separator line
      const lineY = padding + qrSize + 15;
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, lineY);
      ctx.lineTo(width - 40, lineY);
      ctx.stroke();

      // Load and draw school logo at bottom
      const logo = new Image();
      logo.onload = () => {
        const logoSize = 80;
        const logoX = (width - logoSize) / 2;
        const logoY = lineY + 20;

        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

        // Draw school name below logo
        ctx.fillStyle = "#1e40af";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const fontSize = 20;
        ctx.font = `bold ${fontSize}px Arial`;

        const textY = logoY + logoSize + 8;
        ctx.fillText("SMP MUSLIMIN CILILIN", width / 2, textY);

        // Convert canvas to data URL
        setFinalQrUrl(canvas.toDataURL("image/png"));
      };

      logo.onerror = () => {
        console.error("Gagal load logo sekolah");
        // Fallback: tampilkan text saja tanpa logo
        ctx.fillStyle = "#1e40af";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const fontSize = 24;
        ctx.font = `bold ${fontSize}px Arial`;

        const textY = lineY + 40;
        ctx.fillText("SMP MUSLIMIN CILILIN", width / 2, textY);

        setFinalQrUrl(canvas.toDataURL("image/png"));
      };

      logo.src = "/logo_sekolah.PNG";
    };

    qrImg.src = qrUrl;
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = finalQrUrl;
    link.download = `QR_Presensi_Guru_SMP_MUSLIMIN.png`;
    link.click();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          🎯 Generator QR Presensi Guru
        </h1>
        <p className="text-gray-600">
          Generate QR Code untuk sistem presensi guru SMP MUSLIMIN CILILIN
        </p>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateQR}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 mb-6">
        <RefreshCw size={20} />
        Generate QR Code
      </button>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* QR Code Display */}
      {finalQrUrl && (
        <div className="space-y-4">
          <div className="border-4 border-blue-500 rounded-lg p-4 bg-gray-50">
            <img
              src={finalQrUrl}
              alt="QR Code"
              className="w-full max-w-md mx-auto"
            />
            <p className="text-center text-sm text-gray-600 mt-2">
              QR CODE SMP MUSLIMIN CILILIN
            </p>
          </div>

          {/* Code Info */}
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">
              <strong>Kode:</strong>
            </p>
            <p className="font-mono text-sm bg-white px-3 py-2 rounded border border-gray-300">
              {qrCode}
            </p>
          </div>

          {/* Download Button */}
          <button
            onClick={downloadQR}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
            <Download size={20} />
            Download QR Code
          </button>
        </div>
      )}

      {/* Warning */}
      <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">
          <strong>⚠️ Penting:</strong> QR Code ini statis untuk testing. Untuk
          keamanan lebih baik, gunakan QR Code dinamis yang berubah setiap hari!
        </p>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
