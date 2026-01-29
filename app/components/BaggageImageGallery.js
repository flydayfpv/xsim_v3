'use client'

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  FolderOpen, MapPin, Database, Loader2, 
  BarChart3, X, Search, Trash2, AlertTriangle
} from "lucide-react";

function GalleryContent() {
  const [data, setData] = useState({ areaName: "", categories: [] });
  const [selectedCat, setSelectedCat] = useState(null);
  const [baggageList, setBaggageList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  
  const searchParams = useSearchParams();
  const areaID = searchParams.get('areaID'); 
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3015";

  const getImageUrl = (path) => {
    if (!path) return "/api/placeholder/400/300";
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_URL}${cleanPath}`;
  };

  // --- DELETE HANDLER ---
  const handleDelete = async (e, bagID) => {
    e.stopPropagation(); // Prevents opening the preview modal
    if (!window.confirm("Are you sure you want to delete this asset?")) return;

    try {
      const res = await fetch(`${API_URL}/baggage/${bagID}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setBaggageList(prev => prev.filter(item => item.id !== bagID));
        // Update local category count
        setData(prev => ({
          ...prev,
          categories: prev.categories.map(c => 
            c.id === selectedCat.id ? { ...c, baggageCount: c.baggageCount - 1 } : c
          )
        }));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserRole(user.roleID);
      } catch (e) { console.error("Auth parse error", e); }
    }

    if (!areaID) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/itemCategory/getCategoryCountByArea?areaID=${areaID}`);
        const result = await res.json();
        setData(result);
        const firstWithData = result.categories.find(c => c.baggageCount > 0);
        if (firstWithData) setSelectedCat(firstWithData);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [areaID, API_URL]);

  useEffect(() => {
    if (!selectedCat || !areaID) return;
    const fetchBaggages = async () => {
      setLoadingImages(true);
      try {
        const res = await fetch(`${API_URL}/baggage/filter?areaID=${areaID}&itemCategoryID=${selectedCat.id}`);
        const result = await res.json();
        setBaggageList(result);
      } catch (err) { console.error(err); } finally { setLoadingImages(false); }
    };
    fetchBaggages();
  }, [selectedCat, areaID, API_URL]);

  if (loading) return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-[#020202] text-white overflow-hidden font-sans">
      
      {/* 📁 Sidebar */}
      <aside className="w-87.5 bg-white/1 border-r border-white/5 backdrop-blur-3xl p-8 flex flex-col">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                <Database size={20} />
             </div>
             <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white">Gallery</h2>
          </div>
          <div className="flex items-center gap-2 mt-2 px-1">
            <MapPin size={12} className="text-red-500 animate-pulse" />
            <span className="text-2xl text-gray-300 font-bold uppercase tracking-[0.2em] truncate">
                {data.areaName}
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          {data.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => cat.baggageCount > 0 && setSelectedCat(cat)}
              className={`w-full group flex items-center justify-between p-5 rounded-3xl border transition-all duration-500 ${
                selectedCat?.id === cat.id 
                ? 'bg-red-600/10 border-red-600/50 shadow-[0_0_20px_rgba(220,38,38,0.1)]' 
                : 'bg-white/2 border-white/5 hover:border-white/20'
              } ${cat.baggageCount === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-4">
                <FolderOpen size={20} className={selectedCat?.id === cat.id ? 'text-red-500' : 'text-gray-500'} />
                <span className={`font-bold text-sm ${selectedCat?.id === cat.id ? 'text-white' : 'text-gray-300'}`}>{cat.name}</span>
              </div>
              {userRole === 1 && (
                <div className={`px-3 py-1 rounded-lg font-mono font-bold text-lg ${
                  selectedCat?.id === cat.id ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-200 border border-white/5'
                }`}>
                  {cat.baggageCount.toString().padStart(3, '0')}
                </div>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* 🖼️ Main Content Area */}
      <main className="flex-1 p-12 overflow-y-auto relative bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-red-900/5 via-transparent to-transparent">
        {selectedCat ? (
          <div className="animate-in fade-in duration-500">
            <div className="mb-10">
                <h3 className="text-6xl font-black tracking-tight uppercase mb-2 text-white">{selectedCat.name}</h3>
                {userRole === 1 && (
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                     <BarChart3 size={14} className="text-red-600" />
                     {selectedCat.baggageCount} Assets Found
                  </div>
                )}
            </div>

            {loadingImages ? (
              <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 text-red-600 animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {baggageList.map((bag) => (
                     <div key={bag.id} onClick={() => setPreviewItem(bag)} className="group relative bg-white/2 border border-white/5 rounded-[2.5rem] p-6 cursor-pointer hover:bg-white/4 hover:border-red-600/40 transition-all duration-500">
                        
                        {/* 🗑️ DELETE BUTTON (Role 1 Only) */}
                        {userRole === 1 && (
                          <button 
                            onClick={(e) => handleDelete(e, bag.id)}
                            className="absolute top-8 right-8 z-10 p-3 bg-black/50 backdrop-blur-md text-gray-400 hover:text-white hover:bg-red-600 border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}

                        <div className="aspect-4/3 bg-black/40 rounded-3xl mb-5 overflow-hidden relative">
                          <img src={getImageUrl(bag.top)} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" alt={bag.code} />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <div className="bg-red-600 p-4 rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                                <Search size={24} className="text-white" />
                             </div>
                          </div>
                        </div>
                        <div className="px-2">
                          <p className="text-[10px] text-red-500 font-black tracking-widest uppercase mb-1">Archive ID</p>
                          <h4 className="text-lg font-bold text-white truncate uppercase tracking-tighter">{bag.code}</h4>
                        </div>
                     </div>
                   ))}
                </div>
            )}
          </div>
        ) : <div className="h-full flex items-center justify-center opacity-10 font-black text-4xl uppercase tracking-[0.5em] text-white">Select Category</div>}
      </main>

      {/* Modal & Lightbox logic remains exactly as before... */}
      {previewItem && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-8 backdrop-blur-3xl bg-black/90 animate-in fade-in duration-300">
          <div className="relative w-full max-w-7xl bg-[#080808] border border-white/10 rounded-[3rem] p-12 overflow-y-auto max-h-[95vh]">
            <button onClick={() => setPreviewItem(null)} className="absolute top-10 right-10 p-3 bg-white/5 hover:bg-red-600 rounded-full transition-all text-white"><X size={24} /></button>
            <div className="mb-12">
              <h2 className="text-4xl font-black tracking-tighter uppercase text-white">Inspection Case: <span className="text-red-600">{previewItem.code}</span></h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Top X-Ray', src: previewItem.top },
                { label: 'Side X-Ray', src: previewItem.side },
                { label: 'Item Raw', src: previewItem.item?.top },
                { label: 'Real Reference', src: previewItem.item?.realImage }
              ].map((view, idx) => (
                <div key={idx} className="group/item">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-3 ml-2">{view.label}</span>
                  <div 
                    onClick={() => view.src && setSelectedImage({ src: view.src, label: view.label })}
                    className={`aspect-square bg-black rounded-[2.5rem] border border-white/5 flex items-center justify-center p-6 ${view.src ? 'cursor-zoom-in hover:border-red-600/50' : 'opacity-20'} transition-all`}
                  >
                    {view.src ? <img src={getImageUrl(view.src)} className="w-full h-full object-contain" alt={view.label} /> : "N/A"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-200 bg-black/95 flex flex-col items-center justify-center p-4 animate-in zoom-in duration-200" onClick={() => setSelectedImage(null)}>
           <button className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors"><X size={40} /></button>
           <div className="max-w-[90vw] max-h-[80vh] flex items-center justify-center">
              <img src={getImageUrl(selectedImage.src)} className="max-w-full max-h-full object-contain shadow-[0_0_50px_rgba(220,38,38,0.2)]" alt="Fullscreen" />
           </div>
           <p className="mt-8 text-white font-black uppercase tracking-[0.5em] text-xl">{selectedImage.label}</p>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="bg-black h-screen w-screen" />}>
      <GalleryContent />
    </Suspense>
  );
}