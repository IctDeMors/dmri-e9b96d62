import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Package, Building2, Euro, Layers, ChevronUp, ChevronDown } from "lucide-react";
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
  DialogDescription,
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
import SandwichPanel3D from "@/components/SandwichPanel3D";

type LaagType = "Volkern" | "Isolatie";

interface ArtikelData {
  DESCRIPTION: string;
  Artikel: string;
  OPTIMCODE: string;
  ZDIMSIZE: number;
  Artikelgroep: string;
  Laagtype: LaagType;
}

interface ProductLayer {
  id: string;
  position: number;
  laagtype: string;
  artikelgroep: string;
  dikte: number;
}

interface PanelProduct {
  id: string;
  name: string | null;
  dikte: number;
  base_price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  layers?: ProductLayer[];
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
}

interface FormLayer {
  id: string;
  position: number;
  laagtype: LaagType;
  artikelgroep: string;
  dikte: number;
}

export default function PanelenProducten() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<PanelProduct[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contractPrices, setContractPrices] = useState<ContractPrice[]>([]);
  const [artikelen, setArtikelen] = useState<ArtikelData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Product dialog state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PanelProduct | null>(null);
  const [productForm, setProductForm] = useState<{ name: string; base_price: string; layers: FormLayer[] }>({ 
    name: "", 
    base_price: "", 
    layers: [] 
  });
  
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
    loadArtikelen();
  }, []);

  const loadArtikelen = async () => {
    try {
      const res = await fetch("/Artikelen.json");
      const text = await res.text();
      let cleanText = text.replace(/^\uFEFF/, '').trim();
      if (!cleanText.startsWith('[')) {
        cleanText = '[' + cleanText + ']';
      }
      const data: ArtikelData[] = JSON.parse(cleanText);
      setArtikelen(data);
    } catch (err) {
      console.error("Error loading artikelen:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, companiesRes, pricesRes, layersRes] = await Promise.all([
        supabase.from("panel_products").select("*").order("dikte", { ascending: true }),
        supabase.from("companies").select("id, name").eq("department", "panelen").order("name"),
        supabase.from("panel_contract_prices").select("*").order("created_at", { ascending: false }),
        supabase.from("panel_product_layers").select("*").order("position", { ascending: true })
      ]);
      
      if (productsRes.error) throw productsRes.error;
      if (companiesRes.error) throw companiesRes.error;
      if (pricesRes.error) throw pricesRes.error;
      if (layersRes.error) throw layersRes.error;
      
      // Combine products with their layers
      const productsWithLayers = (productsRes.data || []).map(product => ({
        ...product,
        layers: (layersRes.data || []).filter(l => l.product_id === product.id)
      }));
      
      setProducts(productsWithLayers);
      setCompanies(companiesRes.data || []);
      setContractPrices(pricesRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Fout bij laden", description: "Data kon niet worden geladen", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Get unique artikelgroepen per laagtype
  const getArtikelgroepen = (laagtype: LaagType): string[] => {
    const groepen = new Set<string>();
    artikelen
      .filter((a) => a.Laagtype === laagtype && a.Artikelgroep && a.Artikelgroep.trim() !== "")
      .forEach((a) => groepen.add(a.Artikelgroep));
    return Array.from(groepen).filter(g => g && g.trim() !== "").sort();
  };

  // Get unique diktes for an artikelgroep
  const getDiktesForArtikelgroep = (artikelgroep: string): number[] => {
    const diktes = new Set<number>();
    artikelen
      .filter((a) => a.Artikelgroep === artikelgroep && a.ZDIMSIZE > 0)
      .forEach((a) => diktes.add(a.ZDIMSIZE));
    return Array.from(diktes).sort((a, b) => a - b);
  };

  // Calculate total dikte from layers
  const calculateTotalDikte = (layers: FormLayer[]): number => {
    return layers.reduce((sum, layer) => sum + (layer.dikte || 0), 0);
  };

  // Format opbouw string from layers
  const formatOpbouw = (layers: ProductLayer[]): string => {
    if (!layers || layers.length === 0) return "-";
    return layers
      .sort((a, b) => a.position - b.position)
      .map(l => `${l.dikte} mm ${l.artikelgroep}`)
      .join(" / ");
  };

  // Product CRUD
  const openProductDialog = (product?: PanelProduct) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name || "",
        base_price: product.base_price?.toString() || "",
        layers: (product.layers || []).map(l => ({
          id: l.id,
          position: l.position,
          laagtype: l.laagtype as LaagType,
          artikelgroep: l.artikelgroep,
          dikte: Number(l.dikte)
        }))
      });
    } else {
      setEditingProduct(null);
      setProductForm({ name: "", base_price: "", layers: [] });
    }
    setProductDialogOpen(true);
  };

  // Layer management
  const addLayer = () => {
    const newLayer: FormLayer = {
      id: `temp-${Date.now()}`,
      position: productForm.layers.length + 1,
      laagtype: "Volkern",
      artikelgroep: "",
      dikte: 0
    };
    setProductForm({ ...productForm, layers: [...productForm.layers, newLayer] });
  };

  const updateLayer = (id: string, field: keyof FormLayer, value: string | number) => {
    setProductForm({
      ...productForm,
      layers: productForm.layers.map(l => {
        if (l.id !== id) return l;
        
        // Als laagtype verandert, reset artikelgroep en dikte
        if (field === "laagtype") {
          return { ...l, laagtype: value as LaagType, artikelgroep: "", dikte: 0 };
        }
        // Als artikelgroep verandert, reset dikte
        if (field === "artikelgroep") {
          return { ...l, artikelgroep: value as string, dikte: 0 };
        }
        return { ...l, [field]: value };
      })
    });
  };

  const removeLayer = (id: string) => {
    const newLayers = productForm.layers
      .filter(l => l.id !== id)
      .map((l, idx) => ({ ...l, position: idx + 1 }));
    setProductForm({ ...productForm, layers: newLayers });
  };

  const moveLayer = (id: string, direction: "up" | "down") => {
    const idx = productForm.layers.findIndex(l => l.id === id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === productForm.layers.length - 1) return;
    
    const newLayers = [...productForm.layers];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newLayers[idx], newLayers[swapIdx]] = [newLayers[swapIdx], newLayers[idx]];
    
    // Update positions
    newLayers.forEach((l, i) => l.position = i + 1);
    setProductForm({ ...productForm, layers: newLayers });
  };

  const saveProduct = async () => {
    if (productForm.layers.length === 0) {
      toast({ title: "Voeg minimaal één laag toe", variant: "destructive" });
      return;
    }
    
    // Validate all layers have artikelgroep and dikte
    const invalidLayer = productForm.layers.find(l => !l.artikelgroep || l.dikte <= 0);
    if (invalidLayer) {
      toast({ title: "Alle lagen moeten een artikelgroep en dikte hebben", variant: "destructive" });
      return;
    }
    
    try {
      const totalDikte = calculateTotalDikte(productForm.layers);
      const productData = {
        name: productForm.name || null,
        dikte: totalDikte,
        base_price: productForm.base_price ? parseFloat(productForm.base_price) : null
      };
      
      let productId: string;
      
      if (editingProduct) {
        const { error } = await supabase.from("panel_products").update(productData).eq("id", editingProduct.id);
        if (error) throw error;
        productId = editingProduct.id;
        
        // Delete existing layers
        await supabase.from("panel_product_layers").delete().eq("product_id", productId);
      } else {
        const { data, error } = await supabase.from("panel_products").insert(productData).select().single();
        if (error) throw error;
        productId = data.id;
      }
      
      // Insert new layers
      const layersData = productForm.layers.map(l => ({
        product_id: productId,
        position: l.position,
        laagtype: l.laagtype,
        artikelgroep: l.artikelgroep,
        dikte: l.dikte
      }));
      
      const { error: layersError } = await supabase.from("panel_product_layers").insert(layersData);
      if (layersError) throw layersError;
      
      toast({ title: editingProduct ? "Product bijgewerkt" : "Product toegevoegd" });
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

  // Convert FormLayer to format for 3D preview
  const getPreviewLagen = () => {
    return productForm.layers.map(l => ({
      id: parseInt(l.id.replace('temp-', '')) || Date.now(),
      type: l.laagtype,
      artikelgroep: l.artikelgroep,
      artikel: "",
      optimcode: "",
      description: l.artikelgroep,
      dikte: l.dikte
    }));
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
                      <TableHead className="w-32">Naam</TableHead>
                      <TableHead className="w-20">Dikte</TableHead>
                      <TableHead>Opbouw (Lagen)</TableHead>
                      <TableHead className="w-32">Basisprijs</TableHead>
                      <TableHead className="w-20">Actief</TableHead>
                      <TableHead className="w-24">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className={!product.is_active ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{product.name || "-"}</TableCell>
                        <TableCell>{product.dikte} mm</TableCell>
                        <TableCell className="text-sm max-w-md">
                          <div className="flex flex-wrap gap-1">
                            {(product.layers || []).sort((a, b) => a.position - b.position).map((layer, idx) => (
                              <span key={layer.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted">
                                {layer.dikte}mm {layer.artikelgroep}
                                {idx < (product.layers?.length || 0) - 1 && <span className="ml-1 text-muted-foreground">/</span>}
                              </span>
                            ))}
                          </div>
                        </TableCell>
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
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
                          <TableCell className="text-sm max-w-xs truncate">{formatOpbouw(product?.layers || [])}</TableCell>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Product Bewerken" : "Nieuw Standaard Product"}</DialogTitle>
            <DialogDescription>
              Definieer de laagopbouw van het product. Artikelgroep en dikte bepalen welke artikelen gekozen kunnen worden bij order invoer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Productnaam (optioneel)</Label>
                  <Input
                    id="name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="bijv. Standaard gevelpaneel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base_price">Basisprijs per m² (€)</Label>
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

              {/* Layers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Lagen ({productForm.layers.length})
                  </Label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Totale dikte: <strong>{calculateTotalDikte(productForm.layers)} mm</strong>
                    </span>
                    <Button type="button" variant="outline" size="sm" onClick={addLayer}>
                      <Plus className="h-4 w-4 mr-1" />
                      Laag toevoegen
                    </Button>
                  </div>
                </div>

                {productForm.layers.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Geen lagen toegevoegd</p>
                    <p className="text-sm">Klik op "Laag toevoegen" om te beginnen</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {productForm.layers.map((layer, idx) => (
                      <div key={layer.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <div className="flex flex-col gap-1">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => moveLayer(layer.id, "up")}
                            disabled={idx === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => moveLayer(layer.id, "down")}
                            disabled={idx === productForm.layers.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <span className="w-6 text-center font-medium text-muted-foreground">{idx + 1}</span>
                        
                        <Select
                          value={layer.laagtype}
                          onValueChange={(value) => updateLayer(layer.id, "laagtype", value)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Volkern">Volkern</SelectItem>
                            <SelectItem value="Isolatie">Isolatie</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={layer.artikelgroep}
                          onValueChange={(value) => updateLayer(layer.id, "artikelgroep", value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Kies artikelgroep" />
                          </SelectTrigger>
                          <SelectContent>
                            {getArtikelgroepen(layer.laagtype).map((groep) => (
                              <SelectItem key={groep} value={groep}>{groep}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={layer.dikte > 0 ? layer.dikte.toString() : ""}
                          onValueChange={(value) => updateLayer(layer.id, "dikte", parseFloat(value))}
                          disabled={!layer.artikelgroep}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Dikte" />
                          </SelectTrigger>
                          <SelectContent>
                            {getDiktesForArtikelgroep(layer.artikelgroep).map((dikte) => (
                              <SelectItem key={dikte} value={dikte.toString()}>{dikte} mm</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive"
                          onClick={() => removeLayer(layer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: 3D Preview */}
            <div className="space-y-2">
              <Label>3D Preview</Label>
              <div className="h-64 rounded-lg overflow-hidden border bg-gradient-to-b from-slate-100 to-slate-200">
                {productForm.layers.length > 0 ? (
                  <SandwichPanel3D lagen={getPreviewLagen()} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Voeg lagen toe voor preview
                  </div>
                )}
              </div>
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
            <DialogDescription>
              Koppel een prijs per m² aan een klant voor een specifiek standaard product.
            </DialogDescription>
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
                      {product.dikte}mm - {formatOpbouw(product.layers || [])}
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
