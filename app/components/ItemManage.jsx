"use client";
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function ItemManager() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3015';
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const xSimSwal = Swal.mixin({
        customClass: {
            popup: 'rounded-[3rem] border-2 border-slate-700 bg-slate-950 text-slate-100 shadow-2xl p-12',
            title: 'text-4xl font-black italic uppercase tracking-tighter text-orange-500 mb-6',
            htmlContainer: 'text-xl text-slate-400 font-sans mb-8',
            confirmButton: 'bg-red-600 hover:bg-red-500 text-white font-black px-10 py-4 rounded-2xl uppercase transition-all text-xl mx-4',
            cancelButton: 'bg-slate-800 hover:bg-slate-700 text-slate-300 font-black px-10 py-4 rounded-2xl uppercase transition-all text-xl mx-4'
        },
        buttonsStyling: false
    });

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/itemImage/`); 
            const data = await res.json();
            setItems(data);
        } catch (err) {
            console.error("Failed to fetch registry:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        const result = await xSimSwal.fire({
            title: 'Confirm Purge',
            text: `Are you sure you want to delete [${name.toUpperCase()}]?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'DELETE NOW',
            cancelButtonText: 'CANCEL'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_URL}/itemImage/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    xSimSwal.fire('Deleted!', 'Item removed.', 'success');
                    fetchItems();
                }
            } catch (err) {
                xSimSwal.fire('Error', err.message, 'error');
            }
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-8">
            {/* BIG HEADER */}
            <header className="flex justify-between items-center mb-10 border-b-2 border-slate-800 pb-8">
                <div>
                    <h2 className="text-5xl font-black italic uppercase text-orange-500 tracking-tighter">
                        Registry <span className="text-white">DB</span>
                    </h2>
                    <p className="text-xl text-slate-500 font-mono mt-2 uppercase tracking-widest">
                        Detected Objects: <span className="text-emerald-500">{items.length}</span>
                    </p>
                </div>
                <button onClick={fetchItems} className="p-4 hover:bg-slate-800 rounded-2xl transition-all text-4xl">
                    🔄
                </button>
            </header>

            {loading ? (
                <div className="flex-1 flex items-center justify-center animate-pulse text-3xl font-black italic text-slate-700">
                    SCANNING DATABASE...
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 overflow-y-auto custom-scrollbar pr-4">
                    {items.map((item) => (
                        <div 
                            key={item.id} 
                            className="group flex items-center gap-8 bg-slate-900/40 border-2 border-slate-800 p-6 rounded-4xl hover:border-orange-500 transition-all hover:bg-slate-900 shadow-xl"
                        >
                            {/* ENLARGED THUMBNAILS (X2) */}
                            <div className="flex gap-3">
                                <div className="w-28 h-28 bg-black rounded-2xl border-2 border-slate-700 p-2 shrink-0 overflow-hidden shadow-inner">
                                    <img src={`${API_URL}/${item.top}`} className="w-full h-full object-contain" alt="top" />
                                </div>
                                <div className="w-28 h-28 bg-black rounded-2xl border-2 border-slate-700 p-2 shrink-0flow-hidden shadow-inner">
                                    <img src={`${API_URL}/${item.side}`} className="w-full h-full object-contain" alt="side" />
                                </div>
                            </div>

                            {/* TEXT CONTENT (X2 - X3) */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-3xl font-black uppercase text-white truncate tracking-tight">
                                    {item.name}
                                </h4>
                                <div className="flex flex-col gap-2 mt-3">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xl bg-orange-600/20 px-4 py-1 rounded-full text-orange-500 font-black border border-orange-500/30 uppercase">
                                            UID-{item.id}
                                        </span>
                                        <span className="text-2xl text-slate-400 font-medium truncate italic">
                                            {item.description || "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* BIG DELETE BUTTON */}
                            <button 
                                onClick={() => handleDelete(item.id, item.name)}
                                className="p-6 text-slate-600 hover:text-red-500 transition-all hover:scale-125 text-4xl"
                                title="Purge Object"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <div className="text-center py-40 border-4 border-dashed border-slate-800 rounded-[3rem]">
                            <p className="text-slate-700 text-2xl font-black uppercase italic">No Data In Registry</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}