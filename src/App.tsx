import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Mail, Flame, MapPin, Info, ShoppingCart, X, ChevronRight, Plus, Minus, Trash2, FileText, Settings, Upload } from 'lucide-react';
import { categories } from './data';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  colors: string[];
  promotion?: boolean;
  gallery?: string[];
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  color: string;
}

const removePolishDiacritics = (str: string) => {
  const diacriticsMap: { [key: string]: string } = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
  };
  return str.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, match => diacriticsMap[match] || match);
};

export default function App() {
  const [activeCategory, setActiveCategory] = useState('wszystkie');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // States
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const fetchProducts = async () => {
    try {
      // Dodajemy unikalny stempel czasowy, aby obejść buforowanie (cache) w przeglądarce
      const response = await fetch(`/api/products?t=${Date.now()}`);
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Błąd ładowania produktów:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdminLogin = () => {
    const pass = prompt("Podaj hasło administratora:");
    if (pass === "admin123") {
      setIsAdminMode(true);
    }
  };

  const deleteProduct = async (category: string, id: number) => {
    if (confirm("Usunąć produkt?")) {
      try {
        const response = await fetch(`/api/products/${category}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Błąd serwera: ${response.status}`);
        }
        fetchProducts();
      } catch (err: any) {
        console.error("Błąd usuwania:", err);
        alert(`Nie udało się usunąć produktu.\nSzczegóły: ${err.message}`);
      }
    }
  };

  const openAddModal = () => {
    setEditingProduct({ sku: '', name: '', category: 'ubrania', price: 0, image: '', description: '', colors: [], promotion: false, gallery: [] });
    setIsEditModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    const isNew = !editingProduct.id;
    const url = isNew ? '/api/products' : `/api/products/${editingProduct.category}/${editingProduct.id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Błąd serwera: ${response.status}`);
      }
      
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error("Błąd zapisu:", err);
      alert(`Nie udało się zapisać produktu.\nSzczegóły: ${err.message}`);
    }
  };

  // Funkcja obsługująca zmianę pliku / upuszczenie zdjęcia
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Plik jest za duży (max 10MB)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageBase64: base64String,
            filename: file.name
          })
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Funkcja zapisywania obrazów nie jest jeszcze aktywna na serwerze (błąd 404).\n\nZRESTARTUJ SERWER w terminalu, aby załadować nowe zmiany:\n1. Kliknij w terminal\n2. Wciśnij Ctrl+C\n3. Wpisz i uruchom: npm run dev`);
          }
          const errData = await response.text();
          throw new Error(`Błąd serwera (${response.status}): ${errData}`);
        }
        
        const data = await response.json();
        if (editingProduct) {
          setEditingProduct({ ...editingProduct, image: data.imageUrl });
        }
      } catch (err: any) {
        console.error(err);
        alert(`Błąd podczas przesyłania obrazu. Spróbuj ponownie.\n\nSzczegóły: ${err.message}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Funkcja wgrywająca dodatkowe zdjęcia poglądowe (do galerii)
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentGallery = editingProduct?.gallery || [];
    if (currentGallery.length + files.length > 5) {
      alert("Możesz dodać maksymalnie 5 zdjęć poglądowych.");
      return;
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) continue; // Pomiń pliki > 10MB
      
      try {
        const reader = new FileReader();
        const base64String = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64String, filename: file.name })
        });
        
        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.imageUrl);
        }
      } catch (err) {
        console.error("Błąd przesyłania zdjęcia do galerii", err);
      }
    }

    if (editingProduct && uploadedUrls.length > 0) {
      setEditingProduct(prev => prev ? { ...prev, gallery: [...(prev.gallery || []), ...uploadedUrls] } : prev);
    }
  };

  const filteredProducts = activeCategory === 'wszystkie' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setActiveImage(product.image); // Ustaw główne zdjęcie na start w widoku produktu
    setSelectedColor(product.colors[0]);
    setQuantity(1);
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    const newItem: CartItem = {
      id: `${selectedProduct.id}-${selectedColor}-${Date.now()}`,
      product: selectedProduct,
      quantity,
      color: selectedColor
    };
    setCart(prev => [...prev, newItem]);
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Zamowienie - Max-poz", 14, 22);
    const tableData = cart.map((item, index) => [
      (index + 1).toString(),
      item.product.sku,
      removePolishDiacritics(item.product.name),
      removePolishDiacritics(item.color),
      item.quantity.toString()
    ]);
    autoTable(doc, {
      startY: 40,
      head: [['Lp.', 'Kod (SKU)', 'Nazwa produktu', 'Kolor', 'Ilosc']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] },
    });
    doc.save('zamowienie_max_poz.pdf');
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Pasek Admina - pojawia się tylko po zalogowaniu */}
      {isAdminMode && (
        <div className="bg-red-700 text-white py-2 px-4 sticky top-0 z-[60] flex justify-between items-center shadow-lg">
          <span className="flex items-center gap-2 font-bold"><Settings size={18}/> PANEL ADMINISTRATORA</span>
          <button onClick={() => setIsAdminMode(false)} className="bg-white text-red-700 px-3 py-1 rounded text-sm font-bold">Wyjdź</button>
        </div>
      )}

