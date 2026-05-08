import { getAllProducts } from '@/lib/products';
import InventoryTable from '@/components/admin/InventoryTable';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const products = await getAllProducts();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black uppercase tracking-tighter italic">
          Inventory Control
        </h1>
        <p className="text-sm font-mono opacity-50 mt-1 uppercase">
          Real-time stock management and product visibility
        </p>
      </div>

      <InventoryTable initialProducts={products} />
    </div>
  );
}
