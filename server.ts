import express from 'express';
import { createServer as createViteServer } from 'vite';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const PORT = 3000;

const initialProducts = [
  { sku: 'ROS-HEROS-01', name: 'Hełm Strażacki Rosenbauer HEROS Titan', category: 'ubrania', price: 1850, image: 'https://images.unsplash.com/photo-1585552592315-911e25e98218?auto=format&fit=crop&q=80&w=600&h=600', description: 'Najwyższej klasy hełm strażacki zapewniający maksymalne bezpieczeństwo. Odporny na ekstremalne temperatury i uderzenia.', colors: ['Czerwony', 'Żółty', 'Biały', 'Czarny', 'Fluorescencyjny'] },
  { sku: 'UBR-SX4-03', name: 'Ubranie Specjalne SX4 (3-częściowe)', category: 'ubrania', price: 3200, image: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&q=80&w=600&h=600', description: 'Trzyczęściowe ubranie specjalne spełniające najnowsze normy OPZ. Zapewnia doskonałą ochronę termiczną i swobodę ruchów.', colors: ['Piaskowy', 'Granatowy'] },
  { sku: 'BUT-HAIX-FE', name: 'Buty Strażackie Haix Fire Eagle', category: 'buty', price: 1450, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600&h=600', description: 'Lekkie, sportowe i niezwykle wytrzymałe buty strażackie z membraną CROSSTECH.', colors: ['Czarny z żółtymi elementami'] },
  { sku: 'PRAD-TURB-52', name: 'Prądownica Turbo 52', category: 'armatura', price: 850, image: 'https://images.unsplash.com/photo-1584839889476-18e388151213?auto=format&fit=crop&q=80&w=600&h=600', description: 'Prądownica wodno-pianowa z regulacją wydajności i kształtu strumienia. Niezawodna podczas pożarów wewnętrznych.', colors: ['Srebrny/Czerwony'] },
  { sku: 'WAZ-W52-20', name: 'Wąż Tłoczny W-52/20', category: 'armatura', price: 220, image: 'https://images.unsplash.com/photo-1517594422361-5e1f087a0422?auto=format&fit=crop&q=80&w=600&h=600', description: 'Wąż tłoczny do motopomp i autopomp, długość 20m. Posiada świadectwo CNBOP.', colors: ['Biały', 'Czerwony', 'Żółty fluorescencyjny'] },
  { sku: 'TOP-CIEZ-01', name: 'Topór Strażacki Ciężki', category: 'sprzet', price: 180, image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&q=80&w=600&h=600', description: 'Tradycyjny topór strażacki z rękojeścią kompozytową. Niezbędny podczas prac wyburzeniowych.', colors: ['Czerwony', 'Żółty'] },
  { sku: 'KAM-FLIR-K55', name: 'Kamera Termowizyjna FLIR K55', category: 'sprzet', price: 12500, image: 'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&q=80&w=600&h=600', description: 'Zaawansowana kamera termowizyjna z funkcją FSX, ułatwiająca nawigację w zadymionych pomieszczeniach.', colors: ['Czarny'] },
  { sku: 'REK-HOLIK-01', name: 'Rękawice Strażackie Holik', category: 'ubrania', price: 350, image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600&h=600', description: 'Skórzane rękawice do ratownictwa technicznego i walki z pożarami. Wysoka odporność na przecięcia.', colors: ['Beżowy', 'Czarny', 'Granatowy'] }
];

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize SQLite Database
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  const categories = ['ubrania', 'buty', 'armatura', 'sprzet'];
  
  for (const cat of categories) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ${cat} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT UNIQUE,
        name TEXT,
        price REAL,
        image TEXT,
        description TEXT,
        colors TEXT
      )
    `);
  }

  // Seed data if empty
  const count = await db.get('SELECT COUNT(*) as count FROM ubrania');
  if (count.count === 0) {
    for (const p of initialProducts) {
      await db.run(
        `INSERT INTO ${p.category} (sku, name, price, image, description, colors) VALUES (?, ?, ?, ?, ?, ?)`,
        [p.sku, p.name, p.price, p.image, p.description, JSON.stringify(p.colors)]
      );
    }
  }

  app.get('/api/products', async (req, res) => {
    try {
      const allProducts = [];
      for (const cat of categories) {
        const rows = await db.all(`SELECT * FROM ${cat}`);
        rows.forEach(row => {
          allProducts.push({
            ...row,
            category: cat,
            colors: JSON.parse(row.colors)
          });
        });
      }
      res.json(allProducts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/products', async (req, res) => {
    const { category, sku, name, price, image, description, colors } = req.body;
    if (!categories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    try {
      const result = await db.run(
        `INSERT INTO ${category} (sku, name, price, image, description, colors) VALUES (?, ?, ?, ?, ?, ?)`,
        [sku, name, price, image, description, JSON.stringify(colors)]
      );
      res.json({ id: result.lastID, success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to insert product. SKU might not be unique.' });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
