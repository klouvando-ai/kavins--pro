
import React, { useState, useEffect } from 'react';
import { X, Scissors, ArrowRight, Check, AlertTriangle, Layers, Info } from 'lucide-react';
import { ProductionOrder, ProductionOrderItem, Fabric } from '../types';

interface CutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ProductionOrder | null;
  onConfirm: (updatedItems: ProductionOrderItem[], activeItems: ProductionOrderItem[]) => void;
  fabrics: Fabric[];
}

export const CutConfirmationModal: React.FC<CutConfirmationModalProps> = ({ isOpen, onClose, order, onConfirm, fabrics }) => {
  const [itemsData, setItemsData] = useState<ProductionOrderItem[]>([]);
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  useEffect(() => {
    if (order && isOpen) {
      const initialItems: ProductionOrderItem[] = JSON.parse(JSON.stringify(order.items));
      initialItems.forEach(item => {
        // FIX: Se os tamanhos estiverem zerados, preencher com a estimativa por tamanho do planejamento
        const totalInSizes = Object.values(item.sizes).reduce((acc: number, curr: number | undefined) => acc + (curr || 0), 0);
        if (totalInSizes === 0 && item.piecesPerSizeEst > 0) {
           item.sizes = { 
             P: item.piecesPerSizeEst, 
             M: item.piecesPerSizeEst, 
             G: item.piecesPerSizeEst, 
             GG: item.piecesPerSizeEst 
           };
           item.actualPieces = item.piecesPerSizeEst * 4;
        } else if (totalInSizes > 0) {
           item.actualPieces = totalInSizes;
        }
      });
      setItemsData(initialItems);
      setActiveItemIndex(0);
    }
  }, [order, isOpen]);

  if (!isOpen || !order || itemsData.length === 0) return null;

  const currentItem = itemsData[activeItemIndex];
  
  const fabricObj = fabrics.find(f => f.name === currentItem.fabricName && f.color === currentItem.color);
  const stockAvailable = fabricObj?.stockRolls || 0;
  const isStockInsufficient = stockAvailable < currentItem.rollsUsed;

  const handleSizeChange = (sizeKey: string, value: string) => {
    const newVal = parseInt(value) || 0;
    const newItems = [...itemsData];
    newItems[activeItemIndex].sizes = { ...newItems[activeItemIndex].sizes, [sizeKey]: newVal };
    newItems[activeItemIndex].actualPieces = Object.values(newItems[activeItemIndex].sizes).reduce((acc: number, curr: number | undefined) => acc + (curr || 0), 0);
    setItemsData(newItems);
  };

  const handleNext = () => { if (activeItemIndex < itemsData.length - 1) setActiveItemIndex(activeItemIndex + 1); };
  const handlePrev = () => { if (activeItemIndex > 0) setActiveItemIndex(activeItemIndex - 1); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(itemsData, JSON.parse(JSON.stringify(itemsData)));
    onClose();
  };

  const standardSizes = ['P', 'M', 'G', 'GG'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 p-6 text-white flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <Scissors size={20} className="text-indigo-300"/>
                 <h2 className="text-xl font-black">Lançar Corte</h2>
              </div>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">
                Item {activeItemIndex + 1} de {itemsData.length}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {isStockInsufficient && (
            <div className="bg-red-50 border-2 border-red-200 p-4 rounded-2xl flex gap-4 text-red-700 animate-in shake duration-500">
              <AlertTriangle className="flex-shrink-0" size={24}/>
              <div>
                <p className="text-sm font-black uppercase tracking-tight">Estoque Bloqueado!</p>
                <p className="text-xs font-medium">O tecido <strong>{currentItem.fabricName} - {currentItem.color}</strong> possui apenas <strong>{stockAvailable.toFixed(1)}</strong> rolos.</p>
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center shadow-inner">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-white shadow-md" style={{backgroundColor: currentItem.colorHex}}></div>
                <div>
                   <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Ref / Cor</p>
                   <p className="text-sm font-black text-slate-800">{currentItem.referenceCode} - {currentItem.color}</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Previsto</p>
                <p className="text-lg font-black text-indigo-600">{currentItem.estimatedPieces} <span className="text-[10px]">peças</span></p>
             </div>
          </div>

          <div>
             <div className="flex items-center gap-2 mb-3">
                <Layers size={14} className="text-slate-400"/>
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Quantidades Cortadas Reais</h3>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               {standardSizes.map((size) => (
                 <div key={size} className="space-y-1">
                   <label className="block text-[10px] font-black text-slate-500 mb-1 text-center bg-white border border-slate-200 rounded-md py-1 uppercase">{size}</label>
                   <input 
                     type="number" 
                     min="0" 
                     className="w-full px-2 py-3 text-center font-black text-indigo-700 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                     value={currentItem.sizes[size] || 0} 
                     onChange={(e) => handleSizeChange(size, e.target.value)} 
                   />
                 </div>
               ))}
             </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex flex-col items-center">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Confirmado Agora</p>
             <p className="text-3xl font-black text-emerald-600">{currentItem.actualPieces} <span className="text-xs font-bold text-slate-300">pçs</span></p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-4 flex-shrink-0">
          <button type="button" onClick={handlePrev} disabled={activeItemIndex === 0} className="px-6 py-2.5 rounded-xl text-slate-600 bg-white border border-slate-200 disabled:opacity-0 font-bold text-xs uppercase tracking-wider shadow-sm">Anterior</button>
          
          {activeItemIndex < itemsData.length - 1 ? (
            <button type="button" onClick={handleNext} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg uppercase text-xs tracking-wider transition-all">Próxima Cor <ArrowRight size={16} /></button>
          ) : (
            <button 
                type="button" 
                onClick={handleSubmit} 
                disabled={isStockInsufficient} 
                className={`flex-1 font-black py-2.5 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 text-white uppercase text-xs tracking-wider transition-all ${isStockInsufficient ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'}`}
            >
                Confirmar e Dar Baixa <Check size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
