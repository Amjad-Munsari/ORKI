import { Link } from '@/i18n/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Sidebar */}
      <aside className="w-64 border-e-2 border-white/20 flex flex-col sticky top-0 h-screen bg-[#0a0a0a]">
        <div className="p-8 border-b-2 border-white/20">
          <Link href="/admin" className="text-2xl font-black tracking-tighter uppercase text-white">
            ORKI ADMIN
          </Link>
          <div className="text-[10px] mt-1 font-mono uppercase opacity-40 text-white">
            Internal Systems v1.0
          </div>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link 
            href="/admin/inventory" 
            className="p-3 border-2 border-transparent hover:border-white transition-all flex justify-between items-center group"
          >
            <span className="font-bold uppercase tracking-tight">Inventory</span>
            <span className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </Link>
          <Link 
            href="/admin/products" 
            className="p-3 border-2 border-transparent hover:border-white transition-all flex justify-between items-center group"
          >
            <span className="font-bold uppercase tracking-tight">Products</span>
            <span className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </Link>
          <Link 
            href="/admin/orders" 
            className="p-3 border-2 border-transparent hover:border-white/10 transition-all flex justify-between items-center group opacity-30 cursor-not-allowed"
          >
            <span className="font-bold uppercase tracking-tight">Orders</span>
            <span className="text-[8px] font-mono">PHASE 8</span>
          </Link>
        </nav>

        <div className="p-4 border-t-2 border-white/20">
          <Link 
            href="/" 
            className="p-3 border-2 border-white bg-white text-black text-center font-bold uppercase tracking-tight block hover:bg-black hover:text-white transition-colors"
          >
            Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-black">
        <header className="h-20 border-b-2 border-white/20 flex items-center justify-between px-8 sticky top-0 bg-black/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className="h-3 w-3 bg-green-500 animate-pulse border border-white/50" title="System Online" />
            <span className="text-xs font-mono uppercase tracking-widest font-bold opacity-80">Live Data Sync</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase opacity-40">Connected as</div>
              <div className="text-xs font-bold uppercase tracking-tight">Root Admin</div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
