"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';

// --- Utility: Ray-casting Algorithm ---
const isPointInPolygon = (point, vs) => {
    const { x, y } = point;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i].x, yi = vs[i].y;
        const xj = vs[j].x, yj = vs[j].y;
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

export default function XSimV3XLEditor() {
    // กำหนดขนาด Canvas ใหญ่พิเศษ (XL)
    const CW = 800;
    const CH = 600;
    
    const topCanvasRef = useRef(null);
    const sideCanvasRef = useRef(null);

    const [images, setImages] = useState({ bgTop: null, bgSide: null, itemTop: null, itemSide: null });
    const [topPolygon, setTopPolygon] = useState([]);
    const [sidePolygon, setSidePolygon] = useState([]);
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [activeCanvas, setActiveCanvas] = useState('top');

    const [rects, setRects] = useState({
        x: 150, w: 180,
        topY: 150, topH: 180,
        sideZ: 150, sideH: 180
    });

    const [dragState, setDragState] = useState({ isActive: false, view: null, mode: null, offset: { x: 0, y: 0 } });

    const handleFileChange = (e, key) => {
        const file = e.target.files[0];
        if (file) {
            const img = new Image();
            img.onload = () => {
                setImages(prev => ({ ...prev, [key]: img }));
                if (key.includes('item')) {
                    setRects(p => ({ ...p, w: img.width, [key === 'itemTop' ? 'topH' : 'sideH']: img.height }));
                }
            };
            img.src = URL.createObjectURL(file);
        }
    };

    const autoPlaceSync = () => {
        if (!images.itemTop || !images.itemSide) {
            Swal.fire({ icon: 'warning', title: 'MISSING ITEM', text: 'LOAD THREAT IMAGES FIRST', customClass: { popup: 'text-2xl rounded-[3rem]' } });
            return;
        }
        if (topPolygon.length < 3) {
            Swal.fire({ icon: 'info', title: 'ROI ERROR', text: 'DRAW A CLOSED POLYGON AREA', customClass: { popup: 'text-2xl rounded-[3rem]' } });
            return;
        }

        let found = false;
        let attempts = 0;
        while (!found && attempts < 5000) {
            const testX = Math.random() * CW;
            const testTopY = Math.random() * CH;
            const testSideZ = Math.random() * CH;

            if (isPointInPolygon({ x: testX, y: testTopY }, topPolygon) && 
                isPointInPolygon({ x: testX, y: testSideZ }, sidePolygon)) {
                setRects(prev => ({ ...prev, x: testX - (prev.w/2), topY: testTopY - (prev.topH/2), sideZ: testSideZ - (prev.sideH/2) }));
                found = true;
            }
            attempts++;
        }
        if (!found) Swal.fire('OUT OF BOUNDS', 'NO OVERLAPPING X-AXIS FOUND', 'error');
    };

    const draw = useCallback(() => {
        const render = (ctx, bg, itm, poly, yPos, hPos, isTop) => {
            if (!ctx) return;
            ctx.canvas.width = CW; ctx.canvas.height = CH;
            
            if (bg) ctx.drawImage(bg, 0, 0, CW, CH);
            else { ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, CW, CH); }

            if (poly.length > 0) {
                ctx.beginPath();
                ctx.moveTo(poly[0].x, poly[0].y);
                poly.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.closePath();
                ctx.strokeStyle = (activeCanvas === (isTop ? 'top' : 'side') && isDrawingMode) ? "#f97316" : "rgba(255,255,255,0.4)";
                ctx.lineWidth = 6;
                ctx.stroke();
                poly.forEach(p => { ctx.fillStyle = "#f97316"; ctx.fillRect(p.x-6, p.y-6, 12, 12); });
            }

            if (itm) {
                ctx.save();
                ctx.globalCompositeOperation = 'multiply';
                ctx.drawImage(itm, rects.x, yPos, rects.w, hPos);
                ctx.restore();
                
                ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 4;
                ctx.setLineDash([20, 10]);
                ctx.strokeRect(rects.x, yPos, rects.w, hPos);
                ctx.setLineDash([]);
                ctx.fillStyle = "#ef4444";
                ctx.fillRect(rects.x + rects.w - 20, yPos + hPos - 20, 30, 30); // BIG HANDLE
            }
        };

        render(topCanvasRef.current?.getContext('2d'), images.bgTop, images.itemTop, topPolygon, rects.topY, rects.topH, true);
        render(sideCanvasRef.current?.getContext('2d'), images.bgSide, images.itemSide, sidePolygon, rects.sideZ, rects.sideH, false);
    }, [images, rects, topPolygon, sidePolygon, isDrawingMode, activeCanvas]);

    useEffect(() => { draw(); }, [draw]);

    const handleMouseDown = (e, view) => {
        const rect = e.target.getBoundingClientRect();
        const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
        if (isDrawingMode) {
            const p = { x: mx, y: my };
            view === 'top' ? setTopPolygon([...topPolygon, p]) : setSidePolygon([...sidePolygon, p]);
            return;
        }
        const curY = view === 'top' ? rects.topY : rects.sideZ;
        const curH = view === 'top' ? rects.topH : rects.sideH;

        if (mx >= (rects.x + rects.w - 30) && my >= (curY + curH - 30)) {
            setDragState({ isActive: true, view, mode: 'resize', offset: { x: mx - rects.w, y: my - curH } });
        } else if (mx >= rects.x && mx <= rects.x + rects.w && my >= curY && my <= curY + curH) {
            setDragState({ isActive: true, view, mode: 'move', offset: { x: mx - rects.x, y: my - curY } });
        }
    };

    const handleMouseMove = (e) => {
        if (!dragState.isActive) return;
        const b = (dragState.view === 'top' ? topCanvasRef : sideCanvasRef).current.getBoundingClientRect();
        const mx = e.clientX - b.left; const my = e.clientY - b.top;
        if (dragState.mode === 'move') {
            setRects(p => ({ ...p, x: mx - dragState.offset.x, [dragState.view === 'top' ? 'topY' : 'sideZ']: my - dragState.offset.y }));
        } else {
            setRects(p => ({ ...p, w: mx - dragState.offset.x, [dragState.view === 'top' ? 'topH' : 'sideH']: my - dragState.offset.y }));
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white p-10 overflow-auto font-sans" onMouseMove={handleMouseMove} onMouseUp={() => setDragState({ isActive: false })}>
            
            {/* 2XL CONTROL PANEL */}
            <div className="grid grid-cols-4 gap-10 mb-10 bg-slate-900 p-10 rounded-[3rem] border-4 border-slate-800 shadow-2xl">
                
                <div className="flex flex-col gap-4">
                    <span className="text-2xl font-black text-orange-500 uppercase italic">01. LOAD BAGGAGE</span>
                    <div className="space-y-4">
                        <input type="file" className="text-xl file:bg-slate-800 file:text-white file:border-0 file:px-6 file:py-3 file:rounded-2xl" onChange={(e) => handleFileChange(e, 'bgTop')} />
                        <input type="file" className="text-xl file:bg-slate-800 file:text-white file:border-0 file:px-6 file:py-3 file:rounded-2xl" onChange={(e) => handleFileChange(e, 'bgSide')} />
                    </div>
                </div>

                <div className="flex flex-col gap-4 border-l-4 border-slate-800 pl-10">
                    <span className="text-2xl font-black text-blue-400 uppercase italic">02. LOAD THREAT</span>
                    <div className="space-y-4">
                        <input type="file" className="text-xl file:bg-slate-800 file:text-white file:border-0 file:px-6 file:py-3 file:rounded-2xl" onChange={(e) => handleFileChange(e, 'itemTop')} />
                        <input type="file" className="text-xl file:bg-slate-800 file:text-white file:border-0 file:px-6 file:py-3 file:rounded-2xl" onChange={(e) => handleFileChange(e, 'itemSide')} />
                    </div>
                </div>

                <div className="flex flex-col gap-5 border-l-4 border-slate-800 pl-10 justify-center">
                    <button onClick={() => setIsDrawingMode(!isDrawingMode)} className={`text-2xl font-black py-5 rounded-3xl transition-all ${isDrawingMode ? 'bg-orange-600 shadow-[0_0_30px_rgba(234,88,12,0.5)]' : 'bg-slate-700 hover:bg-slate-600'}`}>
                        {isDrawingMode ? '🔒 LOCK AREA' : '✏️ DRAW ROI'}
                    </button>
                    <div className="flex gap-4">
                        <button onClick={() => setActiveCanvas('top')} className={`flex-1 text-xl p-4 rounded-2xl font-bold ${activeCanvas === 'top' ? 'bg-orange-500' : 'bg-slate-800 border-2 border-slate-700'}`}>EDIT TOP</button>
                        <button onClick={() => setActiveCanvas('side')} className={`flex-1 text-xl p-4 rounded-2xl font-bold ${activeCanvas === 'side' ? 'bg-orange-500' : 'bg-slate-800 border-2 border-slate-700'}`}>EDIT SIDE</button>
                    </div>
                </div>

                <div className="flex flex-col gap-5 border-l-4 border-slate-800 pl-10 justify-center">
                    <button onClick={autoPlaceSync} className="bg-emerald-600 hover:bg-emerald-500 text-3xl font-black py-8 rounded-[2rem] shadow-2xl transition-all active:scale-95 uppercase italic">
                        🚀 AUTO SYNC
                    </button>
                    <button onClick={() => {setTopPolygon([]); setSidePolygon([]);}} className="text-xl text-slate-500 font-bold underline decoration-slate-700">PURGE ROI DATA</button>
                </div>
            </div>

            {/* XL CANVAS AREA */}
            <div className="flex flex-row gap-10 justify-center flex-1 items-start">
                <div className="flex flex-col gap-4">
                    <div className="text-3xl font-black bg-orange-600 inline-block px-8 py-2 skew-x-[-12deg] self-start uppercase">TOP CHANNEL</div>
                    <canvas ref={topCanvasRef} onMouseDown={(e) => handleMouseDown(e, 'top')} className="bg-slate-900 rounded-[3rem] border-4 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-crosshair" />
                </div>
                <div className="flex flex-col gap-4">
                    <div className="text-3xl font-black bg-blue-600 inline-block px-8 py-2 skew-x-[-12deg] self-start uppercase">SIDE CHANNEL</div>
                    <canvas ref={sideCanvasRef} onMouseDown={(e) => handleMouseDown(e, 'side')} className="bg-slate-900 rounded-[3rem] border-4 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-crosshair" />
                </div>
            </div>
        </div>
    );
}