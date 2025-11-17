import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Package, Users, Layers, RefreshCw } from "lucide-react";

interface InventoryLayoutProps {
  children?: ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function InventoryLayout({
  children,
  currentTab,
  onTabChange,
}: InventoryLayoutProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#222B2D] dark:text-white">Inventory & Supplier Management</h1>
        <p className="text-[#222B2D]/60 dark:text-white/60 mt-2">
          Manage products, suppliers, stock levels, and reorder processing
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="products" className="gap-2">
            <Package className="size-4" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-2">
            <Layers className="size-4" />
            <span className="hidden sm:inline">Stock Levels</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Users className="size-4" />
            <span className="hidden sm:inline">Suppliers</span>
          </TabsTrigger>
          <TabsTrigger value="reorder" className="gap-2">
            <RefreshCw className="size-4" />
            <span className="hidden sm:inline">Reorder</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={currentTab} className="mt-6">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}
