'use client';

import { useState, useTransition } from 'react';
import type { Product } from '@/types/domain';
import { updateProductDetails, updateSizeInventory } from '@/app/actions/admin';

interface ProductEditorProps {
  product: Product;
  onClose: () => void;
}

export default function ProductEditor({ product, onClose }: ProductEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    nameEn: product.name.en,
    nameAr: product.name.ar,
    descriptionEn: product.description.en,
    descriptionAr: product.description.ar,
    price: product.price,
    category: product.category,
  });

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateProductDetails(product.id, formData);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        onClick={onClose}
      />
      
      {/* Slide-over Panel */}
      <div className="relative w-full max-w-xl bg-[#0a0a0a] border-s-4 border-white h-full flex flex-col shadow-2xl text-white">
        <div className="p-8 border-b-2 border-white/20 flex justify-between items-center bg-black">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">Edit Product</h2>
            <p className="text-[10px] font-mono opacity-40 uppercase">{product.slug}</p>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 border-2 border-white flex items-center justify-center font-black hover:bg-white hover:text-black transition-all"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveDetails} className="flex-1 overflow-auto p-8 space-y-8">
          {/* Identity Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest border-b border-white/20 pb-2 text-white/50">Identity</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase font-bold opacity-40">Name (EN)</label>
                <input 
                  type="text" 
                  className="w-full bg-black border-2 border-white/20 p-2 font-mono text-sm uppercase focus:border-white focus:outline-none transition-colors"
                  value={formData.nameEn}
                  onChange={e => setFormData({...formData, nameEn: e.target.value})}
                />
              </div>
              <div className="space-y-1 text-right">
                <label className="text-[10px] font-mono uppercase font-bold opacity-40">الاسم (AR)</label>
                <input 
                  type="text" 
                  dir="rtl"
                  className="w-full bg-black border-2 border-white/20 p-2 font-sans text-sm focus:border-white focus:outline-none transition-colors"
                  value={formData.nameAr}
                  onChange={e => setFormData({...formData, nameAr: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase font-bold opacity-40">Description (EN)</label>
              <textarea 
                rows={3}
                className="w-full bg-black border-2 border-white/20 p-2 font-mono text-xs uppercase focus:border-white focus:outline-none transition-colors"
                value={formData.descriptionEn}
                onChange={e => setFormData({...formData, descriptionEn: e.target.value})}
              />
            </div>
          </div>

          {/* Logistics Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest border-b border-white/20 pb-2 text-white/50">Logistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase font-bold opacity-40">Price (SAR)</label>
                <input 
                  type="number" 
                  className="w-full bg-black border-2 border-white/20 p-2 font-mono text-sm focus:border-white focus:outline-none transition-colors"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase font-bold opacity-40">Category</label>
                <select 
                  className="w-full bg-black border-2 border-white/20 p-2 font-mono text-sm uppercase focus:border-white focus:outline-none transition-colors appearance-none"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as 'tops' | 'bottoms'})}
                >
                  <option value="tops">Tops</option>
                  <option value="bottoms">Bottoms</option>
                </select>
              </div>
            </div>
          </div>

          {/* Size Matrix */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest border-b border-white/20 pb-2 text-white/50">Size Matrix</h3>
            <div className="space-y-3">
              {product.sizes.map((size) => (
                <div 
                  key={size.id}
                  className="flex items-center gap-4 bg-black border-2 border-white/10 p-3 hover:border-white/30 transition-colors"
                >
                  <div className="w-12 font-mono font-black text-lg">{size.label}</div>
                  
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => startTransition(() => updateSizeInventory(size.id, { inStock: !size.inStock }))}
                    className={`
                      px-3 py-1 text-[10px] font-mono font-black uppercase border-2 transition-all
                      ${size.inStock ? 'border-white bg-white text-black' : 'border-white/20 text-white/20 hover:border-white hover:text-white'}
                    `}
                  >
                    {size.inStock ? 'In Stock' : 'Sold Out'}
                  </button>

                  <div className="flex-1" />

                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-mono uppercase opacity-40">Stock:</label>
                    <input 
                      type="number"
                      disabled={isPending}
                      className="w-16 bg-black border-2 border-white/20 p-1 font-mono text-sm focus:border-white focus:outline-none transition-colors"
                      defaultValue={size.stock}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val !== size.stock) {
                          startTransition(() => updateSizeInventory(size.id, { stock: val }));
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="p-8 border-t-2 border-white/20 bg-black">
          <button 
            onClick={handleSaveDetails}
            disabled={isPending}
            className="w-full bg-white text-black p-4 font-black uppercase tracking-widest hover:bg-black hover:text-white border-2 border-white transition-all disabled:opacity-50"
          >
            {isPending ? 'Syncing...' : 'Update System Registry'}
          </button>
        </div>
      </div>
    </div>
  );
}
