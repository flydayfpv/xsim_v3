'use client';
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import TimerCountdown from "@/app/lib/TimerCountdown";
import Swal from "sweetalert2";

export default function Page() {
  const params = useParams();
  const [user, setUser] = useState(null);

  const canvasRef1 = useRef(null);
  const canvasRef2 = useRef(null);

  // Changed from arrays [] to single objects null
  const [lastRect1, setLastRect1] = useState(null);
  const [lastRect2, setLastRect2] = useState(null);

  const [isDrawing, setIsDrawing] = useState(false); // stores 1 or 2
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setUser(JSON.parse(userStr));

    // Redraw whenever the lastRect state changes
    drawAll(canvasRef1.current, lastRect1);
    drawAll(canvasRef2.current, lastRect2);
  }, [lastRect1, lastRect2]);

  const drawAll = (canvas, savedRect, previewRect = null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ONLY the last saved rectangle (Solid Red)
    if (savedRect) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 3;
      ctx.strokeRect(savedRect.x, savedRect.y, savedRect.w, savedRect.h);
    }

    // Draw the active dragging rectangle (Dashed Blue)
    if (previewRect) {
      ctx.strokeStyle = "blue";
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(previewRect.x, previewRect.y, previewRect.w, previewRect.h);
      ctx.setLineDash([]);
    }
  };

  const handleMouseDown = (e, canvasId) => {
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(canvasId);
    setStartPos({ x, y });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const canvas = isDrawing === 1 ? canvasRef1.current : canvasRef2.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRect = {
      x: startPos.x,
      y: startPos.y,
      w: x - startPos.x,
      h: y - startPos.y
    };

    setCurrentRect(newRect);
    // Real-time preview while dragging
    drawAll(canvas, isDrawing === 1 ? lastRect1 : lastRect2, newRect);

  };

  const handleMouseUp = () => {
    if (!isDrawing) return;

    if (currentRect) {
      // Overwrite the previous rectangle with the new one
      if (isDrawing === 1) setLastRect1(currentRect);
      else setLastRect2(currentRect);


    }

    setIsDrawing(false);
    setCurrentRect(null);
  };


    const handleTimeUp = () => {
      console.log("Time is up!");

      Swal.fire({
        icon: 'warning',
        title: 'TIMEOUT',
        html: 'The operation time has expired.',
        confirmButtonText: 'OK',
        // Adding custom classes
        customClass: {
          title: 'swal-title-large',
          htmlContainer: 'swal-text-large',
          confirmButton: 'swal-button-large'
        }
      }).then(() => {
        console.log("User confirmed time up action.");
      });
    };



    return (
      <div className="flex flex-col h-screen w-full m-0 p-0 overflow-hidden bg-black font-sans"
        onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>

        {/* Top Section */}
        <div className="flex flex-row h-[85%] w-full gap-2 p-2">
          <div className="w-[45%] h-full relative">
            <canvas
              ref={canvasRef1}
              width={1000} height={800} // Higher resolution
              onMouseDown={(e) => handleMouseDown(e, 1)}
              className="w-full h-full rounded-xl border-2 border-gray-600 bg-white cursor-crosshair"
            />
          </div>

          <div className="w-[45%] h-full relative">
            <canvas
              ref={canvasRef2}
              width={1000} height={800}
              onMouseDown={(e) => handleMouseDown(e, 2)}
              className="w-full h-full rounded-xl border-2 border-gray-600 bg-white cursor-crosshair"
            />
          </div>

          <div className="w-[10%] h-full rounded-xl border border-blue-300 bg-gray-900 flex items-center justify-center">
            <p className="text-blue-300 font-bold -rotate-90">SIDE PANEL</p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-2 h-[15%] w-full">
          <div className="grid grid-cols-5 gap-4 h-full w-full rounded-xl border border-gray-400 bg-gray-800 p-4 items-center">
            <div className="flex h-full bg-gray-700 rounded-lg overflow-hidden text-white">
              <button className="w-1/3 h-full hover:bg-gray-600 border-r border-gray-500">P1</button>
              <button className="w-1/3 h-full hover:bg-gray-600 border-r border-gray-500">P2</button>
              <button className="w-1/3 h-full hover:bg-red-600" onClick={() => { setLastRect1(null); setLastRect2(null); }}>Reset</button>
            </div>
            <div className="flex items-center justify-center h-full bg-gray-700 rounded-lg text-white font-bold tracking-widest">
              {isDrawing ? "DRAWING..." : "READY"}
            </div>
            <div className="text-blue-300 font-bold text-xl text-center border-r border-gray-600">
              {lastRect1 || lastRect2 ? "Set" : "none"}
            </div>
            <TimerCountdown initialMinutes={1} onTimeUp={() => handleTimeUp()} />
            <div className="text-right">
              <span className="text-xs text-blue-400 block uppercase">Operator</span>
              <span className="text-blue-100 font-bold text-lg">{user?.fname || 'Guest'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }