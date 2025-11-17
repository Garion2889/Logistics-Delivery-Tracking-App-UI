import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
}

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryManagementModal({
  isOpen,
  onClose,
}: CategoryManagementModalProps) {
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [categories, setCategories] = useState<Category[]>([
    {
      id: "1",
      name: "Electronics",
      description: "Electronic devices and accessories",
      productCount: 15,
    },
    {
      id: "2",
      name: "Furniture",
      description: "Office and home furniture",
      productCount: 8,
    },
    {
      id: "3",
      name: "Office Supplies",
      description: "Stationery and office equipment",
      productCount: 12,
    },
    {
      id: "4",
      name: "Accessories",
      description: "Miscellaneous accessories",
      productCount: 5,
    },
  ]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    
    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      description: newCategory.description,
      productCount: 0,
    };

    setCategories([...categories, category]);
    setNewCategory({ name: "", description: "" });
    toast.success(`Category "${category.name}" added successfully`);
  };

  const handleDeleteCategory = (category: Category) => {
    if (category.productCount > 0) {
      toast.error(`Cannot delete "${category.name}" - it has ${category.productCount} products`);
      return;
    }

    setCategories(categories.filter((c) => c.id !== category.id));
    toast.success(`Category "${category.name}" deleted`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Manage Product Categories</DialogTitle>
          <DialogDescription>
            Add, edit, or remove product categories for better organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name *</Label>
                <Input
                  id="categoryName"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  placeholder="e.g., Electronics"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryDesc">Description</Label>
                <Input
                  id="categoryDesc"
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, description: e.target.value })
                  }
                  placeholder="Brief description"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="bg-[#27AE60] hover:bg-[#229954] text-white"
            >
              <Plus className="size-4 mr-2" />
              Add Category
            </Button>
          </form>

          {/* Categories Table */}
          <div className="border border-[#222B2D]/10 dark:border-white/10 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F6F7F8] dark:bg-[#222B2D]/40">
                  <TableHead>Category Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium text-[#222B2D] dark:text-white">
                      {category.name}
                    </TableCell>
                    <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                      {category.description}
                    </TableCell>
                    <TableCell className="text-right text-[#222B2D] dark:text-white">
                      {category.productCount}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(category)}
                        disabled={category.productCount > 0}
                      >
                        <Trash2 className="size-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-[#222B2D]/60 dark:text-white/60">
            Note: Categories with products cannot be deleted. Please reassign or remove products first.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
