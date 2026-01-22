"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Swal from "sweetalert2";
import CategorySelect from "@/app/components/CategorySelect";

const ICON_CHAR = "🔍";
const canvasSize = { width: 850, height: 980 };
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const courseTime = 20; // minutes
const speed = 2;

// --------------------------- Canvas Class ---------------------------
class _Canvas {
    constructor(domId, imageX, imageY, onAnimationEnd) {
        this.domId = domId;
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.originalImage = null;
        this.iconPosition = null; 
        this.imageX = imageX || -820;
        this.imageY = imageY || 0;
        this.onAnimationEnd = onAnimationEnd;
        this.scale = 1; 
        this.isPaused = false;
        this.animating = false;
        this.lastDraw = { x: 0, y: 0, w: 0, h: 0 };
        this.debugOffsetY = 0; 
    }

    start(w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.canvas.style.border = "1px solid gray";
        this.canvas.style.borderRadius = "20px";
        const domTarget = document.getElementById(this.domId);
        if (domTarget) {
            domTarget.innerHTML = "";
            domTarget.appendChild(this.canvas);
        }
        this.clearScreen();
    }

    clearScreen() {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    async drawImageFromURL(url) {
        try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = url;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            this.originalImage = img;
            this.imageX = -img.width;
            this.imageY = (this.canvas.height - (img.height * this.scale)) / 2;
            this.redraw();
        } catch (err) { console.error("Load Error:", err); }
    }

    animateLeftToRight() {
        if (!this.originalImage) return;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.animating = true;
        this.imageX = -this.originalImage.width;
        this.isPaused = false;
        const step = () => {
            if (!this.isPaused) {
                this.imageX += speed;
                this.redraw();
            }
            if (this.imageX > this.canvas.width) {
                this.animating = false;
                this.animationFrameId = null;
                if (this.onAnimationEnd) this.onAnimationEnd(); 
                return;
            }
            this.animationFrameId = requestAnimationFrame(step);
        };
        step();
    }

    redraw() {
        if (!this.originalImage) return;
        const img = this.originalImage;
        this.clearScreen();
        const drawW = img.width * this.scale;
        const drawH = img.height * this.scale;
        const drawX = this.imageX;
        const drawY = (this.canvas.height - drawH) / 2;

        this.ctx.drawImage(img, drawX, drawY, drawW, drawH);
        this.lastDraw = { x: drawX, y: drawY, w: drawW, h: drawH };

        if (this.iconPosition) {
            this.ctx.font = `${40 * this.scale}px Arial`;
            this.ctx.fillStyle = "red";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(ICON_CHAR, this.iconPosition.x, this.iconPosition.y);
        }
    }

    handleWheel(e) {
        e.preventDefault();
        const zoomSpeed = 0.1;
        if (e.deltaY < 0) this.scale = Math.min(this.scale + zoomSpeed, 5);
        else this.scale = Math.max(this.scale - zoomSpeed, 0.2);
        this.redraw();
    }

    // ✨ NEW: Added Zoom Reset Method
    resetZoom() {
        this.scale = 1;
        this.iconPosition = null;
    }

    togglePause() { this.isPaused = !this.isPaused; }
    setIcon(x, y) { this.iconPosition = { x, y }; this.redraw(); }
    restoreOriginal() { this.iconPosition = null; this.redraw(); }

    drawDebugRect(itemPos) {
    if (!itemPos) return;
    
    // Position = (Offset + (LocalCoord * Scale))
    const realX = this.lastDraw.x + (itemPos.x * this.scale);
    const realY = this.lastDraw.y + ((itemPos.y + this.debugOffsetY) * this.scale);
    
    const realW = itemPos.w * this.scale;
    const realH = itemPos.h * this.scale;

    this.ctx.strokeStyle = "#00FF00";
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(realX, realY, realW, realH);
    this.ctx.setLineDash([]);
}

