import { useEffect, useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function ProductCard({ product, onAdd }) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col">
      <img
        src={product.image_url || `https://images.unsplash.com/photo-1520975693416-35a2c0e4c46a?q=80&w=1200&auto=format&fit=crop`}
        alt={product.title}
        className="h-40 w-full object-cover rounded-md"
      />
      <div className="mt-3">
        <h3 className="font-semibold text-gray-800">{product.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-blue-600 font-bold">${product.price?.toFixed(2)}</span>
          <button
            onClick={() => onAdd(product)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

function Cart({ items, onCheckout }) {
  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0)
  return (
    <div className="bg-white rounded-lg shadow p-4 sticky top-4">
      <h3 className="font-semibold text-gray-800 mb-2">Cart</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Your cart is empty</p>
      ) : (
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-700">{it.title} x {it.quantity}</span>
              <span className="font-medium">${(it.price * it.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <button
            onClick={() => onCheckout(subtotal)}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded py-2 mt-2"
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  )
}

export default function Store() {
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [cart, setCart] = useState([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const url = new URL(`${BACKEND_URL}/api/products`)
      if (query) url.searchParams.set('q', query)
      if (category) url.searchParams.set('category', category)
      const res = await fetch(url.toString())
      const data = await res.json()
      setProducts(data)
    } catch (e) {
      setStatus('Failed to load products')
    }
  }

  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id)
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p)
      }
      return [...prev, { id: product.id, title: product.title, price: product.price, quantity: 1 }]
    })
  }

  async function checkout(subtotal) {
    try {
      const order = {
        customer_name: 'Guest',
        customer_email: 'guest@example.com',
        customer_address: 'N/A',
        items: cart.map(c => ({ product_id: c.id || '', title: c.title, price: c.price, quantity: c.quantity })),
        subtotal,
        notes: 'Demo checkout'
      }
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      })
      if (!res.ok) throw new Error('Order failed')
      setStatus('Order placed!')
      setCart([])
    } catch (e) {
      setStatus('Checkout failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Textile Store</h1>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadProducts()}
            placeholder="Search fabric, cotton, silk..."
            className="flex-1 bg-gray-100 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setTimeout(loadProducts, 0) }}
            className="bg-gray-100 rounded px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="Fabric">Fabric</option>
            <option value="Cotton">Cotton</option>
            <option value="Silk">Silk</option>
            <option value="Wool">Wool</option>
          </select>
          <button onClick={loadProducts} className="bg-blue-600 text-white px-4 py-2 rounded">Search</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <ProductCard key={p.id} product={p} onAdd={addToCart} />
          ))}
        </div>
        <div>
          <Cart items={cart} onCheckout={checkout} />
          {status && <p className="mt-3 text-sm text-gray-700">{status}</p>}
        </div>
      </main>

      <footer className="text-center text-sm text-gray-500 py-8">© {new Date().getFullYear()} Textile Store</footer>
    </div>
  )
}
