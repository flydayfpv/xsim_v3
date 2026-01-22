"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Swal from "sweetalert2";

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
	}

	clearIcon() {
		this.iconPosition = null;
		this.redraw();
	}

	zoom(factor) {
		this.scale *= factor;
		if (this.scale < 0.2) this.scale = 0.2;
		if (this.scale > 5) this.scale = 5;
		this.redraw();
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
			this.imageY = (this.canvas.height - img.height) / 2;
			this.redraw();
		} catch (err) {
			console.error("Failed to draw image:", err);
		}
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

	togglePause() { this.isPaused = !this.isPaused; }

	setIcon(x, y) {
		this.iconPosition = { x, y };
		this.redraw();
	}

	redraw() {
		if (!this.originalImage) return;
		const img = this.originalImage;
		this.clearScreen();
		const drawX = this.imageX;
		const drawY = (this.canvas.height - img.height * this.scale) / 2;
		const drawW = img.width * this.scale;
		const drawH = img.height * this.scale;
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

	superEnhance() {
		if (!this.originalImage) return;

		// 1. วาดรูปปัจจุบันลงบน Canvas เพื่อดึงพิกเซลล่าสุด
		this.redraw();

		const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		const data = imgData.data;
		const width = imgData.width;
		const height = imgData.height;

		// ทำสำเนาข้อมูลพิกเซลต้นฉบับ
		const copy = new Uint8ClampedArray(data);

		const getGray = (x, y) => {
			if (x < 0 || x >= width || y < 0 || y >= height) return 0;
			const i = (y * width + x) * 4;
			return 0.299 * copy[i] + 0.587 * copy[i + 1] + 0.114 * copy[i + 2];
		};

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const idx = (y * width + x) * 4;

				// 2. Sobel Operator (หาขอบ)
				const gx =
					-1 * getGray(x - 1, y - 1) + 1 * getGray(x + 1, y - 1) +
					-2 * getGray(x - 1, y) + 2 * getGray(x + 1, y) +
					-1 * getGray(x - 1, y + 1) + 1 * getGray(x + 1, y + 1);

				const gy =
					-1 * getGray(x - 1, y - 1) + -2 * getGray(x, y - 1) + -1 * getGray(x + 1, y - 1) +
					1 * getGray(x - 1, y + 1) + 2 * getGray(x, y + 1) + 1 * getGray(x + 1, y + 1);

				// คำนวณความเข้มข้นของขอบ และคูณด้วยน้ำหนัก (Weight) ให้เข้มขึ้น
				const edge = Math.sqrt(gx * gx + gy * gy) * 1.5; // เพิ่มตัวคูณตรงนี้ (1.5) เพื่อให้ขอบเข้มขึ้น

				// 3. ปรับ Contrast และความคมชัด (Unsharp Masking Simple Logic)
				// ผสมค่า Edge เข้ากับสีเดิม และลดความสว่างของสีพื้นลงเล็กน้อยเพื่อให้ขอบเด้งออกมา
				const contrast = 1.1; // เร่ง contrast
				const offset = -10;   // ลดความสว่างพื้นฐานลงนิดหน่อยเพื่อให้เห็นขอบซ้อนทับชัดขึ้น

				data[idx] = Math.min(255, Math.max(0, (copy[idx] * contrast) + edge + offset));
				data[idx + 1] = Math.min(255, Math.max(0, (copy[idx + 1] * contrast) + edge + offset));
				data[idx + 2] = Math.min(255, Math.max(0, (copy[idx + 2] * contrast) + edge + offset));
			}
		}

		// นำข้อมูลที่ประมวลผลแล้วกลับไปวาดบน Canvas
		this.ctx.putImageData(imgData, 0, 0);

		// วาดไอคอน 🔍 ทับ (ถ้ามี)
		if (this.iconPosition) {
			this.ctx.font = `${40 * this.scale}px Arial`;
			this.ctx.fillStyle = "red";
			this.ctx.textAlign = "center";
			this.ctx.textBaseline = "middle";
			this.ctx.fillText(ICON_CHAR, this.iconPosition.x, this.iconPosition.y);
		}
	}

	// --- Filters ---
	applyBlackAndWhite() {
		if (!this.originalImage) return;
		this.redraw();
		const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		const data = imageData.data;
		for (let i = 0; i < data.length; i += 4) {
			const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
			data[i] = data[i + 1] = data[i + 2] = avg;
		}
		this.ctx.putImageData(imageData, 0, 0);
	}

	invertColors() {
		if (!this.originalImage) return;
		this.redraw();
		const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		const data = imageData.data;
		for (let i = 0; i < data.length; i += 4) {
			data[i] = 255 - data[i];
			data[i + 1] = 255 - data[i + 1];
			data[i + 2] = 255 - data[i + 2];
		}
		this.ctx.putImageData(imageData, 0, 0);
	}

	organicOnly() {
		if (!this.originalImage) return;
		this.redraw();
		const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		const data = imgData.data;

		for (let i = 0; i < data.length; i += 4) {
			const r = data[i], g = data[i + 1], b = data[i + 2];

			// --- ปรับให้ดักจับสีฟ้าเข้ม (Dark Blue) และฟ้าสว่าง (Light Blue) ---

			// 1. ดักจับสีฟ้าเข้ม (Dark Blue): 
			// b > 30 (ลดลงมากเพื่อให้ดักสีเข้มๆ ได้) และ b ต้องเด่นกว่า r และ g
			const isDarkBlue = b > 30 && b > r && b > g - 20;

			// 2. ดักจับสีฟ้าสว่าง (Light Blue): 
			// b > 150 และยอมให้ r, g สูงขึ้นตามความสว่าง
			const isLightBlue = b > 150 && g > 130 && r < 210;

			// 3. เงื่อนไขครอบคลุมสีฟ้ามาตรฐาน (Standard Blue)
			const isStandardBlue = b > 80 && b > r + 10;

			if (isDarkBlue || isLightBlue || isStandardBlue) {
				// เปลี่ยนเป็นสีขาวดำ (Grayscale)
				const avg = (r + g + b) / 3;
				data[i] = data[i + 1] = data[i + 2] = avg;
			}
		}
		this.ctx.putImageData(imgData, 0, 0);

		// วาดไอคอนทับ (ถ้ามี)
		if (this.iconPosition) {
			this.ctx.font = `${40 * this.scale}px Arial`;
			this.ctx.fillStyle = "red";
			this.ctx.textAlign = "center";
			this.ctx.textBaseline = "middle";
			this.ctx.fillText(ICON_CHAR, this.iconPosition.x, this.iconPosition.y);
		}
	}

	organicStrip() {
		if (!this.originalImage) return;
		this.redraw();
		const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		const data = imgData.data;

		for (let i = 0; i < data.length; i += 4) {
			const r = data[i], g = data[i + 1], b = data[i + 2];

			// ปรับเงื่อนไขให้ครอบคลุมสีส้มสว่าง/จาง (High Light Orange)
			// R > 120 (ลดจาก 150 เพื่อให้เก็บสีจาง)
			// G อยู่ในช่วง 60 - 210 (ขยายเพิ่มเพื่อให้ครอบคลุมโทนส้มเหลือง)
			// B < 130 (เพิ่มจาก 100 เพื่อให้เก็บสีส้มที่เริ่มมีสีฟ้าปนในส่วนที่สว่างมากๆ)
			const isOrange = r > 110 && g > 50 && g < 220 && b < 160 && r > g && g > b;
			if (isOrange) {
				const avg = (r + g + b) / 3;
				data[i] = data[i + 1] = data[i + 2] = avg;
			}
		}
		this.ctx.putImageData(imgData, 0, 0);
	}

	applyEdgeDetection() {
		if (!this.originalImage) return;
		this.redraw();
		const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		const data = imgData.data;
		const width = imgData.width;
		const height = imgData.height;
		const copy = new Uint8ClampedArray(data);
		const getGray = (x, y) => {
			if (x < 0 || x >= width || y < 0 || y >= height) return 0;
			const i = (y * width + x) * 4;
			return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
		};
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const gx = -1 * getGray(x - 1, y - 1) + 1 * getGray(x + 1, y - 1) + -2 * getGray(x - 1, y) + 2 * getGray(x + 1, y) + -1 * getGray(x - 1, y + 1) + 1 * getGray(x + 1, y + 1);
				const gy = -1 * getGray(x - 1, y - 1) + -2 * getGray(x, y - 1) + -1 * getGray(x + 1, y - 1) + 1 * getGray(x - 1, y + 1) + 2 * getGray(x, y + 1) + 1 * getGray(x + 1, y + 1);
				const g = Math.sqrt(gx * gx + gy * gy);
				const idx = (y * width + x) * 4;
				copy[idx] = copy[idx + 1] = copy[idx + 2] = g > 255 ? 255 : g;
				copy[idx + 3] = 255;
			}
		}
		imgData.data.set(copy);
		this.ctx.putImageData(imgData, 0, 0);
	}

	hi() {
		if (!this.originalImage) return;
		this.redraw();
		const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		const data = imgData.data;
		for (let i = 0; i < data.length; i += 4) {
			data[i] = Math.min(255, Math.round(data[i] * 1.5));
			data[i + 1] = Math.min(255, Math.round(data[i + 1] * 1.5));
			data[i + 2] = Math.min(255, Math.round(data[i + 2] * 1.5));
		}
		this.ctx.putImageData(imgData, 0, 0);
	}

	restoreOriginal() {
		this.iconPosition = null;
		this.redraw();
	}
}

