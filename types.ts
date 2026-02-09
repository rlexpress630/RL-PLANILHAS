
export interface DeliveryData {
  id: number;
  date: string;
  collection: string;
  destination: string;
  total: string;
  observation: string;
}

export interface CostData {
  id: number;
  date: string;
  description: string;
  total: string;
  observation?: string;
}

export interface ExtractedDeliveryData {
  date: string;
  collection: string;
  destination: string;
  total: string;
  observation: string;
}