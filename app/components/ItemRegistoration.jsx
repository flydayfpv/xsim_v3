'use client';
import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';

export default function ItemRegistration() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3015';
    
    const [activeTab, setActiveTab] = useState('top');
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({ name: '', itemCategoryId: '', description: '' });
    const [files, setFiles] = useState({ top: null, side: null, realImage: null });
    const [previews, setPreviews] = useState({ top: '', side: '', realImage: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // X-Sim Custom Swal Helper
    const xSimSwal = Swal.mixin({
        customClass: {
            popup: 'rounded-[2rem] border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl',
            title: 'text-orange-500 font-black italic uppercase tracking-tighter',
            htmlContainer: 'text-slate-400 font-sans',
            confirmButton: 'bg-orange-600 hover:bg-orange-500 text-white font-black px-8 py-3 rounded-xl uppercase transition-all outline-none border-0'
        },
        buttonsStyling: false,
        background: '#020617', // slate-950
        color: '#f1f5f9'
    });

    const processFile = useCallback((file, type) => {
        if (file && file.type.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(file);
            setFiles(prev => ({ ...prev, [type]: file }));
            setPreviews(prev => ({ ...prev, [type]: objectUrl }));
        }
    }, []);

    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    processFile(blob, activeTab);
                    break;
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [activeTab, processFile]);

    useEffect(() => {
        async function loadCategories() {
            try {
                const res = await fetch(`${API_URL}/itemCategory/`);
                const data = await res.json();
                setCategories(data);
            } catch (err) { console.error(err); }
        }
        loadCategories();
    }, [API_URL]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!files.top || !files.side || !files.realImage) {
            xSimSwal.fire({
                icon: 'warning',
                title: 'Data Incomplete',
                text: 'All visual feeds (Top, Side, Real) are required for registry sync.'
            });
            return;
        }

        setIsSubmitting(true);
        xSimSwal.fire({
            title: 'Synchronizing...',
            text: 'Uploading visual data to X-SIM Registry',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        const data = new FormData();
        data.append('name', formData.name);
        data.append('itemCategoryId', formData.itemCategoryId);
        data.append('description', formData.description);
        data.append('top', files.top);
        data.append('side', files.side);
        data.append('realImage', files.realImage);

        try {
            const res = await fetch(`${API_URL}/itemImage`, { method: 'POST', body: data });
            if (res.ok) {
                xSimSwal.fire({
                    icon: 'success',
                    title: 'Registry Updated',
                    text: 'Object successfully committed to the secure database.',
                    timer: 2500
                });
                setFormData({ name: '', itemCategoryId: '', description: '' });
                setFiles({ top: null, side: null, realImage: null });
                setPreviews({ top: '', side: '', realImage: '' });
            } else {
                throw new Error("Registry link failure.");
            }
        } catch (err) {
            xSimSwal.fire({ icon: 'error', title: 'Upload Failed', text: err.message });
        } finally { setIsSubmitting(false); }
    };

    return (
        <div className="p-4 max-w-5xl mx-auto bg-slate-950 text-slate-100 font-sans select-none">
            <header className="mb-8 border-b border-slate-800 pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                        Object <span className="text-orange-500">Registry</span>
                    </h1>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em]">X-Sim System Management v3.2</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-emerald-500 animate-pulse">● SYSTEM READY</span>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-xl">
                    <div>
                        <label className="block text-[10px] font-bold mb-2 uppercase tracking-widest text-slate-500">Object Name</label>
                        <input
                            type="text" required
                            className="w-full bg-black border-2 border-slate-800 p-3 rounded-xl text-orange-500 font-mono focus:border-orange-500 outline-none transition-all shadow-inner"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="INPUT_ID..."
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold mb-2 uppercase tracking-widest text-slate-500">Hazard Classification</label>
                        <select
                            required
                            className="w-full bg-black border-2 border-slate-800 p-3 rounded-xl text-white font-bold focus:border-orange-500 outline-none cursor-pointer"
                            value={formData.itemCategoryId}
                            onChange={(e) => setFormData({ ...formData, itemCategoryId: e.target.value })}
                        >
                            <option value="" disabled className="text-slate-700">-- SELECT CLASS --</option>
                            {categories.slice(1).map((cat) => (
                                <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.name.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['top', 'side', 'realImage'].map((type) => (
                        <div key={type} className="flex flex-col" onClick={() => setActiveTab(type)}>
                            <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest text-center transition-all ${activeTab === type ? 'text-orange-500' : 'text-slate-500'}`}>
                                {type === 'realImage' ? 'Optical Ref' : `${type} Imaging`} {activeTab === type && '[*]'}
                            </label>
                            <div className={`w-full aspect-square relative border-2 rounded-2xl flex items-center justify-center overflow-hidden transition-all group cursor-pointer
                                ${activeTab === type ? 'border-orange-500 ring-4 ring-orange-500/10' : 'border-slate-800 border-dashed bg-black'}`}>
                                {previews[type] ? (
                                    <img src={previews[type]} alt="p" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <div className="text-center group-hover:scale-110 transition-transform">
                                        <div className="text-slate-800 text-3xl mb-1">⎙</div>
                                        <span className="text-[8px] font-black text-slate-700 uppercase">Click/Paste</span>
                                    </div>
                                )}
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => processFile(e.target.files[0], type)} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <label className="block text-[10px] font-bold mb-2 uppercase tracking-widest text-slate-500">Forensic Notes</label>
                    <textarea
                        rows="3" required
                        className="w-full bg-black border-2 border-slate-800 p-4 rounded-xl text-slate-300 font-medium focus:border-orange-500 outline-none shadow-inner resize-none"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detail physical characteristics..."
                    />
                </div>

                <button
                    type="submit" disabled={isSubmitting}
                    className={`w-full py-5 rounded-2xl font-black text-xl tracking-[0.3em] transition-all shadow-2xl uppercase italic
                        ${isSubmitting ? 'bg-slate-800 text-slate-600' : 'bg-orange-600 hover:bg-orange-500 text-white active:scale-95'}`}
                >
                    {isSubmitting ? 'Synchronizing...' : 'Commit to Registry ↗'}
                </button>
            </form>
        </div>
    );
}