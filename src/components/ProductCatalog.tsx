import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Search, Plus, MoreVertical, Edit, Trash2, Download } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  stock: number;
  reorderPoint: number;
  supplier: string;
}

interface ProductCatalogProps {
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onManageCategories: () => void;
}

export function ProductCatalog({
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onManageCategories,
}: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Mock data
  const products: Product[] = [
    {
      id: "1",
      name: "Smartphone Model X",
      category: "Electronics",
      sku: "ELEC-001",
      price: 15999,
      stock: 45,
      reorderPoint: 20,
      supplier: "Tech Supplies Inc.",
    },
    {
      id: "2",
      name: "Office Chair Deluxe",
      category: "Furniture",
      sku: "FURN-023",
      price: 4500,
      stock: 12,
      reorderPoint: 15,
      supplier: "Furniture Plus",
    },
    {
      id: "3",
      name: "Wireless Mouse",
      category: "Electronics",
      sku: "ELEC-045",
      price: 599,
      stock: 8,
      reorderPoint: 25,
      supplier: "Tech Supplies Inc.",
    },
    {
      id: "4",
      name: "Desk Lamp LED",
      category: "Office Supplies",
      sku: "OFF-012",
      price: 850,
      stock: 34,
      reorderPoint: 10,
      supplier: "Office Depot",
    },
    {
      id: "5",
      name: "Laptop Stand",
      category: "Electronics",
      sku: "ELEC-089",
      price: 1200,
      stock: 3,
      reorderPoint: 15,
      supplier: "Tech Supplies Inc.",
    },
  ];

  const categories = ["all", "Electronics", "Furniture", "Office Supplies"];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const isLowStock = (stock: number, reorderPoint: number) =>
    stock <= reorderPoint;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    }
  };

  const handleBulkDelete = () => {
    toast.success(`Deleted ${selectedProducts.length} products`);
    setSelectedProducts([]);
  };

  const handleBulkExport = () => {
    toast.success(`Exported ${selectedProducts.length} products to CSV`);
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#222B2D]/40 dark:text-white/40" />
            <Input
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={onManageCategories}
            className="flex-1 sm:flex-none"
          >
            Manage Categories
          </Button>
          <Button
            onClick={onAddProduct}
            className="bg-[#27AE60] hover:bg-[#229954] text-white flex-1 sm:flex-none"
          >
            <Plus className="size-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedProducts.length > 0 && (
        <div className="bg-[#27AE60]/10 dark:bg-[#27AE60]/20 border border-[#27AE60]/30 rounded-lg p-4 flex items-center justify-between">
          <span className="text-[#222B2D] dark:text-white">
            {selectedProducts.length} product{selectedProducts.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkExport}>
              <Download className="size-4 mr-2" />
              Export
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="size-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="border border-[#222B2D]/10 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-[#222B2D]/20">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F6F7F8] dark:bg-[#222B2D]/40">
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedProducts.length === filteredProducts.length &&
                      filteredProducts.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked) =>
                        handleSelectProduct(product.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium text-[#222B2D] dark:text-white">
                    {product.name}
                  </TableCell>
                  <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                    {product.sku}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-[#222B2D] dark:text-white">
                    ₱{product.price.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[#222B2D] dark:text-white">
                        {product.stock}
                      </span>
                      {isLowStock(product.stock, product.reorderPoint) && (
                        <Badge
                          variant="destructive"
                          className="bg-red-500 text-white"
                        >
                          Low
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                    {product.supplier}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditProduct(product)}>
                          <Edit className="size-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteProduct(product)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-[#222B2D]/60 dark:text-white/60">
            No products found
          </div>
        )}
      </div>

      <div className="text-sm text-[#222B2D]/60 dark:text-white/60">
        Showing {filteredProducts.length} of {products.length} products
      </div>
    </div>
  );
}
