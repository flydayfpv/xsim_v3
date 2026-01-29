'use client';
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const CorrectiveForm = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

    // 1. Initial State - Fixed: Removed duplicate areaId key
    const [formData, setFormData] = useState({
        userId: '',
        areaId: '',          
        itemCategory: '',
        correctiveTypeId: '',
        timeTarget: '',
        remark: ''
    });

    const [types, setTypes] = useState([]);
    const [searchEmid, setSearchEmid] = useState('');
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [itemCategorys, setItemCategorys] = useState([]);
    const [areas, setAreas] = useState([]);

    const swalTerminal = Swal.mixin({
        background: '#1e293b',
        color: '#f97316',
        confirmButtonColor: '#ea580c',
        cancelButtonColor: '#334155',
        heightAuto: false,
        customClass: {
            popup: 'border-2 border-orange-500 font-mono shadow-[0_0_20px_rgba(249,115,22,0.2)]',
            title: 'text-orange-500 uppercase tracking-widest',
            htmlContainer: 'text-slate-300 font-mono'
        }
    });

    // 3. Dynamic Filter Logic
    const filteredItems = itemCategorys.filter((item, index) => {
        const currentArea = String(formData.areaId);
        if (currentArea === '2') return index !== 4;
        if (currentArea === '3') return ![4, 5].includes(index);
        return true;
    });

    // 4. Reset logic with stable dependency array
    useEffect(() => {
        const currentArea = String(formData.areaId);
        if (!currentArea || itemCategorys.length === 0) return;

        const currentIndex = itemCategorys.findIndex(
            cat => String(cat.id) === String(formData.itemCategory)
        );
        
        const isArea2Invalid = currentArea === '2' && currentIndex === 4;
        const isArea3Invalid = currentArea === '3' && [4, 5].includes(currentIndex);

        if (isArea2Invalid || isArea3Invalid) {
            setFormData(prev => ({ ...prev, itemCategory: '' }));
        }
    }, [formData.areaId, formData.itemCategory, itemCategorys.length]);

    // 5. Load Initial Data
    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [itemRes, typeRes, areaRes] = await Promise.all([
                    fetch(`${API_URL}/itemCategory`),
                    fetch(`${API_URL}/corrective/correctiveType`),
                    fetch(`${API_URL}/area`)
                ]);
                const itemData = await itemRes.json();
                const typeData = await typeRes.json();
                const areaData = await areaRes.json();
                
                setItemCategorys(Array.isArray(itemData) ? itemData : []);
                setTypes(Array.isArray(typeData) ? typeData : []);
                setAreas(Array.isArray(areaData) ? areaData : []);
            } catch (err) { 
                console.error("Critical Sync Error:", err); 
            }
        };
        fetchDropdowns();
    }, [API_URL]);

    // 6. Identity Verification
    const handleUserSearch = async () => {
        if (!searchEmid) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/users/emid/${searchEmid}`);
            if (!response.ok) throw new Error('AUTH_FAILED');
            const data = await response.json();
            setUserData(data);
            setFormData(prev => ({ ...prev, userId: data.id }));
            swalTerminal.fire({ icon: 'success', title: 'ACCESS GRANTED', timer: 1000, showConfirmButton: false });
        } catch (err) {
            setUserData(null);
            swalTerminal.fire({ icon: 'error', title: 'UNAUTHORIZED', text: 'Operator ID mismatch.' });
        } finally { setLoading(false); }
    };

    // 7. Submit Protocol
    const handleSubmit = async (e) => {
        e.preventDefault();
        const confirm = await swalTerminal.fire({
            title: 'COMMIT DATA?',
            text: "Execute protocol logging for X-SIM v3?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'LOG_PROTOCOL',
            cancelButtonText: 'ABORT'
        });

        if (confirm.isConfirmed) {
            try {
                // FIXED: Explicitly mapping all fields to ensure areaId is sent
                const payload = {
                    userId: formData.userId,
                    areaId: formData.areaId,
                    itemCategoryId: formData.itemCategory, // Converting frontend 'itemCategory' to backend 'itemCategoryId'
                    correctiveTypeId: formData.correctiveTypeId,
                    timeTarget: formData.timeTarget,
                    remark: formData.remark
                };

                const res = await fetch(`${API_URL}/corrective`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) throw new Error('SYNC_FAILURE');

                swalTerminal.fire({ icon: 'success', title: 'LOGGED', text: 'Protocol synchronized.' });
                
                // Reset everything
                setFormData({ userId: '', areaId: '', itemCategory: '', correctiveTypeId: '', timeTarget: '', remark: '' });
                setSearchEmid('');
                setUserData(null);
            } catch (err) { 
                swalTerminal.fire({ icon: 'error', title: 'FAILURE', text: err.message }); 
            }
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a]/90 flex flex-col items-center justify-center p-4 font-mono">
            <div className="w-full p-6 m-6 bg-[#111111] border border-[#333333] rounded shadow-2xl overflow-hidden relative">
                
                <div className="bg-orange-600 px-4 py-2 flex justify-between items-center border-b border-orange-700">
                    <h2 className="text-black font-black text-xl tracking-tighter uppercase">Terminal System // Corrective Action v3</h2>
                    <span className="bg-black text-orange-500 text-[18px] px-2 py-0.5 rounded font-bold animate-pulse">SYSTEM_ACTIVE</span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4 space-y-4 border-r border-[#222222] pr-6">
                        <div className="bg-[#1a1a1a] p-4 border-t-2 border-orange-500 shadow-inner">
                            <label className="text-[18px] text-orange-500 font-bold uppercase mb-2 block">Operator Auth ID</label>
                            <input
                                type="text"
                                className="w-full bg-black border border-[#333333] p-2 text-cyan-400 outline-none focus:border-cyan-500 transition-all mb-3 text-xl"
                                placeholder="EMID_INPUT"
                                value={searchEmid}
                                onChange={(e) => setSearchEmid(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
                            />
                            <button onClick={handleUserSearch} className="w-full bg-orange-600 hover:bg-orange-500 text-black font-black py-2 text-xs transition-colors uppercase">Verify_Operator</button>
                        </div>
                        {userData && (
                            <div className="bg-cyan-950/20 border border-cyan-500/30 p-3 rounded text-[16px]">
                                <div className="text-cyan-500 font-bold mb-1 underline uppercase italic">Verified:</div>
                                <div className="text-white font-bold">{userData.name}</div>
                                <button onClick={() => { setUserData(null); setSearchEmid(''); setFormData({ ...formData, userId: '' }) }} className="mt-2 text-red-500 hover:text-red-400 text-[18px] uppercase font-bold">[ Terminate ]</button>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="md:col-span-8 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-[18px] text-slate-500 font-bold uppercase">Area</label>
                                <select required className="w-full bg-[#1a1a1a] border border-[#333333] p-2 text-white text-[16px] outline-none focus:border-orange-500" value={formData.areaId} onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}>
                                    <option value="">-- SELECT --</option>
                                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[18px] text-slate-500 font-bold uppercase">Mode</label>
                                <select required className="w-full bg-[#1a1a1a] border border-[#333333] p-2 text-white text-[16px] outline-none focus:border-orange-500" value={formData.correctiveTypeId} onChange={(e) => setFormData({ ...formData, correctiveTypeId: e.target.value })}>
                                    <option value="">-- SELECT --</option>
                                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[18px] text-slate-500 font-bold uppercase">Item</label>
                                <select required className="w-full bg-[#1a1a1a] border border-[#333333] p-2 text-white text-[16px] outline-none focus:border-orange-500" value={formData.itemCategory} onChange={(e) => setFormData({ ...formData, itemCategory: e.target.value })}>
                                    <option value="">-- SELECT --</option>
                                    <option value="77">  ALL </option>
                                    {filteredItems.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[18px] text-slate-500 font-bold uppercase block">Time_Target (Sec)</label>
                            <input type="number" required className="w-full bg-[#1a1a1a] border border-[#333333] p-2 text-orange-500 font-bold outline-none focus:border-orange-500" value={formData.timeTarget} onChange={(e) => setFormData({ ...formData, timeTarget: e.target.value })} />
                        </div>

                        <div>
                            <label className="text-[18px] text-slate-500 font-bold uppercase block">Protocol_Remark</label>
                            <textarea className="w-full bg-[#1a1a1a] border border-[#333333] p-2 text-white text-xl outline-none focus:border-orange-500 resize-none" rows="3" value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
                        </div>

                        <button 
                            type="submit" 
                            disabled={!formData.userId}
                            className={`w-full py-4 text-xl font-black tracking-widest uppercase transition-all shadow-lg ${formData.userId
                                    ? 'bg-orange-600 hover:bg-orange-500 text-black border-b-4 border-orange-800 active:border-0 active:translate-y-1'
                                    : 'bg-[#222222] text-slate-600 border-b-4 border-black cursor-not-allowed grayscale'
                                }`}
                        >
                            {formData.userId ? 'Update Protocol' : 'Locked: Operator Auth Required'}
                        </button>
                    </form>
                </div>

                <div className="bg-[#1a1a1a] p-3 text-center border-t border-[#222222]">
                    <p className="text-[9px] text-slate-700 font-bold tracking-[0.5em] uppercase italic">System Maintenance Module // X-Sim Version 3.0.12</p>
                </div>
            </div>
        </div>
    );
};

export default CorrectiveForm;