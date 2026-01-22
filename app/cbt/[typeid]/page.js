"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Swal from "sweetalert2";

const ICON_CHAR = "🔍";
const canvasSize = { width: 930, height: 980 };
const API_URL = "http://localhost:3091";
const courseTime = 20; // minutes
const speed = 2;

// --------------------------- Canvas Class ---------------------------
class _Canvas {
	constructor(domId, imageX, imageY, onAnimationEnd) {
		this.domId = domId;
		this.canvas = document.createElement("canvas");
		this.ctx = this.canvas.getContext("2d");
		this.originalImage = null;
		this.originalDataURL = null;
		this.iconPosition = null; // last icon position
		this.imageX = imageX || -820;
		this.imageY = imageY || 0;
		this.onAnimationEnd = onAnimationEnd;
		this.scale = 1; // default zoom
		this.isPaused = false;
		this.animating = false;
		this.lastDraw = { x: 0, y: 0, w: 0, h: 0 };
	}

	clearIcon() {
		this.iconPosition = null;   // 👉 ลบตำแหน่งไอคอน
		this.redraw();              // 👉 วาดใหม่ (ไม่มีไอคอนแล้ว)
	}
	zoom(factor) {
		this.scale *= factor;
		if (this.scale < 0.2) this.scale = 0.2; // prevent too small
		if (this.scale > 5) this.scale = 5; // prevent too large
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

			// initial position (put off-left so animation enters)
			this.imageX = -img.width;
			this.imageY = (this.canvas.height - img.height) / 2;

			this.redraw();
		} catch (err) {
			console.error("Failed to draw image:", err);
		}
	}

	animateLeftToRight() {
	if (!this.originalImage) return;

	// ยกเลิก animation เดิมก่อน
	if (this.animationFrameId) {
		cancelAnimationFrame(this.animationFrameId);
	}

	this.animating = true;
	this.imageX = -this.originalImage.width;
	this.isPaused = false;

	const step = () => {
		if (!this.isPaused) {
			this.imageX += speed;
			this.redraw();
		}

		// ✅ ถ้าภาพหลุดขอบจอด้านขวา → เรียก onAnimationEnd (nextImage)
		if (this.imageX > this.canvas.width) {
			this.animating = false;
			this.animationFrameId = null;
			if (this.onAnimationEnd) this.onAnimationEnd();
			return; // หยุด animation
		}

		this.animationFrameId = requestAnimationFrame(step);
	};

	step();
}



	togglePause() {
		this.isPaused = !this.isPaused;
	}

	setIcon(x, y) {
		this.iconPosition = { x, y };
		this.redraw();
	}

	// redraw uses this.originalImage and this.scale
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

		// redraw icon if exists
		if (this.iconPosition) {
			this.ctx.font = `${40 * this.scale}px Arial`;
			this.ctx.fillStyle = "red";
			this.ctx.textAlign = "center";
			this.ctx.textBaseline = "middle";
			this.ctx.fillText(ICON_CHAR, this.iconPosition.x, this.iconPosition.y);
		}
	}

	applyBlackAndWhite() {
		if (!this.originalImage) return;
		// Ensure we draw the original image first
		this.redraw();

		const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		const data = imageData.data;
		for (let i = 0; i < data.length; i += 4) {
			const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
			data[i] = data[i + 1] = data[i + 2] = avg;
		}
		this.ctx.putImageData(imageData, 0, 0);

		if (this.iconPosition) {
			this.ctx.font = `${40 * this.scale}px Arial`;
			this.ctx.fillStyle = "red";
			this.ctx.textAlign = "center";
			this.ctx.textBaseline = "middle";
			this.ctx.fillText(ICON_CHAR, this.iconPosition.x, this.iconPosition.y);
		}
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

		if (this.iconPosition) {
			this.ctx.font = `${40 * this.scale}px Arial`;
			this.ctx.fillStyle = "red";
			this.ctx.textAlign = "center";
			this.ctx.textBaseline = "middle";
			this.ctx.fillText(ICON_CHAR, this.iconPosition.x, this.iconPosition.y);
		}
	}

	organicOnly() {
		if (!this.originalImage) return;
		this.redraw();

		const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		const data = imgData.data;

		for (let i = 0; i < data.length; i += 4) {
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];

			const isLightBlue = b > 150 && g > 120 && r < 120;
			const isMediumBlue = b > 120 && r < 100 && g < 120;
			const isDarkBlue =
				b > r + 10 &&
				b > g + 10 &&
				b > 30 &&
				r < 60 &&
				g < 60 &&
				r + g + b < 180;

			if (isLightBlue || isMediumBlue || isDarkBlue) {
				const avg = (r + g + b) / 3;
				data[i] = data[i + 1] = data[i + 2] = avg;
			}
		}

		this.ctx.putImageData(imgData, 0, 0);

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
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];

			if (r > 150 && g > 60 && g < 200 && b < 100) {
				const avg = (r + g + b) / 3;
				data[i] = data[i + 1] = data[i + 2] = avg;
			}
		}

		this.ctx.putImageData(imgData, 0, 0);

		if (this.iconPosition) {
			this.ctx.font = `${40 * this.scale}px Arial`;
			this.ctx.fillStyle = "red";
			this.ctx.textAlign = "center";
			this.ctx.textBaseline = "middle";
			this.ctx.fillText(ICON_CHAR, this.iconPosition.x, this.iconPosition.y);
		}
	}

	applyEdgeDetection() {
		try {
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
					const gx =
						-1 * getGray(x - 1, y - 1) + 1 * getGray(x + 1, y - 1) +
						-2 * getGray(x - 1, y) + 2 * getGray(x + 1, y) +
						-1 * getGray(x - 1, y + 1) + 1 * getGray(x + 1, y + 1);

					const gy =
						-1 * getGray(x - 1, y - 1) + -2 * getGray(x, y - 1) + -1 * getGray(x + 1, y - 1) +
						1 * getGray(x - 1, y + 1) + 2 * getGray(x, y + 1) + 1 * getGray(x + 1, y + 1);

					const g = Math.sqrt(gx * gx + gy * gy);
					const idx = (y * width + x) * 4;
					copy[idx] = copy[idx + 1] = copy[idx + 2] = g > 255 ? 255 : g;
					copy[idx + 3] = 255;
				}
			}

			imgData.data.set(copy);
			this.ctx.putImageData(imgData, 0, 0);
		} catch (err) {
			console.error(err);
		}
	}

	// brightness +50% (Hi filter)
	hi() {
		if (!this.originalImage) return;
		this.redraw();

		const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		const data = imgData.data;

		for (let i = 0; i < data.length; i += 4) {
			// multiply by 1.5 (50% brighter)
			data[i] = Math.min(255, Math.round(data[i] * 1.5)); // R
			data[i + 1] = Math.min(255, Math.round(data[i + 1] * 1.5)); // G
			data[i + 2] = Math.min(255, Math.round(data[i + 2] * 1.5)); // B
			// keep alpha
		}

		this.ctx.putImageData(imgData, 0, 0);

		if (this.iconPosition) {
			this.ctx.font = `${40 * this.scale}px Arial`;
			this.ctx.fillStyle = "red";
			this.ctx.textAlign = "center";
			this.ctx.textBaseline = "middle";
			this.ctx.fillText(ICON_CHAR, this.iconPosition.x, this.iconPosition.y);
		}
	}

	// single restoreOriginal, clears icon too
	restoreOriginal() {
		this.iconPosition = null;
		this.redraw();
	}
} // <-- closes class correctly

