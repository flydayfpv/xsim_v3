'use client';
import { useState, useEffect } from 'react';

export default function ItemRegistration() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    
    // State for categories and items
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        itemCategoryId: '',
        description: '' // Field for Sequelize TEXT data
    });
    
    // State for file uploads and previews
    const [files, setFiles] = useState({ top: null, side: null, realImage: null });
    const [previews, setPreviews] = useState({ top: '', side: '', realImage: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Categories
    useEffect(() => {
        async function loadCategories() {
            try {
                const res = await fetch(`${API_URL}/itemCategory/`);
                const data = await res.json();
                setCategories(data);
            } catch (err) {
                console.error("Failed to load categories:", err);
            }
        }
        loadCategories();
    }, [API_URL]);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [type]: file }));
            setPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const data = new FormData();
        data.append('name', formData.name);
        data.append('itemCategoryId', formData.itemCategoryId);
        data.append('description', formData.description);
        data.append('top', files.top);
        data.append('side', files.side);
        data.append('realImage', files.realImage);

        try {
            const res = await fetch(`${API_URL}/itemImage`, {
                method: 'POST',
                body: data,
            });

            if (res.ok) {
                alert('New item registered successfully!');
                // Reset form
                setFormData({ name: '', itemCategoryId: '', description: '' });
                setFiles({ top: null, side: null, realImage: null });
                setPreviews({ top: '', side: '', realImage: '' });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen bg-white dark:bg-gray-950">
            <header className="mb-8 border-b-2 border-orange-500 pb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">
                    Item Registration <span className="text-orange-600">v3</span>
                </h1>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Name and Category Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div>
                        <label className="block text-sm font-bold mb-2 uppercase text-gray-500">Item Name</label>
                        <input
                            type="text"
                            required
                            className="w-full p-3 border rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 outline-none"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Lithium Battery Pack"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 uppercase text-gray-500">Hazard Category</label>
                        <select
                            required
                            className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 outline-none"
                            value={formData.itemCategoryId}
                            onChange={(e) => setFormData({ ...formData, itemCategoryId: e.target.value })}
                        >
                            <option value="">-- Choose Category --</option>
                            {/* Skipping 1st Index using .slice(1) */}
                            {categories.slice(1).map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 2. Image Registration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['top', 'side', 'realImage'].map((type) => (
                        <div key={type} className="flex flex-col items-center">
                            <label className="block text-xs font-bold mb-2 uppercase text-gray-400">
                                {type === 'realImage' ? 'Real Reference' : `${type} View (X-Ray)`}
                            </label>
                            
                            <div className={`w-full aspect-square relative border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden transition-all hover:border-orange-500
                                ${previews[type] ? 'border-solid border-orange-500' : 'border-gray-300'} 
                                ${type === 'realImage' ? 'bg-gray-100' : 'bg-black'}`}>
                                
                                {previews[type] ? (
                                    <img src={previews[type]} alt="Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="text-center p-4">
                                        <div className="text-2xl mb-1">＋</div>
                                        <span className="text-xs text-gray-500">Click to Upload</span>
                                    </div>
                                )}
                                
                                <input
                                    type="file"
                                    accept="image/*"
                                    required
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => handleFileChange(e, type)}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Description Field */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <label className="block text-sm font-bold mb-2 uppercase text-gray-500">Threat Description & Notes</label>
                    <textarea
                        rows="4"
                        required
                        className="w-full p-3 border rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 outline-none"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detail why this item is dangerous and what to look for in the X-ray view..."
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-5 rounded-xl font-black text-xl tracking-widest transition-all shadow-xl
                        ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
                >
                    {isSubmitting ? 'PROCESSING...' : 'REGISTER ITEM'}
                </button>
            </form>
        </div>
    );
}