    applyBlackAndWhite() { if (!this.originalImage) return; this.redraw(); const imgData = this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height); const data = imgData.data; for(let i=0; i<data.length; i+=4){ const avg=(data[i]+data[i+1]+data[i+2])/3; data[i]=data[i+1]=data[i+2]=avg; } this.ctx.putImageData(imgData,0,0); }
    organicStrip() { if (!this.originalImage) return; this.redraw(); const imgData = this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height); const data = imgData.data; for(let i=0; i<data.length; i+=4){ const r=data[i],g=data[i+1],b=data[i+2]; const isO=r>110 && g>50 && g<220 && b<160 && r>g && g>b; if(isO){ const avg=(r+g+b)/3; data[i]=data[i+1]=data[i+2]=avg; } } this.ctx.putImageData(imgData,0,0); }
    organicOnly() { if (!this.originalImage) return; this.redraw(); const imgData = this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height); const data = imgData.data; for(let i=0; i<data.length; i+=4){ const r=data[i],g=data[i+1],b=data[i+2]; const isD=b>30 && b>r && b>g-20; const isL=b>150 && g>130 && r<210; if(isD || isL){ const avg=(r+g+b)/3; data[i]=data[i+1]=data[i+2]=avg; } } this.ctx.putImageData(imgData,0,0); }
    superEnhance() { if (!this.originalImage) return; this.redraw(); const imgData = this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height); const data = imgData.data; const w=imgData.width, h=imgData.height; const copy=new Uint8ClampedArray(data); const gG=(x,y)=>{ if(x<0||x>=w||y<0||y>=h) return 0; const i=(y*w+x)*4; return 0.299*copy[i]+0.587*copy[i+1]+0.114*copy[i+2]; }; for(let y=0; y<h; y++){ for(let x=0; x<w; x++){ const gx=-1*gG(x-1,y-1)+1*gG(x+1,y-1)-2*gG(x-1,y)+2*gG(x+1,y)-1*gG(x-1,y+1)+1*gG(x+1,y+1); const gy=-1*gG(x-1,y-1)-2*gG(x,y-1)-1*gG(x+1,y-1)+1*gG(x-1,y+1)+2*gG(x,y+1)+1*gG(x+1,y+1); const e=Math.sqrt(gx*gx+gy*gy)*1.5; const i=(y*w+x)*4; data[i]=Math.min(255,(copy[i]*1.1)+e-10); data[i+1]=Math.min(255,(copy[i+1]*1.1)+e-10); data[i+2]=Math.min(255,(copy[i+2]*1.1)+e-10); } } this.ctx.putImageData(imgData,0,0); }
}

