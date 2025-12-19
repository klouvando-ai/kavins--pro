
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Scissors, 
  Users, 
  Plus, 
  Search, 
  CheckCircle2, 
  Shirt,
  Tags,
  Trash2,
  ChevronDown,
  ChevronUp,
  Edit2,
  PackageCheck,
  ClipboardList,
  CalendarDays,
  FileText,
  MapPin,
  Loader2,
  Printer,
  Layers,
  Phone,
  Menu,
  X,
  Lock,
  User,
  AlertTriangle,
  Clock,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';

import { StatCard } from './components/StatCard';
import { OrderModal } from './components/OrderModal';
import { ProductModal } from './components/ProductModal';
import { CutConfirmationModal } from './components/CutConfirmationModal';
import { DistributeModal } from './components/DistributeModal';
import { SeamstressModal } from './components/SeamstressModal';
import { FabricModal } from './components/FabricModal';
import { ProductionOrder, Seamstress, OrderStatus, ProductReference, ProductionOrderItem, OrderSplit, Fabric } from './types';

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`/api/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Erro na requisição');
  }
  return response.json();
};

const getStageIcon = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PLANNED: return ClipboardList;
    case OrderStatus.CUTTING: return Scissors;
    case OrderStatus.SEWING: return Shirt;
    case OrderStatus.FINISHED: return CheckCircle2;
    default: return PackageCheck;
  }
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'production' | 'seamstresses' | 'products' | 'reports' | 'fabrics'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [productionStage, setProductionStage] = useState<OrderStatus>(OrderStatus.PLANNED);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [seamstresses, setSeamstresses] = useState<Seamstress[]>([]);
  const [references, setReferences] = useState<ProductReference[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSeamstressModalOpen, setIsSeamstressModalOpen] = useState(false);
  const [isFabricModalOpen, setIsFabricModalOpen] = useState(false);
  const [fabricEntryMode, setFabricEntryMode] = useState(false);
  
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [expandedReportOrders, setExpandedReportOrders] = useState<string[]>([]);
  
  const [cuttingOrder, setCuttingOrder] = useState<ProductionOrder | null>(null);
  const [distributingOrder, setDistributingOrder] = useState<ProductionOrder | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductReference | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<ProductionOrder | null>(null);
  const [seamstressToEdit, setSeamstressToEdit] = useState<Seamstress | null>(null);
  const [fabricToEdit, setFabricToEdit] = useState<Fabric | null>(null);
  
  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    fabric: '',
    seamstressId: '',
    reference: ''
  });

  const [fabricFilters, setFabricFilters] = useState({
    name: '',
    color: '',
    minStock: ''
  });

  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [isLoggedIn]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsData, seamstressesData, ordersData, fabricsData] = await Promise.all([
        apiFetch('products').catch(() => []),
        apiFetch('seamstresses').catch(() => []),
        apiFetch('orders').catch(() => []),
        apiFetch('fabrics').catch(() => [])
      ]);

      setReferences(Array.isArray(productsData) ? productsData : []);
      setSeamstresses(Array.isArray(seamstressesData) ? seamstressesData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setFabrics(Array.isArray(fabricsData) ? fabricsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'kavins' && loginForm.password === 'kavins2026') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Usuário ou senha incorretos.');
    }
  };

  const dashboardMetrics = useMemo(() => {
    const plannedCount = orders.filter(o => o.status === OrderStatus.PLANNED).length;
    const cuttingCount = orders.filter(o => o.status === OrderStatus.CUTTING).length;
    const sewingCount = orders.filter(o => o.status === OrderStatus.SEWING).length;
    
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      const pieces = orders.reduce((acc, o) => {
        const finishedInDate = (o.splits || []).filter(s => s.status === OrderStatus.FINISHED && s.finishedAt?.startsWith(d.toISOString().split('T')[0]));
        return acc + finishedInDate.reduce((sAcc, s) => sAcc + s.items.reduce((iAcc, item) => iAcc + (item.actualPieces || 0), 0), 0);
      }, 0);
      return { name: dateStr, pecas: pieces };
    });

    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthStr = d.toLocaleDateString('pt-BR', { month: 'short' });
      const year = d.getFullYear();
      const month = d.getMonth();
      const pieces = orders.reduce((acc, o) => {
        const finishedInMonth = (o.splits || []).filter(s => {
          if (!s.finishedAt) return false;
          const fDate = new Date(s.finishedAt);
          return fDate.getMonth() === month && fDate.getFullYear() === year;
        });
        return acc + finishedInMonth.reduce((sAcc, s) => sAcc + s.items.reduce((iAcc, item) => iAcc + (item.actualPieces || 0), 0), 0);
      }, 0);
      return { name: monthStr, pecas: pieces };
    });

    const sewingCountS = seamstresses.filter(s => s.active && orders.some(o => (o.splits || []).some(split => split.seamstressId === s.id && split.status === OrderStatus.SEWING))).length;
    const idleCount = seamstresses.filter(s => s.active && !orders.some(o => (o.splits || []).some(split => split.seamstressId === s.id && split.status === OrderStatus.SEWING))).length;
    const inactiveCount = seamstresses.filter(s => !s.active).length;

    return { 
      plannedOrdersCount: plannedCount, 
      cuttingOrders: cuttingCount, 
      sewingOrdersCount: sewingCount, 
      weeklyData, 
      monthlyData, 
      seamstressStatusData: [
        { name: 'Costurando', value: sewingCountS, color: '#4f46e5' },
        { name: 'Parada', value: idleCount, color: '#f59e0b' },
        { name: 'Inativa', value: inactiveCount, color: '#94a3b8' }
      ]
    };
  }, [orders, seamstresses]);

  const reportFilteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (reportFilters.startDate && o.createdAt < new Date(reportFilters.startDate).toISOString()) return false;
      if (reportFilters.endDate) {
          const endDate = new Date(reportFilters.endDate);
          endDate.setHours(23, 59, 59);
          if (o.createdAt > endDate.toISOString()) return false;
      }
      if (reportFilters.fabric && o.fabric !== reportFilters.fabric) return false;
      if (reportFilters.seamstressId && !(o.splits || []).some(s => s.seamstressId === reportFilters.seamstressId)) return false;
      if (reportFilters.reference && !o.referenceCode.toLowerCase().includes(reportFilters.reference.toLowerCase())) return false;
      return true;
    });
  }, [orders, reportFilters]);

  const reportMetrics = useMemo(() => {
    return reportFilteredOrders.reduce((acc, o) => ({
      totalCut: acc.totalCut + o.items.reduce((sum, i) => sum + (i.actualPieces || 0), 0),
      totalSewn: acc.totalSewn + (o.splits || []).reduce((sum, s) => s.status === OrderStatus.FINISHED ? sum + s.items.reduce((isum, it) => isum + (it.actualPieces || 0), 0) : sum, 0),
      totalRolls: acc.totalRolls + o.items.reduce((sum, i) => sum + (Number(i.rollsUsed) || 0), 0)
    }), { totalCut: 0, totalSewn: 0, totalRolls: 0 });
  }, [reportFilteredOrders]);

  const seamstressData = useMemo(() => {
    return seamstresses.map(s => {
      const isSewing = orders.some(o => (o.splits || []).some(split => split.seamstressId === s.id && split.status === OrderStatus.SEWING));
      return {
        ...s,
        statusLabel: s.active ? (isSewing ? 'Costurando' : 'Parada') : 'Inativa'
      };
    });
  }, [seamstresses, orders]);

  const nextOrderId = useMemo(() => {
    if (orders.length === 0) return '1001';
    const numericIds = orders
      .map(o => parseInt(o.id.replace(/\D/g, '')))
      .filter(id => !isNaN(id));
    
    if (numericIds.length === 0) return (orders.length + 1001).toString();
    return (Math.max(...numericIds) + 1).toString();
  }, [orders]);

  const handleCreateOrder = async (newOrderData: Omit<ProductionOrder, 'updatedAt'>) => {
    try {
        const timestamp = new Date().toISOString();
        const payload = { ...newOrderData, updatedAt: timestamp };
        const existing = orders.find(o => o.id === newOrderData.id);
        if (existing) {
            await apiFetch(`orders/${newOrderData.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
            setOrders(prev => prev.map(o => o.id === newOrderData.id ? payload as ProductionOrder : o));
        } else {
            await apiFetch('orders', { method: 'POST', body: JSON.stringify(payload) });
            setOrders(prev => [payload as ProductionOrder, ...prev]);
        }
    } catch (error) { alert("Erro ao salvar pedido: " + (error as Error).message); }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta ordem?")) return;
    try {
      await apiFetch(`orders/${id}`, { method: 'DELETE' });
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (error) { alert("Erro ao excluir ordem: " + (error as Error).message); }
  };

  const handleConfirmCut = async (updatedItems: ProductionOrderItem[], activeItems: ProductionOrderItem[]) => {
    if (!cuttingOrder) return;
    
    const fabricUsage: Record<string, number> = {};
    updatedItems.forEach(item => {
      const key = `${item.fabricName}|${item.color}`;
      fabricUsage[key] = (fabricUsage[key] || 0) + (Number(item.rollsUsed) || 0);
    });

    for (const [key, rollsRequired] of Object.entries(fabricUsage)) {
      const [name, color] = key.split('|');
      const fabricToDeduct = fabrics.find(f => f.name === name && f.color === color);
      
      if (!fabricToDeduct || fabricToDeduct.stockRolls < rollsRequired) {
        alert(`Estoque insuficiente de "${name} - ${color}". Necessário: ${rollsRequired.toFixed(1)} rolos, Disponível: ${fabricToDeduct?.stockRolls.toFixed(1) || '0'} rolos.`);
        return;
      }
    }

    try {
      for (const [key, rollsRequired] of Object.entries(fabricUsage)) {
        const [name, color] = key.split('|');
        const fabricToUpdate = fabrics.find(f => f.name === name && f.color === color);
        if (fabricToUpdate) {
          const newStock = Math.max(0, fabricToUpdate.stockRolls - rollsRequired);
          await apiFetch(`fabrics/${fabricToUpdate.id}`, { 
            method: 'PATCH', 
            body: JSON.stringify({ stockRolls: newStock }) 
          });
        }
      }

      const timestamp = new Date().toISOString();
      const updatedOrder = { 
        ...cuttingOrder, 
        items: updatedItems, 
        activeCuttingItems: activeItems, 
        status: OrderStatus.CUTTING, 
        updatedAt: timestamp 
      };
      await apiFetch(`orders/${cuttingOrder.id}`, { method: 'PATCH', body: JSON.stringify(updatedOrder) });
      
      fetchData();
      setProductionStage(OrderStatus.CUTTING);
      setCuttingOrder(null);
    } catch (error) { 
      console.error(error);
      alert("Erro ao processar baixa de estoque e confirmar corte."); 
    }
  };

  const handlePrintAllPlanned = () => {
    const plannedOrders = orders.filter(o => o.status === OrderStatus.PLANNED);
    if (plannedOrders.length === 0) {
      alert("Não há pedidos planejados para imprimir.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let ordersHtml = '';
    plannedOrders.forEach(order => {
      const uniqueRefs = Array.from(new Set(order.items.map(i => i.referenceCode))).join(', ');
      
      // Criar mapeamento de tamanhos escolhidos por referência
      const refsMap = new Map<string, string[]>();
      order.items.forEach(item => {
          const selectedSizes = Object.entries(item.sizes)
            .filter(([_, q]) => (q || 0) > 0)
            .map(([s, _]) => s);
          
          if (!refsMap.has(item.referenceCode)) {
              refsMap.set(item.referenceCode, selectedSizes);
          } else {
              const current = refsMap.get(item.referenceCode)!;
              refsMap.set(item.referenceCode, Array.from(new Set([...current, ...selectedSizes])));
          }
      });

      // Função para formatar a string da grade (ex: P-M-G-GG)
      const formatGrid = (sizes: string[]) => {
          if (sizes.length === 0) return 'Grade';
          
          const standardSet = ['P', 'M', 'G', 'GG'];
          const plusSet = ['G1', 'G2', 'G3'];
          
          const hasAllStandard = standardSet.every(s => sizes.includes(s));
          const hasAllPlus = plusSet.every(s => sizes.includes(s));
          
          if (hasAllStandard && sizes.length === 4) return 'P-M-G-GG';
          if (hasAllPlus && sizes.length === 3) return 'G1-G2-G3';
          
          // Ordenação lógica para exibição
          const orderList = ['P', 'M', 'G', 'GG', 'G1', 'G2', 'G3'];
          return sizes.sort((a, b) => orderList.indexOf(a) - orderList.indexOf(b)).join('-');
      };

      const sizeDisplay = Array.from(refsMap.entries()).map(([ref, sizes]) => {
          return `${ref} (${formatGrid(sizes)})`;
      }).join(' / ');

      ordersHtml += `
        <div class="order-block">
          <div class="main-info">
            <span class="ref"><b>REF:</b> ${uniqueRefs}</span>
            <span class="desc"><b>DESC:</b> ${order.description} <b>[ ${sizeDisplay} ]</b></span>
            <span class="fabric"><b>TECIDO:</b> ${order.fabric}</span>
          </div>
          <div class="items-list">
            ${order.items.map(item => {
              const fabricObj = fabrics.find(f => f.name === item.fabricName && f.color === item.color);
              const fabricNotes = fabricObj?.notes || '';
              return `
                <div class="item-row">
                   <span class="color-info">${item.color} ${fabricNotes ? `- ${fabricNotes}` : ''} - ${item.rollsUsed} rolos</span>
                   <div class="blank-space-line"></div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Planejamento de Corte - Geral</title>
          <style>
            @page { margin: 0.5cm; }
            body { font-family: 'Inter', sans-serif; font-size: 11px; color: #000; padding: 10px; }
            h1 { text-align: center; font-size: 16px; margin-bottom: 20px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 5px; }
            .order-block { margin-bottom: 20px; border-bottom: 1px dashed #bbb; padding-bottom: 15px; page-break-inside: avoid; }
            .main-info { display: flex; gap: 20px; font-size: 12px; margin-bottom: 12px; background: #f3f4f6; padding: 6px; border-radius: 4px; border: 1px solid #e5e7eb; }
            .ref { min-width: 120px; font-weight: bold; }
            .desc { flex: 1; }
            .fabric { min-width: 150px; }
            .items-list { padding-left: 5px; }
            .item-row { display: flex; align-items: flex-end; margin-bottom: 15px; width: 100%; }
            .color-info { font-weight: bold; white-space: nowrap; margin-right: 8px; font-size: 11px; }
            .blank-space-line { flex: 1; border-bottom: 1px solid #000; height: 1px; min-width: 200px; }
            .footer { margin-top: 30px; font-size: 8px; text-align: right; color: #666; font-style: italic; }
          </style>
        </head>
        <body>
          <h1>LISTA DE PLANEJAMENTO PARA CORTE</h1>
          ${ordersHtml}
          <div class="footer">Gerado em ${new Date().toLocaleString()} - Kavin's Production Manager</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintOrder = (order: ProductionOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="border:1px solid #ddd; padding:8px;">${item.referenceCode}</td>
        <td style="border:1px solid #ddd; padding:8px;">${item.color}</td>
        <td style="border:1px solid #ddd; padding:8px;">${item.fabricName}</td>
        <td style="border:1px solid #ddd; padding:8px; text-align:center;">${item.rollsUsed}</td>
        <td style="border:1px solid #ddd; padding:8px;">
          ${Object.entries(item.sizes).filter(([_, q]) => (q || 0) > 0).map(([s, q]) => `<b>${s}:</b> ${q}`).join(' | ')}
        </td>
        <td style="border:1px solid #ddd; padding:8px; text-align:center; font-weight:bold;">${item.actualPieces || item.estimatedPieces}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Ordem de Corte #${order.id}</title>
          <style>
            @page { margin: 0.5cm; }
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #334155; }
            table { width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 12px; }
            th { text-align: left; background-color: #f8fafc; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
            h1 { color: #1e293b; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px; font-size: 20px; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px; }
            .badge { background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 99px; font-weight: bold; font-size: 11px; }
          </style>
        </head>
        <body>
          <h1>Kavin's - Ficha de Corte #${order.id}</h1>
          <div class="header-info">
            <div>
              <p><strong>Status:</strong> <span class="badge">${order.status}</span></p>
              <p><strong>Emissão:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Referências:</strong> ${Array.from(new Set(order.items.map(i => i.referenceCode))).join(', ')}</p>
            </div>
          </div>
          <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 12px;"><strong>Observações:</strong> ${order.notes || 'Sem observações.'}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="border:1px solid #cbd5e1; padding:10px;">Ref.</th>
                <th style="border:1px solid #cbd5e1; padding:10px;">Cor</th>
                <th style="border:1px solid #cbd5e1; padding:10px;">Tecido</th>
                <th style="border:1px solid #cbd5e1; padding:10px;">Rolos</th>
                <th style="border:1px solid #cbd5e1; padding:10px;">Grade de Peças</th>
                <th style="border:1px solid #cbd5e1; padding:10px;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSaveProduct = async (product: Omit<ProductReference, 'id'> | ProductReference) => {
    try {
      if ('id' in product) await apiFetch(`products/${product.id}`, { method: 'PUT', body: JSON.stringify(product) });
      else await apiFetch('products', { method: 'POST', body: JSON.stringify({ ...product, id: Date.now().toString() }) });
      fetchData();
    } catch (error) { alert("Erro ao salvar produto."); }
  };

  const handleSaveSeamstress = async (seamstress: Omit<Seamstress, 'id'> | Seamstress) => {
    try {
      if ('id' in seamstress) await apiFetch(`seamstresses/${seamstress.id}`, { method: 'PUT', body: JSON.stringify(seamstress) });
      else await apiFetch('seamstresses', { method: 'POST', body: JSON.stringify({...seamstress, id: Date.now().toString()}) });
      fetchData();
    } catch (error) { alert("Erro ao salvar costureira."); }
  };

  const handleSaveFabric = async (f: Omit<Fabric, 'id' | 'createdAt' | 'updatedAt'> | Fabric) => {
    try {
      if ('id' in f) await apiFetch(`fabrics/${f.id}`, { method: 'PATCH', body: JSON.stringify(f) });
      else await apiFetch('fabrics', { method: 'POST', body: JSON.stringify({ ...f, id: Date.now().toString() }) });
      fetchData();
      setIsFabricModalOpen(false);
    } catch (error) { alert("Erro ao salvar tecido."); }
  };

  const handleDistribute = async (originalOrderId: string, distributionMap: {color: string, sizes: any}[], seamstressId: string) => {
    const order = orders.find(o => o.id === originalOrderId);
    if (!order) return;
    try {
      const seamstress = seamstresses.find(s => s.id === seamstressId);
      const timestamp = new Date().toISOString();
      const newSplit: OrderSplit = {
        id: Date.now().toString(),
        seamstressId,
        seamstressName: seamstress?.name || 'Unknown',
        status: OrderStatus.SEWING,
        items: distributionMap.map(d => {
          const originalItem = order.items.find(i => i.color === d.color);
          return {
            productId: originalItem?.productId || '',
            referenceCode: originalItem?.referenceCode || '',
            color: d.color,
            colorHex: originalItem?.colorHex,
            rollsUsed: 0,
            piecesPerSizeEst: 0,
            estimatedPieces: 0,
            actualPieces: Object.values(d.sizes).reduce((acc: number, curr: any) => acc + (curr || 0), 0) as number,
            sizes: d.sizes,
            fabricName: originalItem?.fabricName || ''
          };
        }),
        createdAt: timestamp
      };
      
      const newActiveItems = order.activeCuttingItems.map(item => {
          const sent = distributionMap.find(d => d.color === item.color);
          if (!sent) return item;
          const updatedSizes = { ...item.sizes };
          Object.keys(sent.sizes).forEach(size => { 
            updatedSizes[size] = Math.max(0, (updatedSizes[size] || 0) - (sent.sizes[size] || 0)); 
          });
          return { ...item, sizes: updatedSizes, actualPieces: Object.values(updatedSizes).reduce((acc: number, curr: any) => acc + (curr || 0), 0) as number };
      });
      
      const totalRemaining = newActiveItems.reduce((acc, i) => acc + (i.actualPieces || 0), 0);
      const finalStatus = totalRemaining === 0 ? OrderStatus.SEWING : order.status;

      const updatedOrder: ProductionOrder = { ...order, activeCuttingItems: newActiveItems, splits: [...(order.splits || []), newSplit], status: finalStatus, updatedAt: timestamp };
      await apiFetch(`orders/${order.id}`, { method: 'PATCH', body: JSON.stringify(updatedOrder) });
      setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
    } catch (error) { alert("Erro ao distribuir pedido."); }
  };

  const handleFinishSplit = async (orderId: string, splitId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !window.confirm("Confirmar finalização deste pacote?")) return;
    try {
        const timestamp = new Date().toISOString();
        const updatedSplits = (order.splits || []).map(s => (s.id === splitId) ? { ...s, status: OrderStatus.FINISHED, finishedAt: timestamp } : s);
        const allFinished = updatedSplits.every(s => s.status === OrderStatus.FINISHED) && (order.activeCuttingItems || []).every(i => i.actualPieces === 0);
        const updatedOrder: ProductionOrder = { ...order, splits: updatedSplits, status: allFinished ? OrderStatus.FINISHED : order.status, finishedAt: allFinished ? timestamp : order.finishedAt, updatedAt: timestamp };
        await apiFetch(`orders/${order.id}`, { method: 'PATCH', body: JSON.stringify(updatedOrder) });
        setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
    } catch (error) { alert("Erro ao finalizar pacote."); }
  };

  if (!isLoggedIn) return (
    <div className="flex h-screen items-center justify-center bg-indigo-950 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-10"><h1 className="text-4xl font-black text-indigo-900 mb-2">Kavin's</h1><p className="text-slate-500 font-medium">Gestão de Produção</p></div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Usuário</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300" size={18} /><input autoFocus type="text" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} placeholder="kavins" /></div></div>
          <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Senha</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300" size={18} /><input type="password" title="password" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} placeholder="••••••••" /></div></div>
          {loginError && <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>}<button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95">ENTRAR NO SISTEMA</button>
        </form>
      </div>
    </div>
  );

  if (isLoading) return (<div className="flex h-screen items-center justify-center bg-slate-50 text-center"><div className="animate-pulse"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h2 className="text-xl font-bold text-slate-700 uppercase tracking-widest">Carregando...</h2></div></div>);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden relative">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-indigo-950 text-white flex flex-col shadow-xl transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex items-center justify-between"><div><h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Kavin's</h1><p className="text-[10px] text-indigo-300 mt-1 uppercase tracking-widest font-bold">Produção</p></div><button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-indigo-300 hover:text-white"><X size={24} /></button></div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <button onClick={() => {setActiveTab('dashboard'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-200 hover:bg-white/10'}`}><LayoutDashboard size={20} /> <span className="font-medium">Dashboard</span></button>
          <button onClick={() => {setActiveTab('production'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'production' ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-200 hover:bg-white/10'}`}><Scissors size={20} /> <span className="font-medium">Produção</span></button>
          <button onClick={() => {setActiveTab('fabrics'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'fabrics' ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-200 hover:bg-white/10'}`}><Layers size={20} /> <span className="font-medium">Estoque de Tecidos</span></button>
          <button onClick={() => {setActiveTab('reports'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-200 hover:bg-white/10'}`}><FileText size={20} /> <span className="font-medium">Relatórios</span></button>
          <button onClick={() => {setActiveTab('products'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-200 hover:bg-white/10'}`}><Tags size={20} /> <span className="font-medium">Cadastros</span></button>
          <button onClick={() => {setActiveTab('seamstresses'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'seamstresses' ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-200 hover:bg-white/10'}`}><Users size={20} /> <span className="font-medium">Costureiras</span></button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto relative flex flex-col">
        <header className="sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-slate-200 px-4 lg:px-8 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3"><button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-slate-100 rounded-lg text-slate-600"><Menu size={20} /></button><h2 className="text-lg lg:text-2xl font-bold text-slate-800 uppercase tracking-tight">{activeTab === 'dashboard' && 'Visão Geral'}{activeTab === 'production' && 'Produção'}{activeTab === 'reports' && 'Relatórios'}{activeTab === 'products' && 'Produtos'}{activeTab === 'seamstresses' && 'Costureiras'}{activeTab === 'fabrics' && 'Estoque'}</h2></div>
          <div className="flex items-center gap-2">
            {activeTab === 'production' && productionStage === OrderStatus.PLANNED && (
              <button onClick={handlePrintAllPlanned} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full font-medium flex items-center gap-2 shadow transition-all active:scale-95 text-sm">
                <Printer size={18} /> Imprimir Geral Planejados
              </button>
            )}
            {activeTab === 'production' && (<button onClick={() => { setOrderToEdit(null); setIsOrderModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-full font-medium flex items-center gap-2 shadow-lg active:scale-95 text-sm"><Plus size={18} /> Nova Ordem</button>)}
            {activeTab === 'products' && (<button onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 shadow-lg active:scale-95 text-sm"><Plus size={18} /> Novo Produto</button>)}
            {activeTab === 'seamstresses' && (<button onClick={() => { setSeamstressToEdit(null); setIsSeamstressModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 shadow-lg active:scale-95 text-sm"><Plus size={18} /> Nova Costureira</button>)}
            {activeTab === 'fabrics' && (<button onClick={() => { setFabricToEdit(null); setFabricEntryMode(false); setIsFabricModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 shadow-lg active:scale-95 text-sm"><Plus size={18} /> Novo Cadastro</button>)}
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 w-full animate-in fade-in duration-500">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Planejados" value={dashboardMetrics.plannedOrdersCount} icon={ClipboardList} color="bg-blue-500" />
                <StatCard title="Em Corte" value={dashboardMetrics.cuttingOrders} icon={Scissors} color="bg-purple-500" />
                <StatCard title="Costurando" value={dashboardMetrics.sewingOrdersCount} icon={Shirt} color="bg-pink-500" />
                <StatCard title="Total de Ordens" value={orders.length} icon={Layers} color="bg-indigo-500" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                   <h3 className="text-lg font-bold text-slate-800 mb-6">Produção Semanal (Pçs)</h3>
                   <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={dashboardMetrics.weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="pecas" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                   <h3 className="text-lg font-bold text-slate-800 mb-6">Produção Mensal</h3>
                   <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={dashboardMetrics.monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                            <Line type="monotone" dataKey="pecas" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5'}} activeDot={{r: 6}} />
                         </LineChart>
                      </ResponsiveContainer>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
                   <h3 className="text-lg font-bold text-slate-800 mb-6">Status das Costureiras</h3>
                   <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className="h-48 w-48">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie data={dashboardMetrics.seamstressStatusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                  {dashboardMetrics.seamstressStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                               </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1 w-full">
                         {dashboardMetrics.seamstressStatusData.map((status, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-slate-50 bg-slate-50/50">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{status.name}</p>
                               <p className="text-2xl font-black text-slate-800 mt-1">{status.value}</p>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'production' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[500px]">
              <div className="flex p-1 bg-slate-100 border-b border-slate-200 overflow-x-auto no-scrollbar">
                {(Object.values(OrderStatus) as OrderStatus[]).map((status) => { 
                  const Icon = getStageIcon(status); 
                  const isActive = productionStage === status; 
                  const count = orders.filter(o => o.status === status).length; 
                  return (
                    <button key={status} onClick={() => setProductionStage(status)} className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-xs font-bold transition-all relative whitespace-nowrap ${isActive ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      <Icon size={14} className={isActive ? 'text-indigo-600' : 'text-slate-400'}/>{status}{count > 0 && <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>{count}</span>}
                    </button>
                  ); 
                })}
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead><tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-semibold"><th className="p-4 w-10"></th><th className="p-4">Pedido</th><th className="p-4">Referências</th><th className="p-4 text-center">Peças</th><th className="p-4 text-right">Ações</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">{orders.filter(o => o.status === productionStage).map(order => { 
                      const isExpanded = expandedOrders.includes(order.id); 
                      const uniqueRefs = Array.from(new Set(order.items.map(i => i.referenceCode))).join(', ');
                      const hasBalance = order.activeCuttingItems?.some(i => (i.actualPieces || 0) > 0);

                      return (
                        <React.Fragment key={order.id}>
                          <tr className={`hover:bg-slate-50 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50/50' : ''}`} onClick={() => setExpandedOrders(prev => prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id])}><td className="p-4 text-center"><button className="text-slate-400">{isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button></td><td className="p-4"><strong>#{order.id}</strong><br/><span className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span></td><td className="p-4"><strong>{uniqueRefs}</strong></td><td className="p-4 text-center"><strong>{order.items.reduce((acc, i) => acc + (productionStage === OrderStatus.PLANNED ? i.estimatedPieces : (i.actualPieces || 0)), 0)}</strong></td><td className="p-4 text-right" onClick={e => e.stopPropagation()}><div className="flex justify-end gap-2"><button onClick={() => handlePrintOrder(order)} className="text-slate-400 hover:text-indigo-600 p-1" title="Imprimir Ficha de Corte"><Printer size={16}/></button>{order.status === OrderStatus.PLANNED && (<><button onClick={() => { setOrderToEdit(order); setIsOrderModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 size={16} /></button><button onClick={() => setCuttingOrder(order)} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold shadow-md hover:bg-indigo-700">Iniciar</button><button onClick={() => handleDeleteOrder(order.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16} /></button></>)}{(order.status === OrderStatus.CUTTING || (order.status === OrderStatus.SEWING && hasBalance)) && (<button onClick={() => setDistributingOrder(order)} className="bg-amber-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold shadow-md hover:bg-amber-600">Distribuir</button>)}</div></td></tr>
                          
                          {isExpanded && (
                            <tr className="bg-slate-50/80 animate-in fade-in slide-in-from-top-1 duration-200">
                              <td colSpan={5} className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                  <div>
                                    <h4 className="text-xs font-bold text-indigo-700 uppercase mb-4 flex items-center gap-2"><Layers size={14}/> Detalhes do Corte</h4>
                                    <div className="space-y-3">
                                      {order.items.map((item, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                          <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-slate-800 text-sm">{item.referenceCode} - {item.color}</span>
                                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">{item.fabricName}</span>
                                          </div>
                                          <div className="flex gap-1.5 flex-wrap">
                                            {Object.entries(item.sizes).map(([s, q]) => (q || 0) > 0 ? (
                                              <span key={s} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md border border-indigo-100 font-bold">{s}: {q}</span>
                                            ) : null)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-amber-600 uppercase mb-4 flex items-center gap-2"><Shirt size={14}/> Lotes em Costura</h4>
                                    {(order.splits || []).length > 0 ? (
                                      <div className="space-y-3">
                                        {order.splits.map(split => (
                                          <div key={split.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex justify-between items-center mb-1">
                                              <span className="font-bold text-slate-800 text-xs">{split.seamstressName}</span>
                                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${split.status === OrderStatus.FINISHED ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{split.status}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mb-2">Envio: {new Date(split.createdAt).toLocaleString()}</div>
                                            {split.status === OrderStatus.SEWING && (
                                              <button onClick={() => handleFinishSplit(order.id, split.id)} className="w-full py-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold border border-emerald-100 transition-colors">Confirmar Recebimento</button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-10 text-slate-400 bg-white rounded-xl border-2 border-dashed border-slate-100"><p className="text-xs italic">Nenhum lote distribuído.</p></div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ); 
                    })}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'fabrics' && (
             <div className="space-y-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-center flex-wrap">
                   <div className="flex-1 min-w-[200px]">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Filtrar Tecido</label>
                      <input type="text" placeholder="Nome do tecido..." className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 outline-none text-sm" value={fabricFilters.name} onChange={e => setFabricFilters({...fabricFilters, name: e.target.value})}/>
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                   {fabrics.filter(f => f.name.toLowerCase().includes(fabricFilters.name.toLowerCase())).map(fabric => (
                      <div key={fabric.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative group hover:shadow-md transition-all">
                         <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setFabricToEdit(fabric); setFabricEntryMode(true); setIsFabricModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 bg-white rounded-lg shadow-sm border border-slate-200"><Plus size={16}/></button>
                            <button onClick={() => { setFabricToEdit(fabric); setFabricEntryMode(false); setIsFabricModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 p-1.5 bg-white rounded-lg shadow-sm border border-slate-200"><Edit2 size={16}/></button>
                         </div>
                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full border border-slate-100 shadow-inner" style={{backgroundColor: fabric.colorHex}}></div>
                            <div>
                               <h3 className="font-bold text-slate-800 text-sm">{fabric.name}</h3>
                               <p className="text-[10px] text-slate-500 uppercase font-bold">{fabric.color}</p>
                            </div>
                         </div>
                         <div className="bg-slate-50 rounded-xl p-3 text-center">
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Disponível</p>
                            <p className="text-2xl font-black text-indigo-600">{fabric.stockRolls.toFixed(1)} <span className="text-xs font-normal">rolos</span></p>
                         </div>
                         {fabric.notes && <p className="mt-4 text-[10px] text-slate-400 italic">Obs: {fabric.notes}</p>}
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'reports' && (
             <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                   <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">De:</label><input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs" value={reportFilters.startDate} onChange={e => setReportFilters({...reportFilters, startDate: e.target.value})}/></div>
                   <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Até:</label><input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs" value={reportFilters.endDate} onChange={e => setReportFilters({...reportFilters, endDate: e.target.value})}/></div>
                   <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Tecido:</label>
                      <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white" value={reportFilters.fabric} onChange={e => setReportFilters({...reportFilters, fabric: e.target.value})}>
                         <option value="">Todos</option>
                         {Array.from(new Set(fabrics.map(f => f.name))).map(name => <option key={name} value={name}>{name}</option>)}
                      </select>
                   </div>
                   <div className="lg:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Costureira (Banco):</label>
                      <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white" value={reportFilters.seamstressId} onChange={e => setReportFilters({...reportFilters, seamstressId: e.target.value})}>
                         <option value="">Todas</option>
                         {seamstresses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                   </div>
                   <div className="lg:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Referência (Digitar):</label>
                      <input 
                        type="text" 
                        placeholder="Ex: REF-001" 
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs" 
                        value={reportFilters.reference} 
                        onChange={e => setReportFilters({...reportFilters, reference: e.target.value})}
                      />
                   </div>
                   <div className="flex items-end"><button onClick={() => setReportFilters({startDate: '', endDate: '', fabric: '', seamstressId: '', reference: ''})} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-lg text-xs font-bold">Limpar Filtros</button></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                   <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg"><p className="text-xs font-medium opacity-80 uppercase tracking-widest">Peças Cortadas</p><h3 className="text-3xl font-black mt-1">{reportMetrics.totalCut} pçs</h3></div>
                   <div className="bg-emerald-500 p-6 rounded-2xl text-white shadow-lg"><p className="text-xs font-medium opacity-80 uppercase tracking-widest">Peças Prontas</p><h3 className="text-3xl font-black mt-1">{reportMetrics.totalSewn} pçs</h3></div>
                   <div className="bg-amber-500 p-6 rounded-2xl text-white shadow-lg"><p className="text-xs font-medium opacity-80 uppercase tracking-widest">Consumo Total</p><h3 className="text-3xl font-black mt-1">{reportMetrics.totalRolls.toFixed(1)} rolos</h3></div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                   <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                          <th className="p-4 w-10"></th>
                          <th className="p-4">Pedido</th>
                          <th className="p-4">Referências</th>
                          <th className="p-4">Tecido</th>
                          <th className="p-4 text-center">Peças</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {reportFilteredOrders.map(o => {
                          const isExpanded = expandedReportOrders.includes(o.id);
                          return (
                            <React.Fragment key={o.id}>
                              <tr className={`hover:bg-slate-50 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`} onClick={() => setExpandedReportOrders(prev => prev.includes(o.id) ? prev.filter(id => id !== o.id) : [...prev, o.id])}>
                                <td className="p-4 text-center text-slate-400">
                                  {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                </td>
                                <td className="p-4 font-bold">#{o.id}</td>
                                <td className="p-4">{o.referenceCode}</td>
                                <td className="p-4">{o.fabric}</td>
                                <td className="p-4 text-center font-bold">{o.items.reduce((acc, i) => acc + (i.actualPieces || 0), 0)}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.status === OrderStatus.FINISHED ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                    {o.status}
                                  </span>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-slate-50/50">
                                  <td colSpan={6} className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                      <div>
                                        <h4 className="text-[10px] font-bold text-indigo-600 uppercase mb-3 flex items-center gap-2">
                                          <Layers size={14}/> Detalhamento de Cores e Tamanhos
                                        </h4>
                                        <div className="space-y-2">
                                          {o.items.map((item, idx) => (
                                            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                              <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-slate-700 text-xs">{item.color}</span>
                                                <span className="text-[10px] font-bold text-slate-400">{item.actualPieces} pçs</span>
                                              </div>
                                              <div className="flex gap-1.5 flex-wrap">
                                                {Object.entries(item.sizes).map(([s, q]) => (q || 0) > 0 ? (
                                                  <span key={s} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                                                    {s}: {q}
                                                  </span>
                                                ) : null)}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="text-[10px] font-bold text-amber-600 uppercase mb-3 flex items-center gap-2">
                                          <Clock size={14}/> Rastreio de Entregas por Profissional
                                        </h4>
                                        <div className="space-y-2">
                                          {(o.splits || []).length > 0 ? o.splits.map(split => (
                                            <div key={split.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                              <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-slate-800 text-xs">{split.seamstressName}</span>
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${split.status === OrderStatus.FINISHED ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                  {split.status}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-4 text-[10px] font-medium text-slate-500">
                                                <div className="flex items-center gap-1">
                                                  <Layers size={12}/> {split.items.reduce((acc, i) => acc + i.actualPieces, 0)} pçs
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <Calendar size={12}/> 
                                                  Entrega: <span className="font-bold text-slate-700">
                                                    {split.finishedAt ? new Date(split.finishedAt).toLocaleDateString('pt-BR') : 'Pendente'}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          )) : (
                                            <p className="text-[11px] text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-lg">Aguardando distribution para costura.</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === 'products' && (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse min-w-[600px]">
                   <thead><tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-semibold"><th className="p-4">Código</th><th className="p-4">Descrição / Peça</th><th className="p-4">Tecido Padrão</th><th className="p-4 text-right">Ações</th></tr></thead>
                   <tbody className="divide-y divide-slate-100 text-sm text-slate-700">{references.map(ref => (<tr key={ref.id} className="hover:bg-slate-50"><td className="p-4 font-bold">{ref.code}</td><td className="p-4">{ref.description}</td><td className="p-4">{ref.defaultFabric}</td><td className="p-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => { setEditingProduct(ref); setIsProductModalOpen(true); }} className="text-indigo-400 hover:text-indigo-600 p-2"><Edit2 size={16}/></button><button onClick={async () => { if(window.confirm("Excluir produto?")) { await apiFetch(`products/${ref.id}`, { method: 'DELETE' }); fetchData(); } }} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16}/></button></div></td></tr>))}</tbody>
                </table>
             </div>
          )}

          {activeTab === 'seamstresses' && (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse min-w-[600px]">
                   <thead><tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-semibold"><th className="p-4">Nome</th><th className="p-4">Celular</th><th className="p-4">Especialidade</th><th className="p-4">Status</th><th className="p-4 text-right">Ações</th></tr></thead>
                   <tbody className="divide-y divide-slate-100 text-sm text-slate-700">{seamstressData.map(s => (<tr key={s.id} className="hover:bg-slate-50"><td className="p-4 font-bold">{s.name}</td><td className="p-4">{s.phone}</td><td className="p-4 text-xs font-medium">{s.specialty}</td><td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.statusLabel === 'Costurando' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{s.statusLabel}</span></td><td className="p-4 text-right"><button onClick={() => { setSeamstressToEdit(s); setIsSeamstressModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 p-2"><Edit2 size={16}/></button></td></tr>))}</tbody>
                </table>
             </div>
          )}
        </div>
      </main>

      <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} onSave={handleCreateOrder} references={references} fabrics={fabrics} seamstresses={seamstresses} orderToEdit={orderToEdit} suggestedId={nextOrderId}/>
      <SeamstressModal isOpen={isSeamstressModalOpen} onClose={() => setIsSeamstressModalOpen(false)} onSave={handleSaveSeamstress} seamstressToEdit={seamstressToEdit}/>
      <ProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSave={handleSaveProduct} productToEdit={editingProduct} fabrics={fabrics}/>
      <FabricModal isOpen={isFabricModalOpen} onClose={() => setIsFabricModalOpen(false)} entryMode={fabricEntryMode} onSave={handleSaveFabric} fabricToEdit={fabricToEdit}/>
      <CutConfirmationModal isOpen={!!cuttingOrder} onClose={() => setCuttingOrder(null)} order={cuttingOrder} onConfirm={handleConfirmCut} fabrics={fabrics} />
      <DistributeModal isOpen={!!distributingOrder} onClose={() => setDistributingOrder(null)} order={distributingOrder} seamstresses={seamstresses} onDistribute={handleDistribute} />
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"></div>}
    </div>
  );
}
