import { useEffect, useState } from 'react'

function MenuCard({ item, onAdd }) {
  return (
    <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl overflow-hidden hover:border-blue-400/50 transition-colors">
      <div className="aspect-video bg-slate-800/50">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-blue-200/50">No image</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-white font-semibold text-lg">{item.name}</h3>
            <p className="text-blue-200/70 text-sm line-clamp-2">{item.description}</p>
          </div>
          <div className="text-blue-200 font-semibold whitespace-nowrap">${item.price?.toFixed(2)}</div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-blue-200/60 px-2 py-1 rounded-full bg-white/5 border border-white/10">{item.category}</span>
          <button onClick={() => onAdd(item)} className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors">Add</button>
        </div>
      </div>
    </div>
  )
}

function Cart({ cart, onUpdateQty, onCheckout, loading }) {
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0)
  const tax = +(subtotal * 0.08).toFixed(2)
  const total = +(subtotal + tax).toFixed(2)

  return (
    <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-4 sticky top-4">
      <h3 className="text-white font-semibold text-lg mb-2">Your Order</h3>
      {cart.length === 0 ? (
        <p className="text-blue-200/70 text-sm">No items yet.</p>
      ) : (
        <div className="space-y-3">
          {cart.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-white text-sm font-medium">{c.name}</p>
                <p className="text-blue-200/70 text-xs">${c.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onUpdateQty(c.id, Math.max(1, c.qty - 1))} className="px-2 py-1 rounded bg-white/10 text-white">-</button>
                <span className="text-white text-sm w-5 text-center">{c.qty}</span>
                <button onClick={() => onUpdateQty(c.id, c.qty + 1)} className="px-2 py-1 rounded bg-white/10 text-white">+</button>
              </div>
            </div>
          ))}
          <div className="h-px bg-white/10"></div>
          <div className="flex items-center justify-between text-blue-200 text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-blue-200 text-sm">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-white font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button disabled={loading} onClick={onCheckout} className="w-full mt-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-medium">
            {loading ? 'Placing Order...' : 'Checkout'}
          </button>
        </div>
      )}
    </div>
  )
}

function App() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [menu, setMenu] = useState([])
  const [category, setCategory] = useState('All')
  const [cart, setCart] = useState([])
  const [customer, setCustomer] = useState({ name: '', email: '', address: '' })
  const [loading, setLoading] = useState(false)

  const categories = ['All', ...Array.from(new Set(menu.map(m => m.category)))]

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/menu`)
        if (res.ok) {
          const data = await res.json()
          if (data.length === 0) {
            // Seed if empty
            await fetch(`${baseUrl}/api/menu/seed`, { method: 'POST' })
            const after = await fetch(`${baseUrl}/api/menu`)
            setMenu(await after.json())
          } else {
            setMenu(data)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [])

  const filtered = category === 'All' ? menu : menu.filter(m => m.category === category)

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === item.id)
      if (existing) return prev.map(p => p.id === item.id ? { ...p, qty: p.qty + 1 } : p)
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }]
    })
  }

  const updateQty = (id, qty) => {
    setCart(prev => prev.map(p => p.id === id ? { ...p, qty } : p))
  }

  const checkout = async () => {
    if (cart.length === 0) return alert('Add some items first')
    if (!customer.name || !customer.email || !customer.address) return alert('Enter your details')
    setLoading(true)
    try {
      const payload = {
        customer_name: customer.name,
        customer_email: customer.email,
        customer_address: customer.address,
        items: cart.map(c => ({ item_id: c.id, quantity: c.qty }))
      }
      const res = await fetch(`${baseUrl}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        const data = await res.json()
        alert(`Order placed! Total $${data.total}`)
        setCart([])
      } else {
        const err = await res.json().catch(() => ({}))
        alert(`Failed to place order: ${err.detail || res.status}`)
      }
    } catch (e) {
      alert('Network error placing order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]" />

      <header className="relative z-10 border-b border-white/10 bg-slate-900/40 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/flame-icon.svg" alt="logo" className="w-8 h-8" />
            <h1 className="text-white font-bold text-xl">Blue Flame Kitchen</h1>
          </div>
          <nav className="text-blue-200/80 text-sm hidden sm:flex gap-6">
            <button className={`hover:text-white ${category==='All'?'text-white':''}`} onClick={() => setCategory('All')}>All</button>
            {Array.from(new Set(menu.map(m => m.category))).map(cat => (
              <button key={cat} className={`hover:text-white ${category===cat?'text-white':''}`} onClick={() => setCategory(cat)}>{cat}</button>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-2xl font-semibold">Menu</h2>
            <select value={category} onChange={(e)=>setCategory(e.target.value)} className="bg-white/10 text-white border border-white/10 rounded px-3 py-2">
              <option>All</option>
              {Array.from(new Set(menu.map(m => m.category))).map(cat => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-blue-200/80">Loading menu...</div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(item => (
                <MenuCard key={item.id} item={item} onAdd={addToCart} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <Cart cart={cart} onUpdateQty={updateQty} onCheckout={checkout} loading={loading} />
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-semibold text-lg mb-3">Your Details</h3>
            <div className="space-y-3">
              <input value={customer.name} onChange={e=>setCustomer({...customer, name:e.target.value})} placeholder="Name" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10 text-white placeholder:text-blue-200/60" />
              <input value={customer.email} onChange={e=>setCustomer({...customer, email:e.target.value})} placeholder="Email" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10 text-white placeholder:text-blue-200/60" />
              <textarea value={customer.address} onChange={e=>setCustomer({...customer, address:e.target.value})} placeholder="Delivery address" rows={3} className="w-full px-3 py-2 rounded bg-white/10 border border-white/10 text-white placeholder:text-blue-200/60" />
            </div>
          </div>
        </aside>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-slate-900/40 backdrop-blur text-center text-blue-200/60 text-sm py-4">
        Fresh. Fast. Flame-cooked.
      </footer>
    </div>
  )
}

export default App
