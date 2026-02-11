"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import ItemRegistration from './ItemRegistoration';

export default function DualViewEditor() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3015';
    const topCanvasRef = useRef(null);
    const sideCanvasRef = useRef(null);

    // --- Data States ---
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [itemList, setItemList] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [areas, setAreas] = useState([]);
    const [selectedAreaId, setSelectedAreaId] = useState(1);
    const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
    
    // --- Metadata States ---
    const [baggageCode, setBaggageCode] = useState('');
    const [examType, setExamType] = useState('CBT');

    // --- Processing States ---
    const [images, setImages] = useState({ bgTop: null, itemTop: null, bgSide: null, itemSide: null });
    
    // แยก Rect เป็น 2 ชุดอิสระ
    const [topRect, setTopRect] = useState({ x: 100, y: 100, w: 100, h: 100 });
    const [sideRect, setSideRect] = useState({ x: 100, z: 100, w: 100, h: 100 });
    
    const [threshold, setThreshold] = useState(230);
    const [opacity, setOpacity] = useState(1);
    const [multiplyEnabled, setMultiplyEnabled] = useState(true);
    const [isDragging, setIsDragging] = useState(null); // 'top' | 'side' | null
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const resetEditor = () => {
        setSelectedItem(null);
        setSelectedCategoryId('');
        setItemList([]);
        setBaggageCode('');
        setImages({ bgTop: null, itemTop: null, bgSide: null, itemSide: null });
        setTopRect({ x: 100, y: 100, w: 100, h: 100 });
        setSideRect({ x: 100, z: 100, w: 100, h: 100 });
        setThreshold(230);
        document.querySelectorAll('input[type="file"]').forEach(input => input.value = "");
    };

    // 1. Initial Load
    useEffect(() => {
        fetch(`${API_URL}/itemCategory/`).then(res => res.json()).then(setCategories);
        fetch(`${API_URL}/area/`).then(res => res.json()).then(setAreas);
    }, [API_URL]);

    // 2. Load Items
    useEffect(() => {
        if (!selectedCategoryId) { setItemList([]); return; }
        setSelectedItem(null);
        setImages(p => ({ ...p, itemTop: null, itemSide: null }));
        fetch(`${API_URL}/itemImage/category/${selectedCategoryId}`)
            .then(res => res.json())
            .then(setItemList);
    }, [selectedCategoryId, API_URL]);

    // 3. Metadata Sync (Baggage Code)
    useEffect(() => {
        if (!selectedAreaId || !selectedCategoryId) { setBaggageCode(''); return; }
        const fetchCode = async () => {
            try {
                const res = await fetch(`${API_URL}/baggage/nextCode?areaID=${selectedAreaId}&itemCategoryID=${selectedCategoryId}`);
                const data = await res.json();
                const year = 2026;
                const areaMap = { 1: 'CB', 2: 'HB', 3: 'CM' };
                const catPrefix = parseInt(selectedCategoryId) === 1 ? 'C' : 'T';
                const formattedNumber = data.nextNumber || '00001';
                setBaggageCode(`${year}-AOTAVSEC-XSIM${examType}-${areaMap[selectedAreaId] || 'XX'}-${catPrefix}${formattedNumber}`);
            } catch (err) { console.error("Code fetch error", err); }
        };
        fetchCode();
    }, [selectedAreaId, selectedCategoryId, examType, API_URL]);

    // --- Canvas Handlers (อิสระต่อกัน) ---
    const handleMouseDown = (e, viewType) => {
        const canvas = viewType === 'top' ? topCanvasRef.current : sideCanvasRef.current;
        if (!canvas || !images.itemTop) return;
        
        const canvasRect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - canvasRect.left;
        const mouseY = e.clientY - canvasRect.top;
        
        const currentRect = viewType === 'top' ? topRect : sideRect;
        const itemY = viewType === 'top' ? currentRect.y : currentRect.z;

        if (mouseX >= currentRect.x && mouseX <= currentRect.x + currentRect.w && 
            mouseY >= itemY && mouseY <= itemY + currentRect.h) {
            setIsDragging(viewType);
            setDragOffset({ x: mouseX - currentRect.x, y: mouseY - itemY });
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const canvas = isDragging === 'top' ? topCanvasRef.current : sideCanvasRef.current;
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        const mouseX = Math.round(e.clientX - canvasRect.left);
        const mouseY = Math.round(e.clientY - canvasRect.top);

        if (isDragging === 'top') {
            setTopRect(p => ({ ...p, x: mouseX - dragOffset.x, y: mouseY - dragOffset.y }));
        } else {
            setSideRect(p => ({ ...p, x: mouseX - dragOffset.x, z: mouseY - dragOffset.y }));
        }
    };

    const handleSelectItem = (item) => {
        setSelectedItem(item);
        const t = new Image(); const s = new Image();
        t.crossOrigin = s.crossOrigin = "anonymous";
        let l = 0;
        const c = () => { 
            if (++l === 2) { 
                setImages(p => ({ ...p, itemTop: t, itemSide: s })); 
                setTopRect(p => ({ ...p, w: t.width, h: t.height }));
                setSideRect(p => ({ ...p, w: s.width, h: s.height }));
            } 
        };
        t.onload = s.onload = c;
        t.src = `${API_URL}/${item.top}?t=${Date.now()}`;
        s.src = `${API_URL}/${item.side}?t=${Date.now()}`;
    };

    const processAndDraw = useCallback((ctx, bg, itm, view, currentRect) => {
        if (!ctx) return;
        ctx.canvas.width = bg?.width || 800; 
        ctx.canvas.height = bg?.height || 600;
        ctx.globalCompositeOperation = 'source-over';
        
        if (bg) ctx.drawImage(bg, 0, 0);
        else { ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); }

        if (itm?.complete) {
            const tmp = document.createElement('canvas'); 
            const tCtx = tmp.getContext('2d');
            tmp.width = currentRect.w; tmp.height = currentRect.h;
            tCtx.drawImage(itm, 0, 0, currentRect.w, currentRect.h);
            
            const d = tCtx.getImageData(0, 0, currentRect.w, currentRect.h);
            for (let i = 0; i < d.data.length; i += 4) {
                if ((0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2]) > threshold) d.data[i + 3] = 0;
                else d.data[i + 3] *= opacity;
            }
            tCtx.putImageData(d, 0, 0);
            
            if (multiplyEnabled) ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(tmp, currentRect.x, view === 'top' ? currentRect.y : currentRect.z);
        }
    }, [threshold, opacity, multiplyEnabled]);

    useEffect(() => {
        processAndDraw(topCanvasRef.current?.getContext('2d'), images.bgTop, images.itemTop, 'top', topRect);
        processAndDraw(sideCanvasRef.current?.getContext('2d'), images.bgSide, images.itemSide, 'side', sideRect);
    }, [images, topRect, sideRect, processAndDraw]);

    const uploadCanvas = async () => {
        if (!baggageCode) {
            Swal.fire('Warning', 'Please select an Area and Category to generate a code.', 'warning');
            return;
        }
        Swal.fire({ title: 'Saving Simulation...', html: 'Uploading data to registry', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
        try {
            const formData = new FormData();
            const topB = await new Promise(r => topCanvasRef.current.toBlob(r, "image/png"));
            const sideB = await new Promise(r => sideCanvasRef.current.toBlob(r, "image/png"));
            formData.append("top", topB, "top.png");
            formData.append("side", sideB, "side.png");
            formData.append("itemImageID", selectedItem?.id || "");
            formData.append("areaID", selectedAreaId);
            formData.append("itemCategoryID", selectedCategoryId);
            formData.append("examType", examType);
            formData.append("code", baggageCode);
            // ส่งข้อมูลตำแหน่งแยกกัน
            formData.append("itemPos", JSON.stringify({ top: topRect, side: sideRect }));

            const res = await fetch(`${API_URL}/baggage/canvas-upload`, { method: "POST", body: formData });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Baggage Saved!', timer: 2000, showConfirmButton: false });
                resetEditor();
            } else { const errData = await res.json(); throw new Error(errData.message || "Upload failed"); }
        } catch (error) { Swal.fire('Error', error.message, 'error'); }
    };

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans rounded-2xl" onMouseMove={handleMouseMove} onMouseUp={() => setIsDragging(null)}>

            <div className="flex-1 p-4 pb-40 overflow-y-auto">
                {/* 1. TOP SELECTION BAR */}
                <div className="flex gap-6 mb-4 bg-slate-900/90 p-3 rounded-xl border border-slate-800 justify-center items-center shadow-lg">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Area:</span>
                    <div className="flex gap-4">
                        {areas.map(area => (
                            <label key={area.id} className="flex items-center gap-2 cursor-pointer group">
                                <input type="radio" checked={selectedAreaId === area.id} onChange={() => setSelectedAreaId(area.id)} className="w-4 h-4 accent-orange-500" />
                                <span className={`text-xs font-bold transition-colors ${selectedAreaId === area.id ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-200'}`}>{area.name}</span>
                            </label>
                        ))}
                    </div>
                    <div className="ml-8 pl-8 border-l border-slate-700 flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Registry:</span>
                        <input readOnly value={baggageCode} className="bg-black border border-slate-700 text-orange-500 font-mono text-[10px] px-3 py-1 rounded w-64 focus:outline-none" />
                        <select value={examType} onChange={e => setExamType(e.target.value)} className="bg-slate-800 text-[10px] font-bold px-2 py-1 rounded border border-slate-700 text-white">
                            <option value="CBT">CBT</option>
                            <option value="CBA">CBA</option>
                        </select>
                    </div>
                </div>

                {/* 2. BACKGROUND LOADER */}
                <div className="flex gap-4 mb-6 bg-slate-900/80 p-4 rounded-xl border border-slate-800 justify-center shadow-md">
                    {['bgTop', 'bgSide'].map(key => (
                        <div key={key} className="flex flex-col gap-1 px-4 border-r last:border-0 border-slate-700">
                            <span className="text-[12px] font-bold text-orange-500 uppercase italic tracking-tighter">
                                {key === 'bgTop' ? 'Top View Source' : 'Side View Source'}
                            </span>
                            <input type="file" className="text-[10px] text-slate-400 file:bg-slate-800 file:text-white file:border-0 file:rounded file:px-2 file:mr-2" onChange={e => {
                                if (e.target.files[0]) {
                                    const img = new Image(); img.onload = () => setImages(p => ({ ...p, [key]: img }));
                                    img.src = URL.createObjectURL(e.target.files[0]);
                                }
                            }} />
                        </div>
                    ))}
                </div>

                {/* 3. VIEWING TERMINALS */}
                <div className="flex flex-row gap-6 justify-center">
                    {['top', 'side'].map(v => (
                        <div key={v} className="bg-black border-2 border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all hover:border-slate-700">
                            <div className="bg-slate-800 text-[10px] px-4 py-2 font-black uppercase tracking-[0.2em] flex justify-between items-center border-b border-slate-700">
                                <span className="text-slate-300 italic">Imaging Terminal: {v.toUpperCase()}</span>
                                {images[v === 'top' ? 'bgTop' : 'bgSide'] && <span className="text-emerald-400 animate-pulse">● FEED ACTIVE</span>}
                            </div>
                            <canvas 
                                ref={v === 'top' ? topCanvasRef : sideCanvasRef} 
                                onMouseDown={e => handleMouseDown(e, v)} 
                                className="cursor-move bg-slate-900" 
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* 🛠️ SIDEBAR: REGISTRY CONTROLS */}
            <div className="w-85 bg-slate-900 border-l border-slate-800 p-6 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] z-20 rounded-l-3xl">
                <h2 className="text-orange-500 font-black text-xl mb-6 border-b border-slate-800 pb-4 italic text-center uppercase tracking-tighter">
                    X-SIM V3 REGISTRY
                </h2>

                <div className="mb-6 group">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Threat Category</label>
                    <div className="relative">
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full bg-black text-white border-2 border-slate-800 rounded-xl py-3 px-4 text-xs font-black outline-none focus:border-orange-600 transition-all appearance-none cursor-pointer shadow-inner pr-10"
                        >
                            <option value="" disabled>-- Classify Threat --</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id} className="bg-slate-900 py-2">{cat.name.toUpperCase()}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                    </div>
                </div>

                {/* ITEM LIST */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar border-t border-slate-800 pt-4">
                    {itemList.map(item => (
                        <div
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            className={`group relative bg-slate-800/40 border border-slate-700 rounded-xl p-3 hover:border-orange-500 cursor-pointer flex gap-4 items-center transition-all 
                                ${selectedItem?.id === item.id ? 'border-orange-600 bg-slate-800 translate-x-1' : 'hover:bg-slate-800/60'}`}
                        >
                            <div className="w-14 h-14 bg-black rounded-lg border border-slate-600 shrink-0 overflow-hidden shadow-lg p-1">
                                <img src={`${API_URL}/${item.top}`} alt="p" className={`w-full h-full object-contain ${selectedItem?.id === item.id ? 'grayscale-0' : 'grayscale'}`} />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className={`text-[11px] font-black uppercase tracking-tighter truncate ${selectedItem?.id === item.id ? 'text-orange-400' : 'text-slate-300'}`}>{item.name}</span>
                                <span className="text-[8px] font-mono text-slate-600 mt-1 uppercase">UID: {item.id.toString().padStart(4, '0')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 🔵 FOOTER: SYSTEM ADJUSTMENTS */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl p-6 border-t border-slate-800 flex flex-row items-center justify-between gap-8 z-50">
                <div className="flex items-center gap-10 border-r border-slate-800 pr-10">
                    <div className="flex items-center gap-3">
                        <input type="checkbox" checked={multiplyEnabled} onChange={e => setMultiplyEnabled(e.target.checked)} className="h-5 w-5 accent-blue-500 cursor-pointer" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Blend Mode</span>
                    </div>
                    <div className="w-48">
                        <div className="flex justify-between mb-1">
                            <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">Luma Threshold</span>
                            <span className="text-[10px] text-white font-mono">{threshold}</span>
                        </div>
                        <input type="range" min="0" max="255" value={threshold} onChange={e => setThreshold(+e.target.value)} className="w-full h-1.5 accent-yellow-500 bg-slate-700 rounded-lg appearance-none" />
                    </div>
                </div>

                <div className="flex gap-4 items-center flex-1 overflow-x-auto">
                    {/* Top View Controls */}
                    <div className="flex flex-col gap-1 border-r border-slate-800 pr-4">
                        <span className="text-[9px] text-orange-500 font-bold uppercase italic">Top Pos</span>
                        <div className="flex gap-2">
                            <input type="number" value={topRect.x} onChange={e => setTopRect(p => ({ ...p, x: +e.target.value }))} className="w-16 bg-black text-orange-500 font-mono text-[10px] p-2 rounded border border-slate-700" placeholder="X" />
                            <input type="number" value={topRect.y} onChange={e => setTopRect(p => ({ ...p, y: +e.target.value }))} className="w-16 bg-black text-orange-500 font-mono text-[10px] p-2 rounded border border-slate-700" placeholder="Y" />
                        </div>
                    </div>
                    {/* Side View Controls */}
                    <div className="flex flex-col gap-1 border-r border-slate-800 pr-4">
                        <span className="text-[9px] text-blue-500 font-bold uppercase italic">Side Pos</span>
                        <div className="flex gap-2">
                            <input type="number" value={sideRect.x} onChange={e => setSideRect(p => ({ ...p, x: +e.target.value }))} className="w-16 bg-black text-blue-500 font-mono text-[10px] p-2 rounded border border-slate-700" placeholder="X" />
                            <input type="number" value={sideRect.z} onChange={e => setSideRect(p => ({ ...p, z: +e.target.value }))} className="w-16 bg-black text-blue-500 font-mono text-[10px] p-2 rounded border border-slate-700" placeholder="Z" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={() => setIsRegistrationOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black px-6 py-3 rounded-xl uppercase">Register Item</button>
                    <button onClick={resetEditor} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-black px-6 py-3 rounded-xl uppercase">Clear</button>
                    <button onClick={uploadCanvas} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black px-8 py-3 rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.3)] uppercase italic">
                        Deploy Simulation ↗
                    </button>
                </div>
            </div>

            {/* --- REGISTRATION MODAL --- */}
            {isRegistrationOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="relative w-full max-w-6xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h3 className="text-orange-500 font-black italic uppercase">System Registry: Item Management</h3>
                            <button onClick={() => setIsRegistrationOpen(false)} className="text-slate-500 hover:text-white text-xl">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar"><ItemRegistration /></div>
                    </div>
                </div>
            )}
        </div>
    );
}