// --------------------------- Main Page ---------------------------
export default function Page() {
	const params = useParams();
	const [isFinished, setIsFinished] = useState(false);
	const [showSelect, setShowSelect] = useState(false);
	const [category, setCategory] = useState([]);
	const [selectedAnswer, setSelectedAnswer] = useState("");
	const [imageIndex, setImageIndex] = useState(0);
	const [imageList, setImageList] = useState([]);
	const [user, setUser] = useState(null);
	const [timeLeft, setTimeLeft] = useState(courseTime * 60); // countdown in seconds
	const leftCanvasRef = useRef(null);
	const rightCanvasRef = useRef(null);
	const [clicked, setClicked] = useState(false);
	const [lastClickInside, setLastClickInside] = useState(false);


	// For database 	
	const area = params.area;
	const [score, setScore] = useState(0);
	const [hits, setHits] = useState(0);
	const [fars, setFars] = useState(0);
	const [hitImage, setHiiImage] = useState([])
	const [falseImage, setFalseImage] = useState([])
	const [timeGet, setTimeGet] = useState(0)


	// ------------------- Functions -------------------
	const fetchCategory = async () => {
		try {
			const res = await fetch(`${API_URL}/categories`);
			const data = await res.json();
			setCategory(data || []);
		} catch (err) {
			console.error(err);
		}
	};

	const nextImage = () => {
		if (imageIndex >= imageList.length - 1) {
			setImageIndex(0); // Ensure index is at the end
			// Swal.fire("✅ Finished all images");
			// leftCanvasRef.current.isPaused = true;
			// rightCanvasRef.current.isPaused = true;
			// setIsFinished(true);
			return;
		}

		setSelectedAnswer("");
		setShowSelect(false);
		setImageIndex((prev) => prev + 1);

		// 👉 เคลียร์ไอคอนเก่าออกก่อนเริ่มรูปใหม่
		leftCanvasRef.current.clearIcon();
		rightCanvasRef.current.clearIcon();

		// Resume animation if paused
		leftCanvasRef.current.isPaused = false;
		rightCanvasRef.current.isPaused = false;

		// Restart animation for new image
		leftCanvasRef.current.animateLeftToRight();
		rightCanvasRef.current.animateLeftToRight();
	};



	const checkAnswer = () => {
		if (!imageList.length || imageIndex >= imageList.length) return;

		const currentImage = imageList[imageIndex];
		const correctId = currentImage?.itemCategoryID;

		if (!correctId) return;

		let isCorrect = false;

		// Rule 1: category != 1 → must match and inside click
		if (correctId !== 1) {
			if (parseInt(selectedAnswer) === correctId && lastClickInside) {
				isCorrect = true;
			}
		}
		// Rule 2: category == 1 → must select 1
		else {
			if (parseInt(selectedAnswer) === 1) {
				isCorrect = true;
			}
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

	// ------------------- Derived rates -------------------
	const total = hits + fars;
	const hrs = total > 0 ? Math.round((hits / total) * 100) : 0;
	const far = 100 - hrs;

	const fetchImages = async () => {
		try {
			const res = await fetch(`${API_URL}/cbtCba/random/${area}`);
			const data = await res.json();
			const images = data.data || [];

			await Promise.all(
				images.map((img) =>
					Promise.all([
						preloadImage(`${API_URL}/uploads/${img.topImage}`),
						preloadImage(`${API_URL}/uploads/${img.sideImage}`),
					])
				)
			);

			setImageList(images);
		} catch (err) {
			console.error(err);
		}
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
			if (!res.ok) throw new Error("Failed to fetch user");
			const data = await res.json();
			setUser(data);
		} catch (err) {
			console.error(err);
		}
	};

	// ------------------- Init Hook -------------------
	useEffect(() => {
		let keyHandler = null;
		let qwtimer = null;

		// create canvases once
		leftCanvasRef.current = new _Canvas("canvasLeft", -820, 0, () => nextImage());
		rightCanvasRef.current = new _Canvas("canvasRight", -820, 0, () => { });

		leftCanvasRef.current.start(canvasSize.width, canvasSize.height);
		rightCanvasRef.current.start(canvasSize.width, canvasSize.height);

		// key handler with defensive guards
		keyHandler = (e) => {
			const key = String(e.key || "").toUpperCase();
			try {
				switch (key) {
					case "Q":
						leftCanvasRef.current?.applyBlackAndWhite();
						rightCanvasRef.current?.applyBlackAndWhite();
						break;
					case "W":
						leftCanvasRef.current?.invertColors();
						rightCanvasRef.current?.invertColors();
						break;
					case "E":
						leftCanvasRef.current?.applyEdgeDetection();
						rightCanvasRef.current?.applyEdgeDetection();
						break;
					case "A":
						leftCanvasRef.current?.organicOnly();
						rightCanvasRef.current?.organicOnly();
						break;
					case "S":
						leftCanvasRef.current?.organicStrip();
						rightCanvasRef.current?.organicStrip();
						break;
					case "R":
						leftCanvasRef.current?.restoreOriginal();
						rightCanvasRef.current?.restoreOriginal();
						break;
					case "D":
						leftCanvasRef.current?.hi();
						rightCanvasRef.current?.hi();
						break;
					case " ":
						leftCanvasRef.current?.togglePause();
						rightCanvasRef.current?.togglePause();
						break;
					case "ARROWLEFT":
						leftCanvasRef.current?.move?.(-10, 0);
						rightCanvasRef.current?.move?.(-10, 0);
						break;
					case "ARROWRIGHT":
						leftCanvasRef.current?.move?.(10, 0);
						rightCanvasRef.current?.move?.(10, 0);
						break;
					case "ARROWUP":
						leftCanvasRef.current?.move?.(0, -10);
						rightCanvasRef.current?.move?.(0, -10);
						break;
					case "ARROWDOWN":
						leftCanvasRef.current?.move?.(0, 10);
						rightCanvasRef.current?.move?.(0, 10);
						break;
					case "+":
					case "=":
						leftCanvasRef.current?.zoom?.(1.1);
						rightCanvasRef.current?.zoom?.(1.1);
						break;
					case "-":
						leftCanvasRef.current?.zoom?.(0.9);
						rightCanvasRef.current?.zoom?.(0.9);
						break;
					default:
						break;
				}
			} catch (err) {
				console.error("Key handler error:", err);
			}
		};

		window.addEventListener("keydown", keyHandler);

		// timer (countdown)


		// fetch initial data
		fetchCategory();
		fetchImages();
		fetchUser();

		// cleanup on unmount
		return () => {
			window.removeEventListener("keydown", keyHandler);
			clearInterval(timer);

			// remove click handlers if any
			if (leftCanvasRef.current?.__leftClick) {
				leftCanvasRef.current.canvas.removeEventListener("click", leftCanvasRef.current.__leftClick);
				delete leftCanvasRef.current.__leftClick;
			}
			if (rightCanvasRef.current?.__rightClick) {
				rightCanvasRef.current.canvas.removeEventListener("click", rightCanvasRef.current.__rightClick);
				delete rightCanvasRef.current.__rightClick;
			}

			// safe pause
			try {
				if (leftCanvasRef.current?.togglePause) leftCanvasRef.current.togglePause();
				if (rightCanvasRef.current?.togglePause) rightCanvasRef.current.togglePause();
			} catch (err) {
				// ignore
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // run once

	const formatTime = (seconds) => {
		const m = Math.floor(seconds / 60).toString().padStart(2, "0");
		const s = (seconds % 60).toString().padStart(2, "0");
		return `${m}:${s}`;
	};

	// ------------------- ImageList Hook -------------------
	useEffect(() => {
		if (!imageList.length) return;
		if (imageIndex >= imageList.length) return;

		const currentImage = imageList[imageIndex];
		if (!currentImage) return;

		const topImg = `${API_URL}/uploads/${currentImage.topImage}`;
		const sideImg = `${API_URL}/uploads/${currentImage.sideImage}`;

		// draw images and animate
		leftCanvasRef.current?.drawImageFromURL(topImg).then(() => {
			leftCanvasRef.current?.animateLeftToRight();
		});
		rightCanvasRef.current?.drawImageFromURL(sideImg).then(() => {
			rightCanvasRef.current?.animateLeftToRight();
		});

		// remove previous click handlers (if any)
		if (leftCanvasRef.current?.__leftClick) {
			leftCanvasRef.current.canvas.removeEventListener("click", leftCanvasRef.current.__leftClick);
			delete leftCanvasRef.current.__leftClick;
		}
		if (rightCanvasRef.current?.__rightClick) {
			rightCanvasRef.current.canvas.removeEventListener("click", rightCanvasRef.current.__rightClick);
			delete rightCanvasRef.current.__rightClick;
		}

		// create click handlers bound to currentImage
		const leftClick = (e) => {
			handleCanvasClick(leftCanvasRef.current, e, currentImage, "top");
		};
		const rightClick = (e) => {
			handleCanvasClick(rightCanvasRef.current, e, currentImage, "side");
		};

		// store for later removal
		leftCanvasRef.current.__leftClick = leftClick;
		rightCanvasRef.current.__rightClick = rightClick;

		leftCanvasRef.current.canvas.addEventListener("click", leftClick);
		rightCanvasRef.current.canvas.addEventListener("click", rightClick);

		// cleanup for this effect
		return () => {
			if (leftCanvasRef.current?.__leftClick) {
				leftCanvasRef.current.canvas.removeEventListener("click", leftCanvasRef.current.__leftClick);
			}
			if (rightCanvasRef.current?.__rightClick) {
				rightCanvasRef.current.canvas.removeEventListener("click", rightCanvasRef.current.__rightClick);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [imageList, imageIndex]);

	// click handler function (shared)
	const handleCanvasClick = (canvasRef, e, imageData, type) => {
		if (!canvasRef || !canvasRef.canvas) return;
		const rect = canvasRef.canvas.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const clickY = e.clientY - rect.top;

		const imageX = clickX - canvasRef.lastDraw.x;
		const imageY = clickY - canvasRef.lastDraw.y;
		setClicked(true);

		const posKey = type === "top" ? "topItemPos" : "sideItemPos";
		let itemPos = null;
		try {
			if (imageData[posKey]) {
				itemPos = JSON.parse(imageData[posKey]);
			}
		} catch (err) {
			console.error("Invalid JSON:", err);
		}

		canvasRef.setIcon(clickX, clickY);

		if (!itemPos) {
			setLastClickInside(false);
			return;
		}

		const inside =
			imageX >= itemPos.x &&
			imageX <= itemPos.x + itemPos.width &&
			imageY >= itemPos.y &&
			imageY <= itemPos.y + itemPos.height;

		setLastClickInside(inside);

		if (inside) {
			console.log(`✅ Inside ${type} item`);
		} else {
			console.log(`❌ Outside ${type} item`);
		}
	};

	// ------------------- Render -------------------
	return (
		<div className="flex flex-col h-screen w-screen bg-black overflow-hidden">
			{/* Row Top */}
			<div className="flex-1 flex bg-black" id="top-pane">
				<div className="flex-1 m-1 flex items-center justify-center" id="canvasLeft"></div>
				<div className="flex-1 m-1 flex items-center justify-center" id="canvasRight"></div>

				{/* Right Column */}
				<div className="flex w-[200px] h-[980px] bg-white mt-2 p-5 rounded-2xl border border-red-400 flex flex-col items-stretch justify-start gap-4">
					<button
						onClick={() => setShowSelect((prev) => !prev)}
						className="p-4 border rounded-2xl w-full bg-red-600 text-white text-2xl font-bold"
					>
						Answer
					</button>

					{showSelect && (
						<select
							className="w-full focus:outline-none focus:ring-0 p-2 mt-2 text-center overflow-hidden"
							size="6"
							value={selectedAnswer}
							onChange={(e) => setSelectedAnswer(e.target.value)}
						>
							<option value="" disabled>
								-- Select Category --
							</option>
							{category.map((cat) => (
								<option
									key={cat.id}
									value={cat.id}
									className="whitespace-normal break-words p-2 border rounded-md mt-2 shadow hover:bg-red-200"
								>
									{cat.category}
								</option>
							))}
						</select>
					)}

					{selectedAnswer && (
						<button
							onClick={checkAnswer}
							disabled={isFinished}
							className={`p-4 border rounded-2xl w-full text-2xl font-bold shadow ${isFinished ? "bg-gray-500 cursor-not-allowed" : "bg-yellow-600 text-white hover:bg-blue-200"
								}`}
						>
							Confirm
						</button>
					)}
				</div>
			</div>

			{/* Row Bottom */}
			<div
				className="h-[80px] border-t p-2 gap-2 text-white border-white m-1 rounded-t-2xl bg-gradient-to-t from-black to-gray-800 flex items-center justify-center"
				id="bottom-pane"
			>
				<div className="flex gap-3 w-4/9 p-3 justify-between">
					<button className="p-2 w-1/4 border rounded-full ">P1</button>
					<button className="p-2 w-1/4 border rounded-full ">P2</button>
					<button className="p-2 w-1/4 border rounded-full ">P3</button>
					<button className="p-2 w-1/4 border rounded-full ">Reset</button>
				</div>

				<div className="w-1/7 border rounded-2xl p-3 text-center">{formatTime(timeLeft)}</div>

				<div className="w-4/9 rounded-2xl p-2">
					{user ? (
						<div className="grid grid-cols-2 gap-4">
							{/* Left Column → User Info */}
							<div>
								<div>
									{user.namePrefix?.prefix} {user.fname} {user.lname}
								</div>
								<div>รหัส: {user.emid}</div>
								<div>{user.department?.name}</div>
							</div>

							{/* Right Column → Stats */}
							<div className="border-l border-gray-500 pl-4">
								<div>
									Score: <span className="font-bold">{score}</span>							<span>Index {imageIndex + 1} / {imageList.length}</span>	</div>
								<div>
									Hit Rate (HRS): <span className="font-bold text-green-400">{hrs}%</span>
								</div>
								<div>
									False Alarm Rate (FAR): <span className="font-bold text-red-400">{far}%</span>
								</div>
							</div>
						</div>
					) : (
						<div>Loading user...</div>
					)}
				</div>
			</div>
		</div>
	);
}
