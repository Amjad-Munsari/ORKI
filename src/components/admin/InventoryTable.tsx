'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import type { Product } from '@/types/domain';
import { toggleProductStock } from '@/app/actions/admin';
import ProductEditor from './ProductEditor';

interface InventoryTableProps {
  initialProducts: Product[];
}

export default function InventoryTable({ initialProducts }: InventoryTableProps) {
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredProducts = initialProducts.filter(p => 
    p.name.en.toLowerCase().includes(search.toLowerCase()) || 
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleStockToggle = async (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleProductStock(id, !currentStatus);
    });
  };

  return (
    <div className="space-y-6">
      {/* Table Header Controls */}
      <div className="flex justify-between items-end gap-4 border-b-2 border-white/20 pb-6">
        <div className="flex-1 max-w-md">
          <label htmlFor="search" className="block text-[10px] font-mono uppercase font-bold mb-1 opacity-50">
            Search Inventory
          </label>
          <input
            id="search"
            type="text"
            placeholder="FILTER BY NAME / SKU..."
            className="w-full bg-transparent border-2 border-white/40 p-3 font-mono text-sm uppercase placeholder:opacity-20 focus:outline-none focus:border-white focus:ring-0 transition-all text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase opacity-40 mb-1">Items Found</div>
          <div className="text-2xl font-black italic text-white">{filteredProducts.length}</div>
        </div>
      </div>

      {/* The Table */}
      <div className="border-2 border-white/20 overflow-hidden bg-white/5 gap-[1px] grid">
        <div className="grid grid-cols-[80px_1fr_120px_100px_100px_140px_100px] bg-[#0a0a0a] text-[10px] font-mono uppercase font-black tracking-widest p-4 text-white/50 border-b border-white/10">
          <div>IMG</div>
          <div>Product / ID</div>
          <div>Category</div>
          <div>Price</div>
          <div>Stock</div>
          <div>Status</div>
          <div className="text-right">Action</div>
        </div>

        {filteredProducts.map((product) => (
            <div 
              key={product.id}
              className="grid grid-cols-[80px_1fr_120px_100px_100px_140px_100px] items-center bg-black p-4 hover:bg-white/5 transition-colors group cursor-pointer border-b border-white/5"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="h-12 w-12 bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                {product.images?.[0] ? (
                  <Image 
                    src={product.images[0]} 
                    alt="" 
                    width={48}
                    height={48}
                    className="h-full w-full object-cover grayscale brightness-75"
                  />
                ) : (
                  <span className="text-[8px] opacity-20">NO IMG</span>
                )}
              </div>
              
              <div className="flex flex-col">
                <span className="font-bold uppercase tracking-tight text-white group-hover:text-white transition-colors">{product.name.en}</span>
                <span className="text-[10px] font-mono opacity-40 uppercase">{product.slug}</span>
              </div>
  
              <div className="text-xs font-mono uppercase opacity-60">
                {product.category}
              </div>
  
              <div className="text-sm font-bold text-white/90">
                {product.price} {product.currency}
              </div>
  
              <div className="text-xs font-mono font-bold text-white/70">
                {product.sizes.reduce((acc, s) => acc + s.stock, 0)}
              </div>
  
              <div className="flex">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStockToggle(product.id, product.inStock);
                  }}
                  disabled={isPending}
                  className={`
                    px-3 py-1 border-2 font-mono text-[9px] font-black uppercase transition-all
                    ${product.inStock 
                      ? 'border-white bg-transparent text-white hover:bg-white hover:text-black' 
                      : 'border-red-600 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white'
                    }
                    ${isPending ? 'opacity-50 cursor-wait' : ''}
                  `}
                >
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </button>
              </div>
  
              <div className="text-right">
                <button className="text-[10px] font-mono uppercase font-black underline underline-offset-4 opacity-40 hover:opacity-100 transition-opacity">
                  Details
                </button>
              </div>
            </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="bg-black p-12 text-center border-t border-white/5">
            <div className="text-4xl font-black uppercase opacity-10 italic text-white">No Results</div>
            <p className="font-mono text-xs opacity-40 mt-2 uppercase text-white">Adjust your filter parameters</p>
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductEditor 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </div>
  );
}