// --------------------------- Main Page ---------------------------
export default function Page() {
    const params = useParams();
    const [showSelect, setShowSelect] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [category, setCategory] = useState([]);
    const [selectedAnswer, setSelectedAnswer] = useState("");
    const [imageIndex, setImageIndex] = useState(0);
    const [imageList, setImageList] = useState([]);
    const [user, setUser] = useState(null);
    const [timeLeft, setTimeLeft] = useState(courseTime * 60);
    
    const leftCanvasRef = useRef(null);
    const rightCanvasRef = useRef(null);
    const [lastClickInside, setLastClickInside] = useState(null);
    const [clicked, setClicked] = useState(false);

    const area = params.typeid;
    const [score, setScore] = useState(0);
    const [hits, setHits] = useState(0);
    const [fars, setFars] = useState(0);

    const fetchCategory = async () => {
        try {
            const res = await fetch(`${API_URL}/categories`);
            const data = await res.json();
            setCategory(data || []);
        } catch (err) { console.error(err); }
    };

    const fetchImages = async () => {
        try {
            const res = await fetch(`${API_URL}/cbt/random/${area}`);
            const data = await res.json();
            const images = Array.isArray(data) ? data : [data];
            setImageList(images);
        } catch (err) { console.error(err); }
    };

    const fetchUser = async () => {
        try {
            const XuserId = localStorage.getItem("XuserId");
            const Xtoken = localStorage.getItem("Xtoken");
            if (!XuserId || !Xtoken) return;
            const res = await fetch(`${API_URL}/users/${XuserId}`, {
                headers: { Authorization: `Bearer ${Xtoken}` },
            });
            const data = await res.json();
            setUser(data);
        } catch (err) { console.error(err); }
    };

    const nextImage = () => {
        // ✨ Reset zoom and states on every transition
        leftCanvasRef.current.resetZoom();
        rightCanvasRef.current.resetZoom();
        setSelectedAnswer(""); 
        setLastClickInside(null); 
        setClicked(false);

        if (imageIndex >= imageList.length - 1) {
            console.log("Looping: Fetching new batch...");
            setImageIndex(0);
            fetchImages(); 
            return;
        }
        
        setImageIndex((prev) => prev + 1);
        leftCanvasRef.current.animateLeftToRight();
        rightCanvasRef.current.animateLeftToRight();
    };

    const checkAnswer = () => {
        if (!imageList.length || isFinished) return;
        const currentImage = imageList[imageIndex];
        const correctId = currentImage?.itemCategoryID;
        let isCorrect = (parseInt(selectedAnswer) === correctId);
        
        if (correctId !== 1 && !lastClickInside) isCorrect = false;

        if (isCorrect) {
            setScore(s => s + 1); setHits(h => h + 1);
            Swal.fire({ title: "✅ Correct!", timer: 800, showConfirmButton: false, icon: "success" });
        } else {
            setFars(f => f + 1);
            Swal.fire({ title: "❌ Wrong!", timer: 800, showConfirmButton: false, icon: "error" });
        }
        nextImage();
    };

    useEffect(() => {
        leftCanvasRef.current = new _Canvas("canvasLeft", -820, 0, () => nextImage());
        rightCanvasRef.current = new _Canvas("canvasRight", -820, 0, () => { });
        
        rightCanvasRef.current.debugOffsetY = 175; 

        leftCanvasRef.current.start(canvasSize.width, canvasSize.height);
        rightCanvasRef.current.start(canvasSize.width, canvasSize.height);

        const leftCvs = leftCanvasRef.current.canvas;
        const rightCvs = rightCanvasRef.current.canvas;
        leftCvs.addEventListener("wheel", (e) => leftCanvasRef.current.handleWheel(e), { passive: false });
        rightCvs.addEventListener("wheel", (e) => rightCanvasRef.current.handleWheel(e), { passive: false });

        const keyHandler = (e) => {
            const key = e.key.toUpperCase();
            if (key === "Q") { leftCanvasRef.current.applyBlackAndWhite(); rightCanvasRef.current.applyBlackAndWhite(); }
            if (key === "A") { leftCanvasRef.current.organicOnly(); rightCanvasRef.current.organicOnly(); }
            if (key === "S") { leftCanvasRef.current.organicStrip(); rightCanvasRef.current.organicStrip(); }
            if (key === "R") { 
                leftCanvasRef.current.resetZoom(); // ✨ Also reset zoom on R key
                rightCanvasRef.current.resetZoom(); 
                leftCanvasRef.current.redraw();
                rightCanvasRef.current.redraw();
            }
            if (key === "F") { leftCanvasRef.current.superEnhance(); rightCanvasRef.current.superEnhance(); }
            if (key === " ") { leftCanvasRef.current.togglePause(); rightCanvasRef.current.togglePause(); }
        };

        window.addEventListener("keydown", keyHandler);
        const timerInterval = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timerInterval);
                    setIsFinished(true);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        
        fetchCategory(); fetchImages(); fetchUser();
        return () => { 
            window.removeEventListener("keydown", keyHandler); 
            clearInterval(timerInterval);
        };
    }, []);

    useEffect(() => {
        if (!imageList.length || imageIndex >= imageList.length || isFinished) return;
        
        const currentImage = imageList[imageIndex];
        const topImgUrl = `${API_URL}${currentImage.top}`;
        const sideImgUrl = `${API_URL}${currentImage.side}`;

        leftCanvasRef.current?.drawImageFromURL(topImgUrl).then(() => leftCanvasRef.current.animateLeftToRight());
        rightCanvasRef.current?.drawImageFromURL(sideImgUrl).then(() => rightCanvasRef.current.animateLeftToRight());

        const leftClick = (e) => handleCanvasClick(leftCanvasRef.current, e, currentImage);
        const rightClick = (e) => handleCanvasClick(rightCanvasRef.current, e, currentImage);
        
        leftCanvasRef.current.canvas.addEventListener("click", leftClick);
        rightCanvasRef.current.canvas.addEventListener("click", rightClick);

        return () => {
            leftCanvasRef.current.canvas.removeEventListener("click", leftClick);
            rightCanvasRef.current.canvas.removeEventListener("click", rightClick);
        };
    }, [imageList, imageIndex, isFinished]);

    const handleCanvasClick = (canvasRef, e, imageData) => {
    if (!canvasRef.isPaused) return;

    const rect = canvasRef.canvas.getBoundingClientRect();
    
    // 1. Get click position relative to the canvas element
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // 2. Subtract the current animation/position offsets (lastDraw.x/y)
    // 3. Divide by the scale to get back to the original image pixels
    const imageX = (clickX - canvasRef.lastDraw.x) / canvasRef.scale;
    
    // Note: If you have a debugOffsetY, subtract it BEFORE scaling 
    // if it's a screen-space offset, or AFTER if it's an image-space offset.
    // Assuming debugOffsetY is an image-space adjustment:
    const imageY = ((clickY - canvasRef.lastDraw.y) / canvasRef.scale) - canvasRef.debugOffsetY;

    canvasRef.setIcon(clickX, clickY);

    const itemPos = typeof imageData.itemPos === 'string' 
        ? JSON.parse(imageData.itemPos) 
        : imageData.itemPos;

    if (itemPos) {
        // Now imageX and imageY are in the same "coordinate space" as your JSON itemPos
        const inside = imageX >= itemPos.x && 
                       imageX <= itemPos.x + itemPos.w && 
                       imageY >= itemPos.y && 
                       imageY <= itemPos.y + itemPos.h;
        
        setLastClickInside(inside);
        setClicked(true);
        canvasRef.drawDebugRect(itemPos);
    }
};

    const formatTime = (seconds) => `${Math.floor(seconds/60).toString().padStart(2,"0")}:${(seconds%60).toString().padStart(2,"0")}`;

    return (
        <div className="flex flex-col h-screen w-screen bg-black overflow-hidden">
            <div className="flex-1 flex bg-black">
                <div className="flex-1 m-1 flex items-center justify-center relative">
                    {isFinished && (
                        <div className="absolute z-10 p-10 bg-black/70 border border-yellow-500 rounded-2xl text-center shadow-2xl">
                            <h2 className="text-3xl text-yellow-400 font-bold mb-4">Exam Completed!</h2>
                            <p className="text-white text-lg">Redirecting or saving results...</p>
                        </div>
                    )}
                    <div className="flex-1 flex w-full">
                        <div className="flex-1 m-1 flex items-center justify-center" id="canvasLeft"></div>
                        <div className="flex-1 m-1 flex items-center justify-center" id="canvasRight"></div>
                    </div>
                </div>
                
                <div className={`flex w-[320px] bg-white m-2 p-5 rounded-2xl flex-col gap-4 shadow-xl ${isFinished ? 'opacity-30 pointer-events-none' : ''}`}>
                    <button onClick={() => setShowSelect(!showSelect)} className="p-4 bg-red-600 text-white font-bold rounded-2xl text-xl hover:bg-red-700 transition">
                        Answer
                    </button>
                    
                    {/* ✨ Using CategorySelect Component */}
                    {showSelect && (
                        <CategorySelect 
                            categories={category}
                            value={selectedAnswer}
                            onChange={setSelectedAnswer}
                            className="flex-1 overflow-hidden"
                        />
                    )}

                    {selectedAnswer && (
                        <button onClick={checkAnswer} className="p-4 bg-yellow-600 text-white font-bold rounded-2xl text-xl hover:bg-yellow-700 transition">
                            Confirm
                        </button>
                    )}
                    
                    <div className="mt-auto p-4 border rounded-xl bg-gray-50 text-center shadow-sm">
                        <p className="text-xs font-bold text-gray-400 mb-1 tracking-widest uppercase">Detection Result</p>
                        {clicked ? (
                            <span className={`text-2xl font-black ${lastClickInside ? "text-green-600" : "text-red-600"}`}>
                                {lastClickInside ? "🎯 TARGET HIT" : "⭕ TARGET MISS"}
                            </span>
                        ) : <span className="text-gray-300">WAITING...</span>}
                    </div>
                </div>
            </div>

            <div className="h-[80px] bg-gray-900 flex items-center justify-around text-white border-t border-gray-700 px-10">
                <div className="text-4xl font-mono text-yellow-500">{formatTime(timeLeft)}</div>
                <div className="text-lg font-semibold uppercase tracking-wider">
                    {user?.fname} {user?.lname} | Score: <span className="text-2xl text-green-400">{score}</span> | Progress: {imageIndex + 1}/{imageList.length}
                </div>
                <div className="flex gap-10">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 uppercase">Hit Rate</span>
                        <span className="text-2xl font-bold text-green-400">{(hits/(hits+fars+0.0001)*100).toFixed(0)}%</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 uppercase">False Alarm</span>
                        <span className="text-2xl font-bold text-red-400">{(fars/(hits+fars+0.0001)*100).toFixed(0)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}