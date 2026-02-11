'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; // สำคัญมาก: ต้องนำเข้า CSS ของมัน
import Swal from 'sweetalert2';

// --- Helper: ตัดภาพตามพิกเซลจริง ---
const getCroppedImg = async (image, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    });
};

export default function ItemRegistration() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3015';
    const imgRef = useRef(null);
    
    const [activeTab, setActiveTab] = useState('top');
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({ name: '', itemCategoryId: '', description: '' });
    const [files, setFiles] = useState({ top: null, side: null, realImage: null });
    const [previews, setPreviews] = useState({ top: '', side: '', realImage: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Crop States ---
    const [cropModal, setCropModal] = useState({ isOpen: false, src: '', type: '' });
    const [crop, setCrop] = useState(); // เก็บค่า % ของการ crop

    const xSimSwal = Swal.mixin({
        customClass: {
            popup: 'rounded-[2rem] border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl',
            title: 'text-orange-500 font-black italic uppercase tracking-tighter',
            confirmButton: 'bg-orange-600 hover:bg-orange-500 text-white font-black px-8 py-3 rounded-xl uppercase transition-all'
        },
        buttonsStyling: false,
    });

    const processFile = useCallback((file, type) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setCropModal({ isOpen: true, src: reader.result?.toString() || '', type });
            });
            reader.readAsDataURL(file);
        }
    }, []);

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        // ตั้งค่า Crop เริ่มต้นให้อยู่กลางภาพ 80%
        const initialCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 80 }, undefined, width, height),
            width,
            height
        );
        setCrop(initialCrop);
    };

    const handleSaveCrop = async () => {
        if (imgRef.current && crop.width && crop.height) {
            const blob = await getCroppedImg(imgRef.current, crop);
            const croppedUrl = URL.createObjectURL(blob);
            const file = new File([blob], `${cropModal.type}.png`, { type: 'image/png' });

            setFiles(prev => ({ ...prev, [cropModal.type]: file }));
            setPreviews(prev => ({ ...prev, [cropModal.type]: croppedUrl }));
            setCropModal({ isOpen: false, src: '', type: '' });
        }
    };

    // Paste handling
    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    processFile(items[i].getAsFile(), activeTab);
                    break;
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [activeTab, processFile]);

    useEffect(() => {
        fetch(`${API_URL}/itemCategory/`).then(res => res.json()).then(setCategories).catch(console.error);
    }, [API_URL]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!files.top || !files.side || !files.realImage) {
            xSimSwal.fire({ icon: 'warning', title: 'Data Incomplete', text: 'Please provide all images.' });
            return;
        }

        setIsSubmitting(true);
        Swal.fire({ title: 'Synchronizing...', didOpen: () => Swal.showLoading() });

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        data.append('top', files.top);
        data.append('side', files.side);
        data.append('realImage', files.realImage);

        try {
            const res = await fetch(`${API_URL}/itemImage`, { method: 'POST', body: data });
            if (res.ok) {
                xSimSwal.fire({ icon: 'success', title: 'Registry Updated' });
                setFormData({ name: '', itemCategoryId: '', description: '' });
                setFiles({ top: null, side: null, realImage: null });
                setPreviews({ top: '', side: '', realImage: '' });
            }
        } catch (err) { xSimSwal.fire({ icon: 'error', title: 'Error', text: err.message }); }
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="p-4 max-w-5xl mx-auto bg-slate-950 text-slate-100 font-sans select-none relative">
            
            {/* --- MODAL CROPPER (FIXED INTERACTION) --- */}
            {cropModal.isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-lg">
                    <div className="w-full max-w-4xl text-center mb-6">
                        <h2 className="text-orange-500 font-black italic uppercase text-2xl tracking-tighter">Advanced Calibration</h2>
                        <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em]">Drag corner handles to define object boundaries</p>
                    </div>
                    
                    {/* Container ของ Crop ต้องมีสีพื้นหลังที่ตัดกับรูปภาพ */}
                    <div className="relative max-w-full max-h-[70vh] overflow-auto bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xl custom-scrollbar">
                        <ReactCrop 
                            crop={crop} 
                            onChange={(c) => setCrop(c)}
                            className="max-w-full"
                        >
                            <img 
                                ref={imgRef}
                                src={cropModal.src} 
                                alt="Crop source" 
                                onLoad={onImageLoad}
                                className="max-w-full block" 
                                style={{ maxHeight: '60vh' }}
                            />
                        </ReactCrop>
                    </div>

                    <div className="mt-8 flex gap-4 w-full max-w-md">
                        <button 
                            type="button"
                            onClick={() => setCropModal({ isOpen: false, src: '', type: '' })}
                            className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold uppercase text-xs transition-all border border-slate-700"
                        >Discard</button>
                        <button 
                            type="button"
                            onClick={handleSaveCrop}
                            className="flex-[2] py-4 bg-orange-600 hover:bg-orange-500 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-900/20 transition-all active:scale-95"
                        >Confirm Crop ↗</button>
                    </div>
                </div>
            )}

            {/* --- HEADER --- */}
            <header className="mb-8 border-b border-slate-800 pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                        Object <span className="text-orange-500">Registry</span>
                    </h1>
                </div>
                <div className="text-[10px] font-black text-emerald-500 animate-pulse uppercase">● Ready</div>
            </header>

            {/* --- FORM --- */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Object Name</label>
                        <input
                            type="text" required
                            className="w-full bg-black border-2 border-slate-800 p-3 rounded-xl text-orange-500 font-mono focus:border-orange-500 outline-none transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="OBJECT_ID_001"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Classification</label>
                        <select
                            required
                            className="w-full bg-black border-2 border-slate-800 p-3 rounded-xl text-white font-bold focus:border-orange-500 outline-none cursor-pointer"
                            value={formData.itemCategoryId}
                            onChange={(e) => setFormData({ ...formData, itemCategoryId: e.target.value })}
                        >
                            <option value="" disabled>-- SELECT --</option>
                            {categories.slice(1).map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* --- PREVIEWS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['top', 'side', 'realImage'].map((type) => (
                        <div key={type} className="flex flex-col cursor-pointer" onClick={() => setActiveTab(type)}>
                            <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest text-center ${activeTab === type ? 'text-orange-500' : 'text-slate-500'}`}>
                                {type === 'realImage' ? 'Optical' : type.toUpperCase()}
                            </label>
                            <div className={`w-full aspect-[4/3] relative border-2 rounded-2xl flex items-center justify-center overflow-hidden transition-all group
                                ${activeTab === type ? 'border-orange-500 bg-orange-500/5' : 'border-slate-800 bg-black hover:border-slate-700'}`}>
                                
                                {previews[type] ? (
                                    <img src={previews[type]} alt="preview" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <div className="text-center group-hover:scale-110 transition-transform opacity-30">
                                        <div className="text-3xl mb-1">📷</div>
                                        <span className="text-[8px] font-black uppercase">Upload/Paste</span>
                                    </div>
                                )}
                                <input 
                                    type="file" accept="image/*" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    onChange={(e) => processFile(e.target.files[0], type)} 
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <label className="block text-[10px] font-bold mb-2 uppercase tracking-widest text-slate-500">Forensic Notes</label>
                    <textarea
                        rows="3" required
                        className="w-full bg-black border-2 border-slate-800 p-4 rounded-xl text-slate-300 outline-none focus:border-orange-500 transition-all resize-none"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Analyze physical properties..."
                    />
                </div>

                <button
                    type="submit" disabled={isSubmitting}
                    className={`w-full py-5 rounded-2xl font-black text-xl tracking-[0.2em] transition-all shadow-2xl uppercase italic
                        ${isSubmitting ? 'bg-slate-800 text-slate-600' : 'bg-orange-600 hover:bg-orange-500 text-white active:scale-95'}`}
                >
                    {isSubmitting ? 'Syncing...' : 'Commit to Registry ↗'}
                </button>
            </form>
        </div>
    );
}