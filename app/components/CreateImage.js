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
    const [selectedAreaIds, setSelectedAreaIds] = useState([1]); 
    
    const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
    const [isPreExisting, setIsPreExisting] = useState(false); 
    const [dragOverView, setDragOverView] = useState(null); // Track which canvas is being hovered during drag

    // --- Metadata States ---
    const [baggageCode, setBaggageCode] = useState('');
    const [examType, setExamType] = useState('CBT');

    // --- Processing States ---
    const [images, setImages] = useState({ bgTop: null, itemTop: null, bgSide: null, itemSide: null });
    const [threshold, setThreshold] = useState(230);
    const [multiplyEnabled, setMultiplyEnabled] = useState(true);

    const [topRect, setTopRect] = useState({ x: 100, y: 100, w: 120, h: 120 });
    const [sideRect, setSideRect] = useState({ x: 100, z: 100, w: 120, h: 120 });

    const [dragState, setDragState] = useState({
        isActive: false, view: null, mode: null, offset: { x: 0, y: 0 }
    });

    // --- New: Drag and Drop Handlers ---
    const handleDragOver = (e, view) => {
        e.preventDefault(); // Required to allow drop
        setDragOverView(view);
    };

    const handleDragLeave = () => {
        setDragOverView(null);
    };

    const handleDrop = (e, view) => {
        e.preventDefault();
        setDragOverView(null);
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const img = new Image();
            img.onload = () => {
                const key = view === 'top' ? 'bgTop' : 'bgSide';
                setImages(prev => ({ ...prev, [key]: img }));
            };
            img.src = URL.createObjectURL(file);
        }
    };

    // --- Functions & Logic ---
    const resetEditor = () => {
        setSelectedItem(null);
        setSelectedCategoryId('');
        setBaggageCode('');
        setImages({ bgTop: null, itemTop: null, bgSide: null, itemSide: null });
        setTopRect({ x: 100, y: 100, w: 120, h: 120 });
        setSideRect({ x: 100, z: 100, w: 120, h: 120 });
        setIsPreExisting(false);
        setSelectedAreaIds([1]);
        document.querySelectorAll('input[type="file"]').forEach(input => input.value = "");
    };

    const handleAreaToggle = (areaId) => {
        setSelectedAreaIds(prev => {
            if (prev.includes(areaId)) {
                return prev.length > 1 ? prev.filter(id => id !== areaId) : prev;
            } else {
                return [...prev, areaId].sort((a, b) => a - b);
            }
        });
    };

    const handleSelectItem = (item) => {
        setSelectedItem(item);
        const t = new Image(); const s = new Image();
        t.crossOrigin = s.crossOrigin = "anonymous";
        let loaded = 0;
        const onLoaded = () => { if (++loaded === 2) { 
            setImages(p => ({ ...p, itemTop: t, itemSide: s }));
            if (!isPreExisting) {
                setTopRect(p => ({ ...p, w: t.width, h: t.height }));
                setSideRect(p => ({ ...p, w: s.width, h: s.height }));
            }
        }};
        t.onload = s.onload = onLoaded;
        t.src = `${API_URL}/${item.top}?t=${Date.now()}`;
        s.src = `${API_URL}/${item.side}?t=${Date.now()}`;
    };

    const handleMouseDown = (e, viewType) => {
        const canvas = viewType === 'top' ? topCanvasRef.current : sideCanvasRef.current;
        const bRect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - bRect.left;
        const mouseY = e.clientY - bRect.top;
        const currentRect = viewType === 'top' ? topRect : sideRect;
        const currentY = viewType === 'top' ? currentRect.y : currentRect.z;

        if (mouseX >= (currentRect.x + currentRect.w - 15) && mouseX <= (currentRect.x + currentRect.w) &&
            mouseY >= (currentY + currentRect.h - 15) && mouseY <= (currentY + currentRect.h)) {
            setDragState({ isActive: true, view: viewType, mode: 'resize', offset: { x: mouseX - currentRect.w, y: mouseY - currentRect.h } });
            return;
        }
        if (mouseX >= currentRect.x && mouseX <= currentRect.x + currentRect.w && mouseY >= currentY && mouseY <= currentY + currentRect.h) {
            setDragState({ isActive: true, view: viewType, mode: 'move', offset: { x: mouseX - currentRect.x, y: mouseY - currentY } });
        }
    };

    const handleMouseMove = (e) => {
        if (!dragState.isActive) return;
        const canvas = dragState.view === 'top' ? topCanvasRef.current : sideCanvasRef.current;
        const bRect = canvas.getBoundingClientRect();
        const mouseX = Math.round(e.clientX - bRect.left);
        const mouseY = Math.round(e.clientY - bRect.top);
        const setter = dragState.view === 'top' ? setTopRect : setSideRect;
        const axisY = dragState.view === 'top' ? 'y' : 'z';

        if (dragState.mode === 'move') {
            setter(p => ({ ...p, x: mouseX - dragState.offset.x, [axisY]: mouseY - dragState.offset.y }));
        } else {
            setter(p => ({ ...p, w: Math.max(20, mouseX - dragState.offset.x), h: Math.max(20, mouseY - dragState.offset.y) }));
        }
    };

    useEffect(() => {
        fetch(`${API_URL}/itemCategory/`).then(res => res.json()).then(setCategories);
        fetch(`${API_URL}/area/`).then(res => res.json()).then(setAreas);
    }, [API_URL]);

    useEffect(() => {
        if (!selectedCategoryId) { setItemList([]); return; }
        setSelectedItem(null);
        setImages(p => ({ ...p, itemTop: null, itemSide: null }));
        fetch(`${API_URL}/itemImage/category/${selectedCategoryId}`).then(res => res.json()).then(setItemList);
    }, [selectedCategoryId, API_URL]);

    useEffect(() => {
        if (selectedAreaIds.length === 0 || !selectedCategoryId) { setBaggageCode(''); return; }
        const fetchCode = async () => {
            try {
                const primaryArea = selectedAreaIds[0];
                const res = await fetch(`${API_URL}/baggage/nextCode?areaID=${primaryArea}&itemCategoryID=${selectedCategoryId}`);
                const data = await res.json();
                const areaMap = { 1: 'CB', 2: 'HB', 3: 'CM' };
                const combinedAreaCode = selectedAreaIds.map(id => areaMap[id]).join('');
                const catPrefix = parseInt(selectedCategoryId) === 1 ? 'C' : 'T';
                setBaggageCode(`2026-AOTAVSEC-XSIM${examType}-${combinedAreaCode}-${catPrefix}${data.nextNumber || '00001'}`);
            } catch (err) { console.error(err); }
        };
        fetchCode();
    }, [selectedAreaIds, selectedCategoryId, examType, API_URL]);

 const processAndDraw = useCallback((ctx, bg, itm, view, rectObj, isExporting = false) => {
    if (!ctx) return;
    ctx.canvas.width = bg?.width || 800; 
    ctx.canvas.height = bg?.height || 600;
    ctx.globalCompositeOperation = 'source-over';
    
    if (bg) ctx.drawImage(bg, 0, 0);
    else { ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); }

    const currentY = view === 'top' ? rectObj.y : rectObj.z;
    
    if (!isPreExisting && itm?.complete) {
        const tmp = document.createElement('canvas'); 
        const tCtx = tmp.getContext('2d');
        tmp.width = rectObj.w; 
        tmp.height = rectObj.h;
        tCtx.drawImage(itm, 0, 0, rectObj.w, rectObj.h);
        const d = tCtx.getImageData(0, 0, rectObj.w, rectObj.h);
        for (let i = 0; i < d.data.length; i += 4) {
            if ((0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2]) > threshold) d.data[i + 3] = 0;
        }
        tCtx.putImageData(d, 0, 0);
        if (multiplyEnabled) ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(tmp, rectObj.x, currentY);
        ctx.globalCompositeOperation = 'source-over';
    }

    // --- ส่วนที่แก้ไข: ความหนาและสีขาว ---
    if (!isExporting) {
        ctx.setLineDash([20, 10]);
        ctx.lineWidth = 4; // 🛠️ เพิ่มความหนาของเส้นเป็น 4px (ปรับเลขได้ตามใจชอบ)
        
        // 🛠️ เปลี่ยนสีเป็นสีขาวสว่าง หากเป็นโหมดวาดเอง หรือโหมดปกติ
        ctx.strokeStyle = "YELLOW"; 
        
        ctx.strokeRect(rectObj.x, currentY, rectObj.w, rectObj.h);
        ctx.setLineDash([]);
        
        // วาดจุด Handle (มุมขวาล่าง) เป็นสีขาวด้วย
        ctx.fillStyle = "RED";
        ctx.fillRect(rectObj.x + rectObj.w - 10, currentY + rectObj.h - 10, 10, 10); // ขยายขนาดจุดเป็น 10px
    }
}, [isPreExisting, threshold, multiplyEnabled]);

    useEffect(() => {
        processAndDraw(topCanvasRef.current?.getContext('2d'), images.bgTop, images.itemTop, 'top', topRect, false);
        processAndDraw(sideCanvasRef.current?.getContext('2d'), images.bgSide, images.itemSide, 'side', sideRect, false);
    }, [images, topRect, sideRect, processAndDraw]);

    const uploadCanvas = async () => {
        if (!baggageCode) { Swal.fire('Warning', 'Select Area and Category', 'warning'); return; }
        Swal.fire({ title: 'Deploying...', didOpen: () => Swal.showLoading() });
        try {
            processAndDraw(topCanvasRef.current.getContext('2d'), images.bgTop, images.itemTop, 'top', topRect, true);
            processAndDraw(sideCanvasRef.current.getContext('2d'), images.bgSide, images.itemSide, 'side', sideRect, true);

            const formData = new FormData();
            const topB = await new Promise(r => topCanvasRef.current.toBlob(r, "image/png"));
            const sideB = await new Promise(r => sideCanvasRef.current.toBlob(r, "image/png"));
            
            formData.append("top", topB, "top.png");
            formData.append("side", sideB, "side.png");
            formData.append("itemImageID", selectedItem?.id || "0");
            formData.append("areaIDs", JSON.stringify(selectedAreaIds)); 
            formData.append("itemCategoryID", selectedCategoryId);
            formData.append("examType", examType);
            formData.append("code", baggageCode);
            formData.append("itemPos", JSON.stringify({ top: topRect, side: sideRect }));
            formData.append("isPreExisting", isPreExisting ? 1 : 0);

            const res = await fetch(`${API_URL}/baggage/canvas-upload`, { method: "POST", body: formData });
            if (res.ok) { Swal.fire({ icon: 'success', title: 'Saved!', timer: 1500 }); resetEditor(); }
            else throw new Error("Upload failed");
        } catch (error) { 
            Swal.fire('Error', error.message, 'error');
            processAndDraw(topCanvasRef.current.getContext('2d'), images.bgTop, images.itemTop, 'top', topRect, false);
            processAndDraw(sideCanvasRef.current.getContext('2d'), images.bgSide, images.itemSide, 'side', sideRect, false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden" onMouseMove={handleMouseMove} onMouseUp={() => setDragState(p => ({ ...p, isActive: false }))}>
            <div className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar pb-32">
                {/* 1. TOP SELECTION BAR */}
                <div className="flex gap-6 mb-4 bg-slate-900/90 p-3 rounded-xl border border-slate-800 justify-center items-center shadow-lg shrink-0">
                    <div className="flex gap-4 border-r border-slate-700 pr-6">
                        {areas.map(area => (
                            <label key={area.id} className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={selectedAreaIds.includes(area.id)} onChange={() => handleAreaToggle(area.id)} className="w-4 h-4 accent-orange-500 rounded bg-slate-800 border-slate-700" />
                                <span className={`text-xs font-bold transition-colors ${selectedAreaIds.includes(area.id) ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-200'}`}>{area.name}</span>
                            </label>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <input readOnly value={baggageCode} className="bg-black border border-slate-700 text-orange-500 font-mono text-[10px] px-3 py-1 rounded w-64 focus:outline-none" />
                        <select value={examType} onChange={e => setExamType(e.target.value)} className="bg-slate-800 text-[10px] font-bold px-2 py-1 rounded border border-slate-700">
                            <option value="CBT">CBT</option><option value="CBA">CBA</option>
                        </select>
                    </div>
                </div>

                {/* 2. BACKGROUND SOURCE */}
                <div className="flex gap-4 mb-6 bg-slate-900/80 p-4 rounded-xl border border-slate-800 justify-center shadow-md shrink-0">
                    {['bgTop', 'bgSide'].map(key => (
                        <div key={key} className="flex flex-col gap-1 px-4 border-r last:border-0 border-slate-700">
                            <span className="text-[12px] font-bold text-orange-500 uppercase italic tracking-widest">Source: {key === 'bgTop' ? 'TOP' : 'SIDE'}</span>
                            <input type="file" className="text-[10px] text-slate-400 file:bg-slate-800 file:text-white file:border-0 file:rounded file:px-2 cursor-pointer" onChange={e => {
                                if (e.target.files[0]) {
                                    const img = new Image(); img.onload = () => setImages(p => ({ ...p, [key]: img }));
                                    img.src = URL.createObjectURL(e.target.files[0]);
                                }
                            }} />
                        </div>
                    ))}
                </div>

                <div className="flex justify-center gap-4 mb-6 shrink-0">
                   <button onClick={() => setIsPreExisting(false)} className={`px-6 py-2 rounded-full text-xs font-black border transition-all ${!isPreExisting ? 'bg-orange-600 border-orange-400 shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>OVERLAY MODE</button>
                   <button onClick={() => setIsPreExisting(true)} className={`px-6 py-2 rounded-full text-xs font-black border transition-all ${isPreExisting ? 'bg-blue-600 border-blue-400 shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>PRE-EXISTING MODE</button>
                </div>

                {/* 4. CANVASES WITH DROP SUPPORT */}
                <div className="flex flex-row gap-6 justify-center">
                    {['top', 'side'].map(v => (
                        <div key={v} 
                            onDragOver={(e) => handleDragOver(e, v)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, v)}
                            className={`bg-black border-2 rounded-2xl shadow-2xl overflow-hidden relative transition-all duration-200
                                ${dragOverView === v ? 'border-orange-500 scale-[1.02] shadow-orange-500/20' : 'border-slate-800'}`}>
                            
                            <div className="bg-slate-800/50 absolute top-0 left-0 right-0 z-10 px-4 py-2 text-[9px] font-black uppercase flex justify-between pointer-events-none">
                                <span className="text-slate-400">CHANNEL: {v.toUpperCase()}</span>
                                {dragOverView === v && <span className="text-orange-500 animate-pulse">DROP IMAGE TO LOAD BACKGROUND</span>}
                            </div>

                            <canvas ref={v === 'top' ? topCanvasRef : sideCanvasRef} onMouseDown={e => handleMouseDown(e, v)} className="cursor-crosshair bg-slate-900" />
                        </div>
                    ))}
                </div>
            </div>

            {/* SIDEBAR AREA */}
            <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
                <div className="p-6 border-b border-slate-800 shrink-0">
                    <h2 className="text-orange-500 font-black text-xl mb-6 italic text-center uppercase tracking-tighter">X-SIM V3 REGISTRY</h2>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => setIsRegistrationOpen(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black py-3 rounded-xl uppercase transition-all active:scale-95 border border-blue-400/20">Item Registration</button>
                        <button onClick={uploadCanvas} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black py-4 rounded-xl shadow-lg uppercase italic transition-all active:scale-95 shadow-emerald-900/20">Deploy Simulation ↗</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="mb-6">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 tracking-widest">Classification</label>
                        <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="w-full bg-black text-white border-2 border-slate-800 rounded-xl py-3 px-4 text-xs font-black outline-none focus:border-orange-500 transition-all shadow-inner appearance-none">
                            <option value="" disabled>-- SELECT --</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Objects</label>
                        {itemList.map(item => (
                            <div key={item.id} onClick={() => handleSelectItem(item)} className={`group relative bg-slate-800/40 border border-slate-700 rounded-xl p-3 hover:border-orange-500 cursor-pointer flex gap-4 items-center transition-all ${selectedItem?.id === item.id ? 'border-orange-600 bg-slate-800 ring-2 ring-orange-900/20 translate-x-1' : ''}`}>
                                <div className="w-10 h-10 bg-black rounded p-1 flex-shrink-0 border border-slate-700"><img src={`${API_URL}/${item.top}`} className="w-full h-full object-contain" /></div>
                                <span className="text-[10px] font-black uppercase truncate text-slate-300 group-hover:text-white leading-tight">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {isRegistrationOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="relative w-full max-w-6xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h3 className="text-orange-500 font-black italic uppercase tracking-tighter">System Registry</h3>
                            <button onClick={() => setIsRegistrationOpen(false)} className="text-slate-500 hover:text-white transition-colors p-2">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar"><ItemRegistration /></div>
                    </div>
                </div>
            )}
        </div>
    );
}