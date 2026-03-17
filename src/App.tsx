import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Mail, Flame, MapPin, Info, ShoppingCart, X, ChevronRight, Plus, Minus, Trash2, FileText } from 'lucide-react';
import { categories, products } from './data';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CartItem {
  id: string;
  product: typeof products[0];
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
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Product selection state
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  const filteredProducts = activeCategory === 'wszystkie' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const handleProductClick = (product: typeof products[0]) => {
    setSelectedProduct(product);
    setSelectedColor(product.colors[0]);
    setQuantity(1);
  };

  const closeModal = () => {
    setSelectedProduct(null);
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
    closeModal();
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text("Zamowienie - Max-poz", 14, 22);
    
    doc.setFontSize(11);
    doc.text("Prosze o przeslanie tego pliku na adres: zamowienia@max-poz.pl", 14, 32);
    
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
      headStyles: { fillColor: [220, 38, 38] }, // Red color
    });

    doc.save('zamowienie_max_poz.pdf');
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Bar */}
      <div className="bg-slate-900 text-slate-300 py-2 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-6">
            <a href="tel:+48123456789" className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone size={16} className="text-red-500" />
              +48 123 456 789
            </a>
            <a href="mailto:zamowienia@max-poz.pl" className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail size={16} className="text-red-500" />
              zamowienia@max-poz.pl
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Info size={16} className="text-red-500" />
            <span>Zamówienia realizujemy telefonicznie i mailowo</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 text-white p-2 rounded-lg">
              <Flame size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MAX<span className="text-red-600">-POŻ</span></h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Profesjonalny Sprzęt Pożarniczy</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#katalog" className="hover:text-red-600 transition-colors">Katalog Produktów</a>
            <a href="#jak-zamowic" className="hover:text-red-600 transition-colors">Jak zamawiać?</a>
            <a href="#kontakt" className="hover:text-red-600 transition-colors">Kontakt</a>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-slate-600 hover:text-red-600 transition-colors"
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transform translate-x-1 -translate-y-1">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
          
          {/* Mobile Cart Button */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="md:hidden relative p-2 text-slate-600 hover:text-red-600 transition-colors"
          >
            <ShoppingCart size={24} />
            {cart.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transform translate-x-1 -translate-y-1">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1610212594951-897f212a4501?auto=format&fit=crop&q=80&w=2000" 
            alt="Strażacy w akcji" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
              Sprzęt, na którym możesz polegać w <span className="text-red-500">każdej akcji.</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed">
              Oferujemy najwyższej jakości wyposażenie dla jednostek OSP i PSP. 
              Doradzamy, kompletujemy zamówienia i dostarczamy sprzęt prosto do Twojej remizy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#katalog" className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30">
                Przeglądaj katalog
              </a>
              <a href="#jak-zamowic" className="inline-flex justify-center items-center px-6 py-3 border border-slate-600 text-base font-medium rounded-lg text-white hover:bg-slate-800 transition-colors">
                Zasady zamówień
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main id="katalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-slate-900 mb-4">Katalog Produktów</h3>
          <p className="text-slate-600 max-w-2xl mx-auto">Wybierz interesującą Cię kategorię. Jeśli nie widzisz produktu, którego szukasz - zadzwoń do nas, sprowadzimy go dla Ciebie.</p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                key={product.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-shadow flex flex-col"
              >
                <div className="aspect-square overflow-hidden bg-slate-100 relative">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-slate-900 shadow-sm">
                    {product.price} zł
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg text-slate-900 leading-tight">{product.name}</h4>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mb-2">SKU: {product.sku}</p>
                  <p className="text-sm text-slate-500 mb-6 flex-grow line-clamp-3">{product.description}</p>
                  <button 
                    onClick={() => handleProductClick(product)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors"
                  >
                    <ShoppingCart size={18} />
                    Wybierz opcje
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* How to order section */}
      <section id="jak-zamowic" className="bg-slate-100 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">Jak złożyć zamówienie?</h3>
            <p className="text-slate-600 max-w-2xl mx-auto">Działamy inaczej niż standardowe sklepy. Stawiamy na bezpośredni kontakt i fachowe doradztwo, dlatego zamówienia przyjmujemy tradycyjnymi kanałami.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h4 className="text-xl font-bold mb-3">Skompletuj koszyk</h4>
              <p className="text-slate-600">Wybierz produkty, określ ich ilość oraz kolor i dodaj je do koszyka.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center relative">
              <div className="hidden md:block absolute top-1/2 -left-4 w-8 h-8 text-slate-300 -translate-y-1/2">
                <ChevronRight size={32} />
              </div>
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h4 className="text-xl font-bold mb-3">Pobierz plik PDF</h4>
              <p className="text-slate-600">Kliknij "Zakup" w koszyku, aby wygenerować gotowy plik PDF z listą Twoich produktów.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center relative">
              <div className="hidden md:block absolute top-1/2 -left-4 w-8 h-8 text-slate-300 -translate-y-1/2">
                <ChevronRight size={32} />
              </div>
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h4 className="text-xl font-bold mb-3">Wyślij zamówienie</h4>
              <p className="text-slate-600">Wyślij pobrany plik PDF na nasz adres e-mail. Skontaktujemy się z Tobą w celu potwierdzenia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer id="kontakt" className="bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-red-600 text-white p-2 rounded-lg">
                <Flame size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">MAX<span className="text-red-600">-POŻ</span></h2>
              </div>
            </div>
            <p className="text-slate-400 max-w-md mb-6 leading-relaxed">
              Jesteśmy zaufanym dostawcą sprzętu pożarniczego, BHP i ratowniczego. 
              Naszą misją jest dostarczanie niezawodnego wyposażenia dla tych, którzy na co dzień ratują życie i mienie.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Kontakt</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={20} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <a href="tel:+48123456789" className="hover:text-white transition-colors block">+48 123 456 789</a>
                  <span className="text-sm text-slate-500">Pon - Pt: 8:00 - 16:00</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={20} className="text-red-500 shrink-0 mt-0.5" />
                <a href="mailto:zamowienia@max-poz.pl" className="hover:text-white transition-colors">zamowienia@max-poz.pl</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Dane firmy</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-red-500 shrink-0 mt-0.5" />
                <span>
                  Max-poż Sp. z o.o.<br />
                  ul. Strażacka 998<br />
                  00-000 Warszawa
                </span>
              </li>
              <li className="text-sm text-slate-500 mt-4">
                NIP: 123-456-78-90<br />
                REGON: 123456789
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-800 text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} Max-poż. Wszelkie prawa zastrzeżone.</p>
          <p className="mt-2 md:mt-0">Ceny podane na stronie mają charakter orientacyjny.</p>
        </div>
      </footer>

      {/* Product Selection Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors z-10"
              >
                <X size={20} />
              </button>
              
              <div className="p-8 overflow-y-auto">
                <div className="flex gap-4 mb-6">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">{selectedProduct.name}</h3>
                    <p className="text-sm font-mono text-slate-500 mb-2">SKU: {selectedProduct.sku}</p>
                    <p className="font-bold text-red-600">{selectedProduct.price} zł</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Wybierz kolor</label>
                    <select 
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none bg-white"
                    >
                      {selectedProduct.colors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Ilość</label>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-slate-600"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-slate-600"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={addToCart}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold transition-colors mt-4"
                  >
                    <ShoppingCart size={20} />
                    Dodaj do koszyka
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Slide-over */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            />
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="pointer-events-auto w-screen max-w-md"
              >
                <div className="flex h-full flex-col bg-white shadow-xl">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <ShoppingCart size={24} className="text-red-600" />
                      Koszyk ({cart.length})
                    </h2>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                        <ShoppingCart size={48} className="text-slate-300" />
                        <p>Twój koszyk jest pusty</p>
                        <button 
                          onClick={() => setIsCartOpen(false)}
                          className="text-red-600 font-medium hover:underline"
                        >
                          Wróć do katalogu
                        </button>
                      </div>
                    ) : (
                      <ul className="space-y-6">
                        {cart.map((item) => (
                          <li key={item.id} className="flex py-2">
                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-slate-200">
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="h-full w-full object-cover object-center"
                              />
                            </div>

                            <div className="ml-4 flex flex-1 flex-col">
                              <div>
                                <div className="flex justify-between text-base font-medium text-slate-900">
                                  <h3 className="line-clamp-2 text-sm">{item.product.name}</h3>
                                  <p className="ml-4 whitespace-nowrap">{item.product.price * item.quantity} zł</p>
                                </div>
                                <p className="mt-1 text-xs font-mono text-slate-500">SKU: {item.product.sku}</p>
                                <p className="mt-1 text-sm text-slate-500">Kolor: {item.color}</p>
                              </div>
                              <div className="flex flex-1 items-end justify-between text-sm">
                                <div className="flex items-center border border-slate-200 rounded-md">
                                  <button 
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="px-2 py-1 text-slate-500 hover:bg-slate-100"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="px-2 font-medium">{item.quantity}</span>
                                  <button 
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="px-2 py-1 text-slate-500 hover:bg-slate-100"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.id)}
                                  className="font-medium text-red-600 hover:text-red-500 flex items-center gap-1"
                                >
                                  <Trash2 size={16} />
                                  <span className="sr-only">Usuń</span>
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="border-t border-slate-200 px-6 py-6 bg-slate-50">
                      <div className="flex justify-between text-base font-bold text-slate-900 mb-4">
                        <p>Suma orientacyjna</p>
                        <p>{cartTotal} zł</p>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500 mb-6">
                        Ostateczna cena oraz koszty dostawy zostaną potwierdzone po przesłaniu zamówienia.
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={generatePDF}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-slate-900 px-6 py-4 text-base font-medium text-white shadow-sm hover:bg-red-600 transition-colors"
                        >
                          <FileText size={20} />
                          Zakup (Generuj PDF)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
