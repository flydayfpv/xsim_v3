'use client';

export default function CategorySelect({ 
    categories, 
    value, 
    onChange, 
    excludeIds = [], // Array of IDs to hide, e.g., [1, 5]
    className = "" 
}) {
    // Filter out categories based on the excludeIds prop
    const filteredCategories = categories.filter(
        (cat) => !excludeIds.includes(cat.id) && !excludeIds.includes(cat.id.toString())
    );

    return (
        <div className={className}>
            <label className="block text-xl font-bold mb-2 uppercase text-gray-400 dark:text-gray-400">
                Item Category
            </label>
            <select
                required
                className="w-full p-3 border-2 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">-- Select Category --</option>
                {filteredCategories.length > 0 && (
                    <option value="all" className="font-bold text-red-500">
                        All Categories
                    </option>
                )}
                {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                        {cat.name}
                    </option>
                ))}
            </select>
            {filteredCategories.length === 0 && (
                <p className="text-xs text-red-500 mt-1">No categories available to display.</p>
            )}
        </div>
    );
}