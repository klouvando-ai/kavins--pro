
export enum OrderStatus {
  PLANNED = 'Planejado',
  CUTTING = 'Em Corte',
  SEWING = 'Na Costura',
  FINISHED = 'Finalizado',
}

export type GridType = 'STANDARD' | 'PLUS' | 'CUSTOM';

export interface SizeDistribution {
  P?: number;
  M?: number;
  G?: number;
  GG?: number;
  G1?: number;
  G2?: number;
  G3?: number;
  [key: string]: number | undefined;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductReference {
  id: string;
  code: string; 
  description: string; 
  defaultFabric: string; 
  defaultColors: ProductColor[]; 
  defaultGrid: GridType;
  estimatedPiecesPerRoll?: number;
}

export interface Seamstress {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  active: boolean;
  address?: string;
  city?: string;
}

export interface Fabric {
  id: string;
  name: string;
  color: string;
  colorHex: string;
  stockRolls: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionOrderItem {
  productId: string;
  referenceCode: string;
  color: string;
  colorHex?: string;
  rollsUsed: number;
  piecesPerSizeEst: number;
  estimatedPieces: number;
  actualPieces: number;
  sizes: SizeDistribution;
  fabricName: string; // Adicionado para rastreio de estoque por item
}

export interface OrderSplit {
  id: string;
  seamstressId: string;
  seamstressName: string;
  status: OrderStatus;
  items: ProductionOrderItem[];
  createdAt: string;
  finishedAt?: string;
}

export interface ProductionOrder {
  id: string;
  // referenceId e referenceCode agora são legados ou representam a "referência principal"
  referenceId: string;
  referenceCode: string;
  description: string;
  fabric: string;
  
  items: ProductionOrderItem[];
  activeCuttingItems: ProductionOrderItem[];
  splits: OrderSplit[];

  gridType: GridType;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
  notes?: string;
  seamstressId?: string; 
}

export interface DashboardStats {
  totalOrders: number;
  inCutting: number;
  inSewing: number;
  finished: number;
  totalPiecesProduced: number;
}