// --------------------------- Main Page ---------------------------
export default function Page() {
	const params = useParams();
	const [showSelect, setShowSelect] = useState(false);
	const [category, setCategory] = useState([]);
	const [selectedAnswer, setSelectedAnswer] = useState("");
	const [imageIndex, setImageIndex] = useState(0);
	const [imageList, setImageList] = useState([]);
	const [user, setUser] = useState(null);
	const [timeLeft, setTimeLeft] = useState(courseTime * 60);
	const leftCanvasRef = useRef(null);
	const rightCanvasRef = useRef(null);
	const [lastClickInside, setLastClickInside] = useState(false);

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

	const nextImage = () => {
		if (imageIndex >= imageList.length - 1) return;
		setSelectedAnswer("");
		setShowSelect(false);
		setImageIndex((prev) => prev + 1);
		leftCanvasRef.current.clearIcon();
		rightCanvasRef.current.clearIcon();
		leftCanvasRef.current.animateLeftToRight();
		rightCanvasRef.current.animateLeftToRight();
	};

	const checkAnswer = () => {
		if (!imageList.length) return;
		const currentImage = imageList[imageIndex];
		const correctId = currentImage?.itemCategoryID;
		let isCorrect = false;

		if (correctId !== 1) {
			if (parseInt(selectedAnswer) === correctId && lastClickInside) isCorrect = true;
		} else {
			if (parseInt(selectedAnswer) === 1) isCorrect = true;
		}

		if (isCorrect) {
			setScore((prev) => prev + 1);
			setHits((prev) => prev + 1);
			Swal.fire("✅ Correct!", "", "success");
		} else {
			setFars((prev) => prev + 1);
			Swal.fire("❌ Wrong!", "", "error");
		}
		nextImage();
	};

	const fetchImages = async () => {
		try {
			const res = await fetch(`${API_URL}/cbt/random/${area}`);
			const data = await res.json();
			const images = Array.isArray(data) ? data : [data];
			await Promise.all(
				images.map((img) =>
					Promise.all([
						preloadImage(`${API_URL}${img.top}`),
						preloadImage(`${API_URL}${img.side}`),
					])
				)
			);
			setImageList(images);
		} catch (err) { console.error(err); }
	};

	const preloadImage = (src) =>
		new Promise((resolve, reject) => {
			const img = new Image();
			img.src = src;
			img.onload = () => resolve(img);
			img.onerror = reject;
		});

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

	useEffect(() => {
		leftCanvasRef.current = new _Canvas("canvasLeft", -820, 0, () => nextImage());
		rightCanvasRef.current = new _Canvas("canvasRight", -820, 0, () => { });
		leftCanvasRef.current.start(canvasSize.width, canvasSize.height);
		rightCanvasRef.current.start(canvasSize.width, canvasSize.height);

		const keyHandler = (e) => {
			const key = String(e.key || "").toUpperCase();
			if (key === "Q") { leftCanvasRef.current.applyBlackAndWhite(); rightCanvasRef.current.applyBlackAndWhite(); }
			if (key === "W") { leftCanvasRef.current.invertColors(); rightCanvasRef.current.invertColors(); }
			// if (key === "F") { leftCanvasRef.current.applyEdgeDetection(); rightCanvasRef.current.applyEdgeDetection(); }
			if (key === "A") { leftCanvasRef.current.organicOnly(); rightCanvasRef.current.organicOnly(); }
			if (key === "S") { leftCanvasRef.current.organicStrip(); rightCanvasRef.current.organicStrip(); }
			if (key === "R") { leftCanvasRef.current.restoreOriginal(); rightCanvasRef.current.restoreOriginal(); }
			if (key === "D") { leftCanvasRef.current.hi(); rightCanvasRef.current.hi(); }
			if (key === " ") { leftCanvasRef.current.togglePause(); rightCanvasRef.current.togglePause(); }
			if (key === "E") {
				leftCanvasRef.current.superEnhance();
				rightCanvasRef.current.superEnhance();
			}
		};

		window.addEventListener("keydown", keyHandler);
		const timer = setInterval(() => { setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)); }, 1000);

		fetchCategory(); fetchImages(); fetchUser();
		return () => { window.removeEventListener("keydown", keyHandler); clearInterval(timer); };
	}, []);

	useEffect(() => {
		if (!imageList.length || imageIndex >= imageList.length) return;
		const currentImage = imageList[imageIndex];
		const topImg = `${API_URL}${currentImage.top}`;
		const sideImg = `${API_URL}${currentImage.side}`;

		leftCanvasRef.current?.drawImageFromURL(topImg).then(() => leftCanvasRef.current.animateLeftToRight());
		rightCanvasRef.current?.drawImageFromURL(sideImg).then(() => rightCanvasRef.current.animateLeftToRight());

		const leftClick = (e) => handleCanvasClick(leftCanvasRef.current, e, currentImage);
		const rightClick = (e) => handleCanvasClick(rightCanvasRef.current, e, currentImage);

		leftCanvasRef.current.canvas.addEventListener("click", leftClick);
		rightCanvasRef.current.canvas.addEventListener("click", rightClick);

		return () => {
			leftCanvasRef.current.canvas.removeEventListener("click", leftClick);
			rightCanvasRef.current.canvas.removeEventListener("click", rightClick);
		};
	}, [imageList, imageIndex]);

	// --- UPDATED CLICK HANDLER WITH AUTO-RESET LOGIC ---
	const handleCanvasClick = (canvasRef, e, imageData) => {
		if (!canvasRef || !canvasRef.canvas) return;

		// 🛑 CRITERIA: ONLY ALLOW CLICKS IF THE CANVAS IS PAUSED
		if (!canvasRef.isPaused) return;

		const rect = canvasRef.canvas.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const clickY = e.clientY - rect.top;

		// Calculate the position relative to the moving image
		const imageX = clickX - canvasRef.lastDraw.x;
		const imageY = clickY - canvasRef.lastDraw.y;

		// 🔄 AUTO-RESET: Clear filters and icons on BOTH canvases (like pressing "R")
		leftCanvasRef.current.restoreOriginal();
		rightCanvasRef.current.restoreOriginal();

		// Now set the new icon on the clicked canvas
		canvasRef.setIcon(clickX, clickY);

		let itemPos = null;
		try {
			// Handle stringified JSON from your response
			itemPos = typeof imageData.itemPos === 'string'
				? JSON.parse(imageData.itemPos)
				: imageData.itemPos;
		} catch (err) {
			console.error("JSON Error", err);
		}

		if (!itemPos) {
			setLastClickInside(false);
			return;
		}

		// Hit detection using .w and .h from your API response
		const inside = imageX >= itemPos.x &&
			imageX <= itemPos.x + itemPos.w &&
			imageY >= itemPos.y &&
			imageY <= itemPos.y + itemPos.h;

		setLastClickInside(inside);
	};

	const formatTime = (seconds) => {
		const m = Math.floor(seconds / 60).toString().padStart(2, "0");
		const s = (seconds % 60).toString().padStart(2, "0");
		return `${m}:${s}`;
	};

	// Derived Rate Helper
	const total = hits + fars;
	const hrs = total > 0 ? Math.round((hits / total) * 100) : 0;
	const far = 100 - hrs;

	return (
		<div className="flex flex-col h-screen w-screen bg-black overflow-hidden">
			<div className="flex-1 flex bg-black">
				<div className="flex-1 m-1 flex items-center justify-center" id="canvasLeft"></div>
				<div className="flex-1 m-1 flex items-center justify-center" id="canvasRight"></div>
				<div className="flex w-[300px] h-[980px] bg-white mt-2 p-5 rounded-2xl border border-red-400 flex flex-col gap-4">
					<button onClick={() => setShowSelect(!showSelect)} className="p-4 bg-red-600 text-white text-2xl font-bold rounded-2xl">Answer</button>
					{showSelect && (
						<select className="w-full p-2 text-center" size="6" value={selectedAnswer} onChange={(e) => setSelectedAnswer(e.target.value)}>
							<option value="" disabled>-- Select Category --</option>
							{category.map((cat) => (
								<option key={cat.id} value={cat.id} className="p-2 border rounded-md mt-2 shadow">{cat.category}</option>
							))}
						</select>
					)}
					{selectedAnswer && (
						<button onClick={checkAnswer} className="p-4 bg-yellow-600 text-white text-2xl font-bold rounded-2xl">Confirm</button>
					)}
				</div>
			</div>
			<div className="h-[80px] border-t p-2 text-white bg-gradient-to-t from-black to-gray-800 flex items-center justify-around">
				<div className="text-xl">{formatTime(timeLeft)}</div>
				<div className="text-center">
					{user?.fname} {user?.lname} | Score: {score} | Index: {imageIndex + 1}/{imageList.length}
				</div>
				<div>HRS: {hrs}% | FAR: {far}%</div>
			</div>
		</div>
	);
}