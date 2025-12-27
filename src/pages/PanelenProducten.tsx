import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Package, Building2, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PanelProduct {
  id: string;
  dikte: number;
  opbouw: string;
  base_price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  name: string;
}

interface ContractPrice {
  id: string;
  product_id: string;
  company_id: string;
  price_per_m2: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  company?: Company;
  product?: PanelProduct;
}

export default function PanelenProducten() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<PanelProduct[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contractPrices, setContractPrices] = useState<ContractPrice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Product dialog state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PanelProduct | null>(null);
  const [productForm, setProductForm] = useState({ dikte: "", opbouw: "", base_price: "" });
  
  // Contract price dialog state
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ContractPrice | null>(null);
  const [priceForm, setPriceForm] = useState({ 
    product_id: "", 
    company_id: "", 
    price_per_m2: "",
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: ""
  });
  
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, companiesRes, pricesRes] = await Promise.all([
        supabase.from("panel_products").select("*").order("dikte", { ascending: true }),
        supabase.from("companies").select("id, name").eq("department", "panelen").order("name"),
        supabase.from("panel_contract_prices").select("*").order("created_at", { ascending: false })
      ]);
      
      if (productsRes.error) throw productsRes.error;
      if (companiesRes.error) throw companiesRes.error;
      if (pricesRes.error) throw pricesRes.error;
      
      setProducts(productsRes.data || []);
      setCompanies(companiesRes.data || []);
      setContractPrices(pricesRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Fout bij laden", description: "Data kon niet worden geladen", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Product CRUD
  const openProductDialog = (product?: PanelProduct) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        dikte: product.dikte.toString(),
        opbouw: product.opbouw,
        base_price: product.base_price?.toString() || ""
      });
    } else {
      setEditingProduct(null);
      setProductForm({ dikte: "", opbouw: "", base_price: "" });
    }
    setProductDialogOpen(true);
  };

  const saveProduct = async () => {
    if (!productForm.dikte || !productForm.opbouw) {
      toast({ title: "Vul alle verplichte velden in", variant: "destructive" });
      return;
    }
    
    try {
      const data = {
        dikte: parseInt(productForm.dikte),
        opbouw: productForm.opbouw,
        base_price: productForm.base_price ? parseFloat(productForm.base_price) : null
      };
      
      if (editingProduct) {
        const { error } = await supabase.from("panel_products").update(data).eq("id", editingProduct.id);
        if (error) throw error;
        toast({ title: "Product bijgewerkt" });
      } else {
        const { error } = await supabase.from("panel_products").insert(data);
        if (error) throw error;
        toast({ title: "Product toegevoegd" });
      }
      
      setProductDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({ title: "Fout bij opslaan", variant: "destructive" });
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit product wilt verwijderen?")) return;
    
    try {
      const { error } = await supabase.from("panel_products").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Product verwijderd" });
      loadData();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ title: "Fout bij verwijderen", variant: "destructive" });
    }
  };

  const toggleProductActive = async (product: PanelProduct) => {
    try {
      const { error } = await supabase.from("panel_products").update({ is_active: !product.is_active }).eq("id", product.id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error("Error toggling product:", error);
    }
  };

  // Contract Price CRUD
  const openPriceDialog = (price?: ContractPrice) => {
    if (price) {
      setEditingPrice(price);
      setPriceForm({
        product_id: price.product_id,
        company_id: price.company_id,
        price_per_m2: price.price_per_m2.toString(),
        valid_from: price.valid_from,
        valid_until: price.valid_until || ""
      });
    } else {
      setEditingPrice(null);
      setPriceForm({ 
        product_id: "", 
        company_id: "", 
        price_per_m2: "",
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: ""
      });
    }
    setPriceDialogOpen(true);
  };

  const savePrice = async () => {
    if (!priceForm.product_id || !priceForm.company_id || !priceForm.price_per_m2) {
      toast({ title: "Vul alle verplichte velden in", variant: "destructive" });
      return;
    }
    
    try {
      const data = {
        product_id: priceForm.product_id,
        company_id: priceForm.company_id,
        price_per_m2: parseFloat(priceForm.price_per_m2),
        valid_from: priceForm.valid_from,
        valid_until: priceForm.valid_until || null
      };
      
      if (editingPrice) {
        const { error } = await supabase.from("panel_contract_prices").update(data).eq("id", editingPrice.id);
        if (error) throw error;
        toast({ title: "Contractprijs bijgewerkt" });
      } else {
        const { error } = await supabase.from("panel_contract_prices").insert(data);
        if (error) throw error;
        toast({ title: "Contractprijs toegevoegd" });
      }
      
      setPriceDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error saving price:", error);
      toast({ title: "Fout bij opslaan", variant: "destructive" });
    }
  };

  const deletePrice = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze contractprijs wilt verwijderen?")) return;
    
    try {
      const { error } = await supabase.from("panel_contract_prices").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Contractprijs verwijderd" });
      loadData();
    } catch (error) {
      console.error("Error deleting price:", error);
      toast({ title: "Fout bij verwijderen", variant: "destructive" });
    }
  };

  const getProductById = (id: string) => products.find(p => p.id === id);
  const getCompanyById = (id: string) => companies.find(c => c.id === id);

  const filteredContractPrices = selectedCompanyFilter === "all" 
    ? contractPrices 
    : contractPrices.filter(cp => cp.company_id === selectedCompanyFilter);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-purple-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/panelen")} className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Producten & Contractprijzen</h1>
              <p className="text-purple-200 text-sm">Beheer standaard producten en klant-contractprijzen</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Standaard Producten
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Contractprijzen
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Standaard Producten ({products.length})
                </CardTitle>
                <Button onClick={() => openProductDialog()} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuw Product
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Dikte</TableHead>
                      <TableHead>Opbouw</TableHead>
                      <TableHead className="w-32">Basisprijs</TableHead>
                      <TableHead className="w-20">Actief</TableHead>
                      <TableHead className="w-24">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className={!product.is_active ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{product.dikte} mm</TableCell>
                        <TableCell className="text-sm">{product.opbouw}</TableCell>
                        <TableCell>{product.base_price ? formatCurrency(product.base_price) : "-"}</TableCell>
                        <TableCell>
                          <Switch checked={product.is_active} onCheckedChange={() => toggleProductActive(product)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openProductDialog(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {products.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Geen producten gevonden. Voeg een nieuw product toe.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contract Prices Tab */}
          <TabsContent value="contracts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="h-5 w-5" />
                    Contractprijzen ({filteredContractPrices.length})
                  </CardTitle>
                  <Select value={selectedCompanyFilter} onValueChange={setSelectedCompanyFilter}>
                    <SelectTrigger className="w-48">
                      <Building2 className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter op klant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle klanten</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => openPriceDialog()} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe Contractprijs
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Klant</TableHead>
                      <TableHead className="w-20">Dikte</TableHead>
                      <TableHead>Opbouw</TableHead>
                      <TableHead className="w-32">Prijs/m²</TableHead>
                      <TableHead className="w-28">Geldig vanaf</TableHead>
                      <TableHead className="w-28">Geldig tot</TableHead>
                      <TableHead className="w-24">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContractPrices.map((price) => {
                      const product = getProductById(price.product_id);
                      const company = getCompanyById(price.company_id);
                      return (
                        <TableRow key={price.id}>
                          <TableCell className="font-medium">{company?.name || "-"}</TableCell>
                          <TableCell>{product?.dikte || "-"} mm</TableCell>
                          <TableCell className="text-sm max-w-xs truncate">{product?.opbouw || "-"}</TableCell>
                          <TableCell className="font-semibold text-green-600">{formatCurrency(price.price_per_m2)}</TableCell>
                          <TableCell className="text-sm">{price.valid_from}</TableCell>
                          <TableCell className="text-sm">{price.valid_until || "∞"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openPriceDialog(price)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deletePrice(price.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredContractPrices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Geen contractprijzen gevonden.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Product Bewerken" : "Nieuw Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dikte">Dikte (mm) *</Label>
              <Input
                id="dikte"
                type="number"
                value={productForm.dikte}
                onChange={(e) => setProductForm({ ...productForm, dikte: e.target.value })}
                placeholder="bijv. 48"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opbouw">Opbouw *</Label>
              <Input
                id="opbouw"
                value={productForm.opbouw}
                onChange={(e) => setProductForm({ ...productForm, opbouw: e.target.value })}
                placeholder="bijv. 2 mm Renolit / 44 mm pu / 1,5 mm pvc"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base_price">Basisprijs (€)</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                value={productForm.base_price}
                onChange={(e) => setProductForm({ ...productForm, base_price: e.target.value })}
                placeholder="Optioneel"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Annuleren</Button>
            <Button onClick={saveProduct} className="bg-purple-600 hover:bg-purple-700">Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Price Dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPrice ? "Contractprijs Bewerken" : "Nieuwe Contractprijs"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Klant *</Label>
              <Select value={priceForm.company_id} onValueChange={(value) => setPriceForm({ ...priceForm, company_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer klant" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Product *</Label>
              <Select value={priceForm.product_id} onValueChange={(value) => setPriceForm({ ...priceForm, product_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer product" />
                </SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.is_active).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.dikte}mm - {product.opbouw}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_per_m2">Prijs per m² (€) *</Label>
              <Input
                id="price_per_m2"
                type="number"
                step="0.01"
                value={priceForm.price_per_m2}
                onChange={(e) => setPriceForm({ ...priceForm, price_per_m2: e.target.value })}
                placeholder="bijv. 74.05"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Geldig vanaf *</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={priceForm.valid_from}
                  onChange={(e) => setPriceForm({ ...priceForm, valid_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Geldig tot</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={priceForm.valid_until}
                  onChange={(e) => setPriceForm({ ...priceForm, valid_until: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>Annuleren</Button>
            <Button onClick={savePrice} className="bg-purple-600 hover:bg-purple-700">Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
