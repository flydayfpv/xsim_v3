"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import CategorySelect from './CategorySelect';

export default function DualViewEditor() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3015';
    const topCanvasRef = useRef(null);
    const sideCanvasRef = useRef(null);

    // --- Data States ---
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [itemList, setItemList] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    
    // Area States (From your migration)
    const [areas, setAreas] = useState([]);
    const [selectedAreaId, setSelectedAreaId] = useState(1); // Default to Cabin

    const [images, setImages] = useState({
        bgTop: null,
        itemTop: null,
        bgSide: null,
        itemSide: null,
    });

    const [rect, setRect] = useState({ x: 100, y: 100, z: 100, w: 100, h: 100 });
    const [threshold, setThreshold] = useState(230);
    const [opacity, setOpacity] = useState(1);
    const [multiplyEnabled, setMultiplyEnabled] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // 1. Load Categories and Areas on Mount
    useEffect(() => {
        // Fetch Categories
        fetch(`${API_URL}/itemCategory/`)
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error("Load categories failed", err));

        // Fetch Areas (The data from your migration)
        fetch(`${API_URL}/area/`) // Assuming your route is /area
            .then(res => res.json())
            .then(data => setAreas(data))
            .catch(err => console.error("Load areas failed", err));
    }, [API_URL]);

    // 2. Load Items when Category changes
    useEffect(() => {
        if (!selectedCategoryId) { setItemList([]); return; }
        fetch(`${API_URL}/itemImage/category/${selectedCategoryId}`)
            .then(res => res.json())
            .then(data => setItemList(data))
            .catch(err => console.error("Load items failed", err));
    }, [selectedCategoryId, API_URL]);

    const handleSelectItem = (item) => {
        setSelectedItem(item);
        const topImg = new Image();
        const sideImg = new Image();
        topImg.crossOrigin = "anonymous";
        sideImg.crossOrigin = "anonymous";

        let loadedCount = 0;
        const onImageLoad = () => {
            loadedCount++;
            if (loadedCount === 2) {
                setImages(prev => ({ ...prev, itemTop: topImg, itemSide: sideImg }));
                setRect(prev => ({
                    ...prev,
                    w: topImg.naturalWidth || 100,
                    h: topImg.naturalHeight || 100
                }));
            }
        };
        topImg.onload = onImageLoad;
        sideImg.onload = onImageLoad;
        const bust = `?t=${Date.now()}`;
        topImg.src = `${API_URL}/${item.top}${bust}`;
        sideImg.src = `${API_URL}/${item.side}${bust}`;
    };

    const processAndDraw = useCallback((ctx, bgImg, itemImg, viewType) => {
        if (!ctx) return;
        const w = bgImg ? bgImg.width : 800;
        const h = bgImg ? bgImg.height : 600;
        ctx.canvas.width = w;
        ctx.canvas.height = h;
        ctx.globalCompositeOperation = 'source-over';
        if (bgImg) ctx.drawImage(bgImg, 0, 0);
        else { ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, w, h); }

        if (itemImg && itemImg.complete) {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = rect.w;
            tempCanvas.height = rect.h;
            tempCtx.drawImage(itemImg, 0, 0, rect.w, rect.h);
            
            try {
                const imgData = tempCtx.getImageData(0, 0, rect.w, rect.h);
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    if (lum > threshold) data[i + 3] = 0;
                    else data[i + 3] *= opacity;
                }
                tempCtx.putImageData(imgData, 0, 0);
                const posY = viewType === 'top' ? rect.y : rect.z;
                if (multiplyEnabled) ctx.globalCompositeOperation = 'multiply';
                ctx.drawImage(tempCanvas, rect.x, posY);
            } catch (e) {
                const posY = viewType === 'top' ? rect.y : rect.z;
                ctx.drawImage(itemImg, rect.x, posY, rect.w, rect.h);
            }
        }
    }, [rect, threshold, opacity, multiplyEnabled]);

    useEffect(() => {
        processAndDraw(topCanvasRef.current?.getContext('2d'), images.bgTop, images.itemTop, 'top');
        processAndDraw(sideCanvasRef.current?.getContext('2d'), images.bgSide, images.itemSide, 'side');
    }, [images, processAndDraw]);

    const uploadCanvas = async () => {
        if (!topCanvasRef.current || !sideCanvasRef.current || !selectedItem) {
            alert("Ensure item is selected and background is loaded.");
            return;
        }

        const formData = new FormData();
        const topBlob = await new Promise(res => topCanvasRef.current.toBlob(res, "image/png"));
        const sideBlob = await new Promise(res => sideCanvasRef.current.toBlob(res, "image/png"));

        formData.append("top", topBlob, "top.png");
        formData.append("side", sideBlob, "side.png");
        formData.append("itemImageID", selectedItem.id);
        formData.append("areaID", selectedAreaId); // Uses the selected checkbox ID
        formData.append("itemPos", JSON.stringify(rect));

        try {
            const res = await fetch(`${API_URL}/baggage/canvas-upload`, { method: "POST", body: formData });
            if (res.ok) alert("Baggage Saved Successfully!");
            else {
                const err = await res.json();
                alert("Error: " + err.error);
            }
        } catch (err) { alert("Network Error: check console"); }
    };

    const handleMouseDown = (e, viewType) => {
        const canvas = viewType === 'top' ? topCanvasRef.current : sideCanvasRef.current;
        const canvasRect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - canvasRect.left;
        const mouseY = e.clientY - canvasRect.top;
        const itemY = viewType === 'top' ? rect.y : rect.z;

        if (mouseX >= rect.x && mouseX <= rect.x + rect.w && mouseY >= itemY && mouseY <= itemY + rect.h) {
            setIsDragging(true);
            setDragOffset({ x: mouseX - rect.x, y: mouseY - itemY });
        }
    };

    const handleMouseMove = (e, viewType) => {
        if (!isDragging) return;
        const canvas = viewType === 'top' ? topCanvasRef.current : sideCanvasRef.current;
        const canvasRect = canvas.getBoundingClientRect();
        const mouseX = Math.round(e.clientX - canvasRect.left);
        const mouseY = Math.round(e.clientY - canvasRect.top);
        if (viewType === 'top') {
            setRect(p => ({ ...p, x: mouseX - dragOffset.x, y: mouseY - dragOffset.y }));
        } else {
            setRect(p => ({ ...p, x: mouseX - dragOffset.x, z: mouseY - dragOffset.y }));
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans" onMouseUp={() => setIsDragging(false)}>
            
            <div className="flex-1 p-4 pb-40 overflow-y-auto">
                {/* 1. TOP CHECKBOX / AREA SELECTION BAR */}
                <div className="flex gap-6 mb-4 bg-slate-900/90 p-3 rounded-xl border border-slate-800 justify-center items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Area:</span>
                    <div className="flex gap-4">
                        {areas.map((area) => (
                            <label key={area.id} className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="radio" 
                                    name="area_select"
                                    checked={selectedAreaId === area.id}
                                    onChange={() => setSelectedAreaId(area.id)}
                                    className="w-4 h-4 accent-orange-500"
                                />
                                <span className={`text-xs font-bold transition-colors ${selectedAreaId === area.id ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                    {area.name}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Background Selectors */}
                <div className="flex gap-4 mb-6 bg-slate-900/80 p-4 rounded-xl border border-slate-800 justify-center">
                    {['bgTop', 'bgSide'].map((key) => (
                        <div key={key} className="flex flex-col gap-1 px-4 border-r last:border-0 border-slate-700">
                            <span className="text-[10px] font-bold text-orange-500 uppercase">{key === 'bgTop' ? 'Top View BG' : 'Side View BG'}</span>
                            <input type="file" className="text-[10px]" onChange={e => {
                                const file = e.target.files[0];
                                if (file) {
                                    const img = new Image();
                                    img.onload = () => setImages(prev => ({ ...prev, [key]: img }));
                                    img.src = URL.createObjectURL(file);
                                }
                            }} />
                        </div>
                    ))}
                </div>

                <div className="flex flex-row gap-6 justify-center">
                    {['top', 'side'].map(v => (
                        <div key={v} className="bg-black border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
                            <div className="bg-slate-800 text-[10px] px-2 py-1 font-bold uppercase tracking-widest">{v} View</div>
                            <canvas ref={v === 'top' ? topCanvasRef : sideCanvasRef} onMouseDown={e => handleMouseDown(e, v)} onMouseMove={e => handleMouseMove(e, v)} className="cursor-move" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Sidebar & Footer same as before */}
            <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 flex flex-col shadow-2xl">
                <h2 className="text-orange-500 font-black text-lg mb-4 border-b border-slate-800 pb-2 italic text-center">X-SIM V3 REGISTRY</h2>
                <CategorySelect categories={categories} value={selectedCategoryId} onChange={setSelectedCategoryId} skipFirst={true} className="mb-6 text-black" />
                <div className="flex-1 overflow-y-auto space-y-2">
                    {itemList.map(item => (
                        <div key={item.id} onClick={() => handleSelectItem(item)} className="bg-slate-800/80 border border-slate-700 rounded-lg p-2 hover:border-orange-500 cursor-pointer flex gap-3 items-center group">
                            <div className="w-12 h-12 bg-black rounded border border-slate-600 flex-shrink-0 overflow-hidden">
                                <img src={`${API_URL}/${item.top}`} alt="p" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xs font-bold truncate group-hover:text-orange-400">{item.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md p-4 border-t border-slate-700 flex flex-row items-center justify-between gap-6 z-50">
                <div className="flex items-center gap-6 border-r border-slate-800 pr-6">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={multiplyEnabled} onChange={e => setMultiplyEnabled(e.target.checked)} className="h-4 w-4 accent-blue-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Multiply</span>
                    </div>
                    <div className="w-24">
                        <span className="text-[10px] text-yellow-500 block font-bold uppercase">Luma: {threshold}</span>
                        <input type="range" min="0" max="255" value={threshold} onChange={e => setThreshold(+e.target.value)} className="w-full h-1 accent-yellow-500" />
                    </div>
                </div>
                <div className="flex gap-4 items-center flex-1">
                    {['x', 'y', 'z'].map(axis => (
                        <div key={axis} className="flex flex-col">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Pos {axis}</span>
                            <input type="number" value={rect[axis]} onChange={e => setRect(p => ({ ...p, [axis]: +e.target.value }))} className="w-16 bg-black text-[10px] p-1 rounded border border-slate-700" />
                        </div>
                    ))}
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigator.clipboard.writeText(JSON.stringify(rect))} className="bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-black px-4 py-2 rounded-lg">JSON</button>
                    <button onClick={uploadCanvas} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black px-4 py-2 rounded-lg shadow-lg uppercase">Save Simulation</button>
                </div>
            </div>
        </div>
    );
}