import { Shield, Droplet, Wrench, Flame, Truck } from 'lucide-react';

export const categories = [
  { id: 'wszystkie', name: 'Wszystkie produkty', icon: Flame },
  { id: 'ubrania', name: 'Ubrania Specjalne', icon: Shield },
  { id: 'buty', name: 'Obuwie Strażackie', icon: Truck },
  { id: 'armatura', name: 'Armatura Wodna', icon: Droplet },
  { id: 'sprzet', name: 'Sprzęt Ratowniczy', icon: Wrench },
];

export const products = [
  { 
    id: 1, 
    sku: 'ROS-HEROS-01',
    name: 'Hełm Strażacki Rosenbauer HEROS Titan', 
    category: 'ubrania', 
    price: 1850, 
    image: 'https://images.unsplash.com/photo-1585552592315-911e25e98218?auto=format&fit=crop&q=80&w=600&h=600', 
    description: 'Najwyższej klasy hełm strażacki zapewniający maksymalne bezpieczeństwo. Odporny na ekstremalne temperatury i uderzenia.',
    colors: ['Czerwony', 'Żółty', 'Biały', 'Czarny', 'Fluorescencyjny']
  },
  { 
    id: 2, 
    sku: 'UBR-SX4-03',
    name: 'Ubranie Specjalne SX4 (3-częściowe)', 
    category: 'ubrania', 
    price: 3200, 
    image: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&q=80&w=600&h=600', 
    description: 'Trzyczęściowe ubranie specjalne spełniające najnowsze normy OPZ. Zapewnia doskonałą ochronę termiczną i swobodę ruchów.',
    colors: ['Piaskowy', 'Granatowy']
  },
  { 
    id: 3, 
    sku: 'BUT-HAIX-FE',
    name: 'Buty Strażackie Haix Fire Eagle', 
    category: 'buty', 
    price: 1450, 
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600&h=600', 
    description: 'Lekkie, sportowe i niezwykle wytrzymałe buty strażackie z membraną CROSSTECH.',
    colors: ['Czarny z żółtymi elementami']
  },
  { 
    id: 4, 
    sku: 'PRAD-TURB-52',
    name: 'Prądownica Turbo 52', 
    category: 'armatura', 
    price: 850, 
    image: 'https://images.unsplash.com/photo-1584839889476-18e388151213?auto=format&fit=crop&q=80&w=600&h=600', 
    description: 'Prądownica wodno-pianowa z regulacją wydajności i kształtu strumienia. Niezawodna podczas pożarów wewnętrznych.',
    colors: ['Srebrny/Czerwony']
  },
  { 
    id: 5, 
    sku: 'WAZ-W52-20',
    name: 'Wąż Tłoczny W-52/20', 
    category: 'armatura', 
    price: 220, 
    image: 'https://images.unsplash.com/photo-1517594422361-5e1f087a0422?auto=format&fit=crop&q=80&w=600&h=600', 
    description: 'Wąż tłoczny do motopomp i autopomp, długość 20m. Posiada świadectwo CNBOP.',
    colors: ['Biały', 'Czerwony', 'Żółty fluorescencyjny']
  },
  { 
    id: 6, 
    sku: 'TOP-CIEZ-01',
    name: 'Topór Strażacki Ciężki', 
    category: 'sprzet', 
    price: 180, 
    image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&q=80&w=600&h=600', 
    description: 'Tradycyjny topór strażacki z rękojeścią kompozytową. Niezbędny podczas prac wyburzeniowych.',
    colors: ['Czerwony', 'Żółty']
  },
  { 
    id: 7, 
    sku: 'KAM-FLIR-K55',
    name: 'Kamera Termowizyjna FLIR K55', 
    category: 'sprzet', 
    price: 12500, 
    image: 'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&q=80&w=600&h=600', 
    description: 'Zaawansowana kamera termowizyjna z funkcją FSX, ułatwiająca nawigację w zadymionych pomieszczeniach.',
    colors: ['Czarny']
  },
  { 
    id: 8, 
    sku: 'REK-HOLIK-01',
    name: 'Rękawice Strażackie Holik', 
    category: 'ubrania', 
    price: 350, 
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600&h=600', 
    description: 'Skórzane rękawice do ratownictwa technicznego i walki z pożarami. Wysoka odporność na przecięcia.',
    colors: ['Beżowy', 'Czarny', 'Granatowy']
  }
];