{/* SEKCJA ZARZĄDZANIA PRODUKTAMI (Tylko dla Admina) */}
{isAdminMode && (
  <div className="max-w-7xl mx-auto px-4 py-8 bg-white shadow-xl my-8 rounded-2xl border-2 border-red-600">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-slate-900">Zarządzanie Bazą Produktów</h2>
      <button 
        onClick={openAddModal}
        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
      >
        <Plus size={18} /> Dodaj nowy produkt
      </button>
    </div>

    {/* Tabele z podziałem na kategorie */}
    {['ubrania', 'buty', 'armatura', 'sprzet'].map(catName => (
      <div key={catName} className="mb-10">
        <h3 className="text-lg font-bold uppercase text-red-600 border-b-2 border-red-100 mb-4 pb-1">
          Kategoria: {catName}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Nazwa</th>
                <th className="px-4 py-3">Cena</th>
                <th className="px-4 py-3 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.filter(p => p.category === catName).map(product => (
                <tr key={`${product.category}-${product.id}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3">
                    {product.promotion ? (
                      <span className="text-red-600 font-bold flex items-center gap-1"><Flame size={14} className="animate-pulse fill-red-600" /> {product.price} zł</span>
                    ) : (
                      `${product.price} zł`
                    )}
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => openEditModal(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      <Settings size={16} />
                    </button>
                    <button 
                      onClick={() => deleteProduct(product.category, product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ))}
  </div>
)}

      {/* Oryginalny Top Bar */}
      <div className="bg-slate-900 text-slate-300 py-2 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-6">
            <a href="tel:+48123456789" className="flex items-center gap-2 hover:text-white transition-colors"><Phone size={16} className="text-red-500" /> +48 123 456 789</a>
            <a href="mailto:zamowienia@max-poz.pl" className="flex items-center gap-2 hover:text-white transition-colors"><Mail size={16} className="text-red-500" /> zamowienia@max-poz.pl</a>
          </div>
          <div className="flex items-center gap-2"><Info size={16} className="text-red-500" /><span>Zamówienia realizujemy telefonicznie i mailowo</span></div>
        </div>
      </div>

      {/* Oryginalny Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 text-white p-2 rounded-lg"><Flame size={28} /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MAX<span className="text-red-600">-POŻ</span></h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Profesjonalny Sprzęt Pożarniczy</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#katalog" className="hover:text-red-600 transition-colors">Katalog Produktów</a>
            <a href="#jak-zamowic" className="hover:text-red-600 transition-colors">Jak zamawiać?</a>
            <a href="#kontakt" className="hover:text-red-600 transition-colors">Kontakt</a>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-slate-600 hover:text-red-600 transition-colors">
              <ShoppingCart size={24} />
              {cart.length > 0 && <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transform translate-x-1 -translate-y-1">{cart.length}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Oryginalny Hero Section */}
      <section className="relative bg-slate-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1610212594951-897f212a4501?auto=format&fit=crop&q=80&w=2000" alt="Strażacy" className="w-full h-full object-cover opacity-30"/>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 lg:py-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">Sprzęt, na którym możesz polegać w <span className="text-red-500">każdej akcji.</span></h2>
            <p className="text-lg text-slate-300 mb-10">Oferujemy najwyższej jakości wyposażenie dla jednostek OSP i PSP. Doradzamy i dostarczamy sprzęt prosto do Twojej remizy.</p>
            <div className="flex gap-4">
              <a href="#katalog" className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors">Przeglądaj katalog</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Katalog */}
      <main id="katalog" className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Katalog Produktów</h3>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {categories.map((category) => (
              <button key={category.id} onClick={() => setActiveCategory(category.id)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === category.id ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border'}`}>{category.name}</button>
            ))}
          </div>
        </div>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div layout key={`${product.category}-${product.id}`} className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col group">
                <div className="aspect-square relative overflow-hidden bg-slate-100">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className={`absolute top-3 right-3 bg-white/95 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-sm ${product.promotion ? 'text-red-600' : 'text-slate-900'}`}>
                    {product.promotion && <Flame size={14} className="animate-pulse fill-red-600" />}
                    {product.price} zł
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h4 className="font-bold text-lg mb-1">{product.name}</h4>
                  <p className="text-xs text-slate-400 font-mono mb-2">SKU: {product.sku}</p>
                  <p className="text-sm text-slate-500 mb-6 line-clamp-2">{product.description}</p>
                  
                  {isAdminMode ? (
                    <div className="mt-auto flex gap-2">
                      <button onClick={() => openEditModal(product)} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm">Edytuj</button>
                      <button onClick={() => deleteProduct(product.category, product.id)} className="bg-red-100 text-red-600 p-2 rounded-xl"><Trash2 size={18}/></button>
                    </div>
                  ) : (
                    <button onClick={() => handleProductClick(product)} className="w-full mt-auto bg-slate-900 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                      <ShoppingCart size={18} /> Wybierz opcje
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Oryginalna sekcja "Jak zamówić" */}
      <section id="jak-zamowic" className="bg-slate-100 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-12">Jak złożyć zamówienie?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 font-bold">1</div>
              <h4 className="font-bold mb-2">Skompletuj koszyk</h4>
              <p className="text-slate-600 text-sm">Wybierz produkty i dodaj je do koszyka.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 font-bold">2</div>
              <h4 className="font-bold mb-2">Pobierz PDF</h4>
              <p className="text-slate-600 text-sm">Wygeneruj listę produktów w formacie PDF.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 font-bold">3</div>
              <h4 className="font-bold mb-2">Wyślij e-mail</h4>
              <p className="text-slate-600 text-sm">Wyślij plik na nasz adres, aby sfinalizować zamówienie.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Oryginalny Footer */}
      <footer id="kontakt" className="bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12 text-sm">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-6 text-white font-bold text-xl"><Flame className="text-red-600" /> MAX-POŻ</div>
            <p className="text-slate-400 max-w-sm">Jesteśmy dostawcą sprzętu pożarniczego, BHP i ratowniczego dla jednostek OSP i PSP.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">KONTAKT</h4>
            <p>+48 123 456 789</p>
            <p>zamowienia@max-poz.pl</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">DANE FIRMY</h4>
            <p>ul. Strażacka 998</p>
            <p>00-000 Warszawa</p>
            <button onClick={handleAdminLogin} className="mt-8 opacity-20 hover:opacity-100 text-[10px]">PANEL PRACOWNIKA</button>
          </div>
        </div>
      </footer>

      {/* Modal wyboru opcji produktu */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedProduct(null)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-3xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row max-h-[90vh]">
              {/* Lewa strona: Zdjęcia */}
              <div className="w-full md:w-1/2 bg-slate-50 p-6 flex flex-col gap-4 overflow-y-auto">
                <div className="aspect-square bg-white rounded-2xl overflow-hidden border border-slate-200">
                  <img src={activeImage} alt={selectedProduct.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button onClick={() => setActiveImage(selectedProduct.image)} className={`w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${activeImage === selectedProduct.image ? 'border-red-600' : 'border-transparent hover:border-slate-300'}`}>
                    <img src={selectedProduct.image} alt="Główne" className="w-full h-full object-cover" />
                  </button>
                  {selectedProduct.gallery?.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(img)} className={`w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${activeImage === img ? 'border-red-600' : 'border-transparent hover:border-slate-300'}`}>
                      <img src={img} alt={`Galeria ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Prawa strona: Informacje i Formularz */}
              <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-mono text-slate-400 mb-1">SKU: {selectedProduct.sku}</p>
                    <h3 className="text-2xl font-bold leading-tight mb-2">{selectedProduct.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-extrabold text-slate-900">{selectedProduct.price} zł</span>
                      {selectedProduct.promotion && (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded-md">
                          <Flame size={14} className="animate-pulse fill-red-600" /> Promocja
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-900 p-1"><X size={24} /></button>
                </div>
                
                <p className="text-slate-600 text-sm mb-8 leading-relaxed">{selectedProduct.description}</p>
                
                <div className="mt-auto">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Wybierz kolor:</label>
                    <div className="flex gap-2 flex-wrap">
                      {selectedProduct.colors.map(color => (
                        <button key={color} onClick={() => setSelectedColor(color)} className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${selectedColor === color ? 'border-red-600 text-red-600 bg-red-50' : 'border-slate-200 text-slate-600 hover:border-red-200'}`}>{color}</button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Ilość:</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-full border flex items-center justify-center text-slate-600 hover:bg-slate-50"><Minus size={16} /></button>
                      <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-full border flex items-center justify-center text-slate-600 hover:bg-slate-50"><Plus size={16} /></button>
                    </div>
                  </div>
                  <button onClick={addToCart} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-red-600/20">Dodaj do koszyka - {(selectedProduct.price * quantity).toFixed(2)} zł</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Koszyk (Sidebar) */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="text-red-600" /> Twój Koszyk</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center text-slate-500 mt-10"><ShoppingCart size={48} className="mx-auto mb-4 opacity-20" /><p>Twój koszyk jest pusty</p></div>
                ) : (
                  <div className="space-y-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-4 bg-slate-50 p-4 rounded-2xl">
                        <img src={item.product.image} alt={item.product.name} className="w-20 h-20 object-cover rounded-xl bg-white" />
                        <div className="flex-1">
                          <h4 className="font-bold text-sm leading-tight mb-1">{item.product.name}</h4>
                          <p className="text-xs text-slate-500 mb-2">Kolor: {item.color}</p>
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-red-600">{item.product.price} zł</p>
                            <div className="flex items-center gap-2"><span className="text-sm font-medium">Ilość: {item.quantity}</span><button onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {cart.length > 0 && (
                <div className="p-6 bg-slate-50 border-t"><div className="flex justify-between items-center mb-6"><span className="text-slate-600 font-medium">Suma częściowa</span><span className="text-2xl font-bold">{cartTotal.toFixed(2)} zł</span></div><button onClick={generatePDF} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"><FileText size={20} /> Generuj PDF z zamówieniem</button><p className="text-xs text-center text-slate-500 mt-4">Wygenerowany plik PDF wyślij na adres: <a href="mailto:zamowienia@max-poz.pl" className="text-red-600 font-medium">zamowienia@max-poz.pl</a></p></div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Edycji/Dodawania Produktów dla Admina */}
      <AnimatePresence>
        {isAdminMode && isEditModalOpen && editingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{editingProduct.id ? 'Edytuj Produkt' : 'Dodaj Nowy Produkt'}</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveProduct} className="space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Nazwa</label>
                    <input required type="text" value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="mt-1 w-full border rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">SKU</label>
                    <input required type="text" value={editingProduct.sku || ''} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} className="mt-1 w-full border rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Kategoria</label>
                    <select required disabled={!!editingProduct.id} value={editingProduct.category || 'ubrania'} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="mt-1 w-full border rounded-lg p-2 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed" title={!!editingProduct.id ? "Nie można zmienić kategorii zapisanego produktu" : ""}>
                      <option value="ubrania">Ubrania</option>
                      <option value="buty">Buty</option>
                      <option value="armatura">Armatura</option>
                      <option value="sprzet">Sprzęt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Cena (zł)</label>
                    <input required type="number" step="0.01" value={editingProduct.price || 0} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="mt-1 w-full border rounded-lg p-2" />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!editingProduct.promotion} onChange={e => setEditingProduct({...editingProduct, promotion: e.target.checked})} className="w-5 h-5 accent-red-600 rounded cursor-pointer" />
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-1">Produkt w Promocji <Flame size={16} className="text-red-600 fill-red-600" /></span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Zdjęcie produktu</label>
                  <div className="flex items-center gap-4 mt-1">
                    {editingProduct.image && (
                      <div className="w-20 h-20 shrink-0 bg-slate-100 rounded-lg border overflow-hidden relative">
                        <img src={editingProduct.image} alt="Podgląd" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="relative flex-1 border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-slate-50 hover:border-red-300 transition-colors">
                      <Upload size={24} className="text-slate-400 mb-2" />
                      <span className="text-sm text-slate-600 font-medium text-center">Przeciągnij zdjęcie tutaj<br/>lub kliknij, aby wybrać z dysku</span>
                      <input required={!editingProduct.image} type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Wybierz plik obrazu" />
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Zdjęcia poglądowe do galerii (max 5)</label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {editingProduct.gallery?.map((img, i) => (
                      <div key={i} className="w-20 h-20 shrink-0 bg-slate-100 rounded-lg border overflow-hidden relative group">
                        <img src={img} alt={`Galeria ${i}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setEditingProduct({...editingProduct, gallery: editingProduct.gallery?.filter((_, idx) => idx !== i)})} className="absolute inset-0 bg-red-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
                      </div>
                    ))}
                    {(editingProduct.gallery?.length || 0) < 5 && (
                      <div className="w-20 h-20 shrink-0 relative border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center hover:bg-slate-50 hover:border-red-300 transition-colors cursor-pointer" title="Wybierz dodatkowe pliki">
                        <Plus size={24} className="text-slate-400" />
                        <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Opis</label>
                  <textarea required rows={3} value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="mt-1 w-full border rounded-lg p-2"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Kolory (po przecinku)</label>
                  <input type="text" value={editingProduct.colors?.join(', ') || ''} onChange={e => setEditingProduct({...editingProduct, colors: e.target.value.split(',').map(c => c.trim()).filter(Boolean)})} className="mt-1 w-full border rounded-lg p-2" placeholder="np. Czerwony, Czarny" />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded-lg text-slate-600 font-medium hover:bg-slate-50">Anuluj</button>
                  <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">Zapisz produkt</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}