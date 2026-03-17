import { Shield, Droplet, Wrench, Flame, Truck } from 'lucide-react';

export const categories = [
  { id: 'wszystkie', name: 'Wszystkie produkty', icon: Flame },
  { id: 'ubrania', name: 'Ubrania Specjalne', icon: Shield },
  { id: 'buty', name: 'Obuwie Strażackie', icon: Truck },
  { id: 'armatura', name: 'Armatura Wodna', icon: Droplet },
  { id: 'sprzet', name: 'Sprzęt Ratowniczy', icon: Wrench },
];

export interface Product {
  id: number | string;
  sku: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  colors: string[];
}
