import React, { useState } from 'react';
import { ArrowLeft, Bell, Star, Minus, Plus, ShoppingBag } from 'lucide-react';
import { ViewState, Product } from '../types';

interface ProductDetailViewProps {
  product: Product;
  setView: (view: ViewState) => void;
}

const ProductDetailView: React.FC<ProductDetailViewProps> = ({ product, setView }) => {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="bg-gray-50 min-h-screen pb-24 relative">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex justify-between items-center bg-transparent relative z-10">
        <button onClick={() => setView(ViewState.HOME)} className="p-2 bg-white rounded-full shadow-sm text-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-semibold text-gray-800">Farm Details</span>
        <button className="p-2 bg-white rounded-full shadow-sm text-gray-800 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>

      {/* Main Image Area */}
      <div className="relative w-full h-[400px] -mt-20 flex items-center justify-center">
         {/* Background glow effect */}
         <div className="absolute w-64 h-64 bg-green-200/50 rounded-full blur-3xl top-20"></div>
         <img src={product.image} alt={product.name} className="w-64 h-64 object-cover rounded-full shadow-2xl relative z-0 border-4 border-white" />
         
         {/* Carousel Indicators Mockup */}
         <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1">
            <div className="w-6 h-1 bg-[#134e4a] rounded-full"></div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
         </div>

         {/* Thumbnails */}
         <div className="absolute bottom-4 left-6 right-6 flex justify-between bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-sm">
            {[1,2,3,4].map((i) => (
                <div key={i} className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100">
                    <img src={`https://picsum.photos/100/100?random=${i+10}`} className="w-full h-full object-cover" />
                </div>
            ))}
         </div>
      </div>

      {/* Details Sheet */}
      <div className="bg-white rounded-t-[2.5rem] px-6 py-8 -mt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-10 min-h-[500px]">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
        
        <div className="flex justify-between items-center mb-6">
            <div>
                <span className="text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded-md">Available in stock</span>
                <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold text-gray-800">{product.rating}</span>
                    <span className="text-sm text-gray-400">({product.reviews})</span>
                </div>
            </div>
            
            <div className="flex flex-col items-end">
                <span className="text-2xl font-bold text-gray-900">${product.price}<span className="text-sm text-gray-400 font-normal">/pcs</span></span>
                <div className="flex items-center gap-3 mt-1">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-7 h-7 rounded-full bg-[#134e4a] text-white flex items-center justify-center">
                        <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-gray-900 font-semibold w-4 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-7 h-7 rounded-full bg-[#134e4a] text-white flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>

        <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
                {product.description} <span className="text-[#134e4a] font-medium">Read More</span>
            </p>
        </div>

        <div className="mb-24">
            <h3 className="font-semibold text-gray-900 mb-3">Related Products</h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
                {[1,2,3,4].map(i => (
                    <img key={i} src={`https://picsum.photos/100/100?random=${i+50}`} className="w-16 h-16 rounded-xl object-cover" />
                ))}
            </div>
        </div>

        {/* Sticky Action Button */}
        <div className="fixed bottom-6 left-6 right-6">
            <button className="w-full bg-[#134e4a] text-white py-4 rounded-2xl font-semibold shadow-xl shadow-green-900/20 flex items-center justify-center gap-2 hover:bg-[#0f3f3b] transition-colors">
                <ShoppingBag className="w-5 h-5" />
                Add To Cart
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailView;
