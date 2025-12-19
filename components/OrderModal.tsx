
import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Plus, Trash2, Calendar, Search, Info, PlusCircle, Layers, CheckSquare } from 'lucide-react';
import { ProductionOrder, OrderStatus, ProductionOrderItem, Fabric, Seamstress, ProductReference } from '../types';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Omit<ProductionOrder, 'updatedAt'>) => void;
  references: ProductReference[];
  fabrics: Fabric[];
  seamstresses: Seamstress[];
  orderToEdit?: ProductionOrder | null;
  suggestedId?: string;
}

export const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, onSave, references, fabrics, seamstresses, orderToEdit, suggestedId }) => {
  const [customId, setCustomId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ProductionOrderItem[]>([]);
  const [description, setDescription] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (orderToEdit) {
        setCustomId(orderToEdit.id);
        setOrderDate(new Date(orderToEdit.createdAt).toISOString().split('T')[0]);
        setNotes(orderToEdit.notes || '');
        setItems(orderToEdit.items);
        setDescription(orderToEdit.description || '');
      } else {
        setCustomId(suggestedId || '');
        setOrderDate(new Date().toISOString().split('T')[0]);
        setNotes('');
        setItems([]);
        setDescription('');
        setSearchTerm('');
      }
    }
  }, [isOpen, orderToEdit, suggestedId]);

  const filteredReferences = useMemo(() => {
    if (!searchTerm) return [];
    return references.filter(r => 
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [references, searchTerm]);

  const handleAddProductToReference = (product: ProductReference) => {
    const newItems = product.defaultColors.map(color => ({
      productId: product.id,
      referenceCode: product.code,
      color: color.name,
      colorHex: color.hex,
      rollsUsed: 0,
      piecesPerSizeEst: 0,
      estimatedPieces: 0,
      actualPieces: 0,
      sizes: { P: 0, M: 0, G: 0, GG: 0, G1: 0, G2: 0, G3: 0 },
      fabricName: product.defaultFabric
    }));
    
    setItems([...items, ...newItems]);
    
    if (!description) {
      setDescription(product.description);
    } else if (!description.includes(product.description)) {
      setDescription(prev => prev + ", " + product.description);
    }

    setSearchTerm('');
    setIsSearching(false);
  };

  const updateItem = (index: number, field: keyof ProductionOrderItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    newItems[index] = item;
    setItems(newItems);
  };

  const toggleSizeSelection = (index: number, size: string) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    const currentVal = item.sizes[size] || 0;
    // Toggles between 0 and 1 (just to indicate presence in planning)
    item.sizes = { ...item.sizes, [size]: currentVal > 0 ? 0 : 1 };
    newItems[index] = item;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Adicione pelo menos uma referência ao pedido.");
      return;
    }

    const uniqueRefs = Array.from(new Set(items.map(i => i.referenceCode)));

    onSave({
      id: customId,
      referenceId: items[0].productId,
      referenceCode: uniqueRefs.join(', '),
      description: description || `Pedido c/ múltiplas refs: ${uniqueRefs.join(', ')}`,
      fabric: items[0].fabricName,
      items: items,
      activeCuttingItems: [],
      splits: [],
      gridType: 'STANDARD',
      status: OrderStatus.PLANNED,
      notes,
      createdAt: new Date(orderDate).toISOString()
    });
    onClose();
  };

  const sizesList = ['P', 'M', 'G', 'GG', 'G1', 'G2', 'G3'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{orderToEdit ? 'Editar Pedido' : 'Incluir Novo Pedido'}</h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Seleção de Cores e Tamanhos do Corte</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Número do Pedido</label>
              <input required type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={customId} onChange={e => setCustomId(e.target.value)} />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Data de Entrada</label>
              <input required type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Descrição da Peça</label>
              <input required type="text" placeholder="Ex: Blazer, Calça..." className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>
          
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest flex items-center gap-1"><Search size={12}/> Buscar e Adicionar Referências</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Digite o código ou nome do produto..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={searchTerm} 
                onChange={e => { setSearchTerm(e.target.value); setIsSearching(true); }}
                onFocus={() => setIsSearching(true)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
            
            {isSearching && filteredReferences.length > 0 && (
              <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                {filteredReferences.map(ref => (
                  <button 
                    key={ref.id} 
                    type="button" 
                    className="w-full px-4 py-4 text-left hover:bg-indigo-50 border-b border-slate-100 flex justify-between items-center group transition-colors"
                    onClick={() => handleAddProductToReference(ref)}
                  >
                    <div>
                      <span className="font-black text-indigo-700 block text-sm">{ref.code}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{ref.description}</span>
                    </div>
                    <PlusCircle size={20} className="text-indigo-400"/>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">Configurar Itens do Corte ({items.length})</h3>
             </div>
             <div className="space-y-4">
                 {items.map((item, idx) => (
                   <div key={idx} className="p-5 bg-white border border-slate-200 rounded-2xl relative group hover:border-indigo-200 transition-colors shadow-sm">
                     <button type="button" onClick={() => removeItem(idx)} className="absolute top-4 right-4 bg-white text-slate-400 hover:text-red-500 p-1.5 rounded-full border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all" title="Remover cor"><Trash2 size={16}/></button>
                     
                     <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-1/4">
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 tracking-wider">{item.referenceCode}</label>
                            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="w-8 h-8 rounded-full border border-white shadow-sm flex-shrink-0" style={{backgroundColor: item.colorHex}}></div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-xs font-black text-slate-800 truncate">{item.color}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase truncate">{item.fabricName}</span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Previsão de Rolos</label>
                                <input required type="number" step="0.1" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none" value={item.rollsUsed || ''} onChange={e => updateItem(idx, 'rollsUsed', e.target.value)} />
                            </div>
                        </div>

                        <div className="flex-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Selecione os Tamanhos para esta Cor</label>
                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                {sizesList.map(size => {
                                    const isSelected = (item.sizes[size] || 0) > 0;
                                    return (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => toggleSizeSelection(idx, size)}
                                            className={`py-3 rounded-xl font-black text-sm border-2 transition-all active:scale-95 ${
                                                isSelected 
                                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-100' 
                                                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                                <Info size={14} className="text-indigo-400"/>
                                <span>Os tamanhos marcados aparecerão na lista de planejamento para o corte.</span>
                            </div>
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
          </div>

          <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
             <label className="block text-[10px] font-black text-indigo-900 mb-2 uppercase tracking-widest">Observações do Pedido</label>
             <textarea className="w-full p-4 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Prioridade urgente, lote promocional..." />
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center gap-4">
            <button type="button" onClick={onClose} className="px-8 py-3 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors">Cancelar</button>
            <button type="submit" onClick={handleSubmit} className="px-10 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 active:scale-95 transition-all"><Save size={18} /> SALVAR PLANEJAMENTO</button>
        </div>
      </div>
    </div>
  );
}
