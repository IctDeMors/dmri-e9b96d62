import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, Layers, ChevronRight, ChevronLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SandwichPanel3D from "@/components/SandwichPanel3D";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type LaagType = "volkern" | "isolatie";
type IsolatieMateriaal = "Pir" | "Pur" | "XPS";
type VolkernMateriaal = "trespa" | "renolit" | "glas" | "staal" | "aluminium";

interface Laag {
  id: number;
  type: LaagType;
  materiaal: IsolatieMateriaal | VolkernMateriaal;
}

interface StuklijstItem {
  id: number;
  aantal: number;
  lengte: number;
  breedte: number;
  merk: string;
}

interface Samenstelling {
  id: number;
  naam: string;
  lagen: Laag[];
  stuklijst: StuklijstItem[];
}

interface Order {
  ORDERNO: number;
  OFFERNO: number;
  ALIAS: string;
  NAME: string;
  CUSTOMERREFERENCE1: string;
  CUSTOMERREFERENCE2: string;
  DELIVERYDATE?: string;
  samenstellingen: Samenstelling[];
  // Legacy support
  lagen?: Laag[];
  stuklijst?: StuklijstItem[];
}

const STORAGE_KEY = "panelen_custom_orders";
const COUNTER_KEY = "panelen_order_counter";

const ISOLATIE_MATERIALEN: IsolatieMateriaal[] = ["Pir", "Pur", "XPS"];
const VOLKERN_MATERIALEN: VolkernMateriaal[] = ["trespa", "renolit", "glas", "staal", "aluminium"];

const migrateOrder = (order: Order): Order => {
  // Migrate old orders with lagen/stuklijst to new samenstellingen structure
  if (!order.samenstellingen && (order.lagen || order.stuklijst)) {
    return {
      ...order,
      samenstellingen: [{
        id: Date.now(),
        naam: "Samenstelling 1",
        lagen: order.lagen || [],
        stuklijst: order.stuklijst || [],
      }],
    };
  }
  return order;
};

const PanelenOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [activeSamenstellingId, setActiveSamenstellingId] = useState<string>("");
  const [formData, setFormData] = useState<Partial<Order>>({
    ALIAS: "",
    NAME: "",
    CUSTOMERREFERENCE1: "",
    CUSTOMERREFERENCE2: "",
    DELIVERYDATE: "",
    samenstellingen: [],
  });

  const getNextOrderNumber = (): number => {
    const saved = localStorage.getItem(COUNTER_KEY);
    const current = saved ? parseInt(saved, 10) : 1000000;
    const next = current + 1;
    localStorage.setItem(COUNTER_KEY, String(next));
    return next;
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const loadedOrders = JSON.parse(saved).map(migrateOrder);
        setOrders(loadedOrders);
      } catch (e) {
        console.error("Error loading orders:", e);
      }
    }
  }, []);

  const saveOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
  };

  const resetForm = () => {
    setFormData({
      ALIAS: "",
      NAME: "",
      CUSTOMERREFERENCE1: "",
      CUSTOMERREFERENCE2: "",
      DELIVERYDATE: "",
      samenstellingen: [],
    });
    setEditingOrder(null);
    setFormStep(1);
    setActiveSamenstellingId("");
  };

  const handleOpenDialog = (order?: Order) => {
    if (order) {
      const migratedOrder = migrateOrder(order);
      setEditingOrder(migratedOrder);
      setFormData({
        ...migratedOrder,
        DELIVERYDATE: migratedOrder.DELIVERYDATE ? migratedOrder.DELIVERYDATE.split("T")[0] : "",
      });
      if (migratedOrder.samenstellingen.length > 0) {
        setActiveSamenstellingId(String(migratedOrder.samenstellingen[0].id));
      }
    } else {
      resetForm();
    }
    setFormStep(1);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  // Samenstelling beheer
  const addSamenstelling = () => {
    const samenstellingen = formData.samenstellingen || [];
    if (samenstellingen.length >= 10) {
      toast({ title: "Maximum bereikt", description: "Maximaal 10 samenstellingen toegestaan", variant: "destructive" });
      return;
    }
    const newSamenstelling: Samenstelling = {
      id: Date.now(),
      naam: `Samenstelling ${samenstellingen.length + 1}`,
      lagen: [],
      stuklijst: [],
    };
    const newSamenstellingen = [...samenstellingen, newSamenstelling];
    setFormData({ ...formData, samenstellingen: newSamenstellingen });
    setActiveSamenstellingId(String(newSamenstelling.id));
  };

  const removeSamenstelling = (id: number) => {
    const samenstellingen = formData.samenstellingen || [];
    const newSamenstellingen = samenstellingen.filter((s) => s.id !== id);
    setFormData({ ...formData, samenstellingen: newSamenstellingen });
    if (activeSamenstellingId === String(id) && newSamenstellingen.length > 0) {
      setActiveSamenstellingId(String(newSamenstellingen[0].id));
    }
  };

  const updateSamenstellingNaam = (id: number, naam: string) => {
    const samenstellingen = formData.samenstellingen || [];
    setFormData({
      ...formData,
      samenstellingen: samenstellingen.map((s) => s.id === id ? { ...s, naam } : s),
    });
  };

  const getActiveSamenstelling = (): Samenstelling | undefined => {
    return (formData.samenstellingen || []).find((s) => String(s.id) === activeSamenstellingId);
  };

  // Lagen beheer
  const addLaag = () => {
    const samenstelling = getActiveSamenstelling();
    if (!samenstelling) return;
    if (samenstelling.lagen.length >= 10) {
      toast({ title: "Maximum bereikt", description: "Maximaal 10 lagen toegestaan per samenstelling", variant: "destructive" });
      return;
    }
    const newLaag: Laag = {
      id: Date.now(),
      type: "volkern",
      materiaal: "trespa",
    };
    setFormData({
      ...formData,
      samenstellingen: (formData.samenstellingen || []).map((s) =>
        s.id === samenstelling.id ? { ...s, lagen: [...s.lagen, newLaag] } : s
      ),
    });
  };

  const updateLaag = (id: number, field: keyof Laag, value: string) => {
    const samenstelling = getActiveSamenstelling();
    if (!samenstelling) return;
    setFormData({
      ...formData,
      samenstellingen: (formData.samenstellingen || []).map((s) =>
        s.id === samenstelling.id
          ? {
              ...s,
              lagen: s.lagen.map((l) => {
                if (l.id !== id) return l;
                if (field === "type") {
                  const newType = value as LaagType;
                  const defaultMateriaal = newType === "isolatie" ? "Pir" : "trespa";
                  return { ...l, type: newType, materiaal: defaultMateriaal };
                }
                return { ...l, [field]: value };
              }),
            }
          : s
      ),
    });
  };

  const removeLaag = (id: number) => {
    const samenstelling = getActiveSamenstelling();
    if (!samenstelling) return;
    setFormData({
      ...formData,
      samenstellingen: (formData.samenstellingen || []).map((s) =>
        s.id === samenstelling.id ? { ...s, lagen: s.lagen.filter((l) => l.id !== id) } : s
      ),
    });
  };

  // Stuklijst beheer
  const addStuklijstItem = () => {
    const samenstelling = getActiveSamenstelling();
    if (!samenstelling) return;
    if (samenstelling.stuklijst.length >= 99) {
      toast({ title: "Maximum bereikt", description: "Maximaal 99 items toegestaan per samenstelling", variant: "destructive" });
      return;
    }
    const newItem: StuklijstItem = {
      id: Date.now(),
      aantal: 1,
      lengte: 0,
      breedte: 0,
      merk: "",
    };
    setFormData({
      ...formData,
      samenstellingen: (formData.samenstellingen || []).map((s) =>
        s.id === samenstelling.id ? { ...s, stuklijst: [...s.stuklijst, newItem] } : s
      ),
    });
  };

  const updateStuklijstItem = (id: number, field: keyof StuklijstItem, value: string | number) => {
    const samenstelling = getActiveSamenstelling();
    if (!samenstelling) return;
    setFormData({
      ...formData,
      samenstellingen: (formData.samenstellingen || []).map((s) =>
        s.id === samenstelling.id
          ? { ...s, stuklijst: s.stuklijst.map((item) => (item.id === id ? { ...item, [field]: value } : item)) }
          : s
      ),
    });
  };

  const removeStuklijstItem = (id: number) => {
    const samenstelling = getActiveSamenstelling();
    if (!samenstelling) return;
    setFormData({
      ...formData,
      samenstellingen: (formData.samenstellingen || []).map((s) =>
        s.id === samenstelling.id ? { ...s, stuklijst: s.stuklijst.filter((item) => item.id !== id) } : s
      ),
    });
  };

  const handleSubmit = () => {
    if (!formData.NAME) {
      toast({ title: "Fout", description: "Naam is verplicht", variant: "destructive" });
      return;
    }

    let newOrders: Order[];
    if (editingOrder) {
      const orderData: Order = {
        ...editingOrder,
        ALIAS: formData.ALIAS || "",
        NAME: formData.NAME || "",
        CUSTOMERREFERENCE1: formData.CUSTOMERREFERENCE1 || "",
        CUSTOMERREFERENCE2: formData.CUSTOMERREFERENCE2 || "",
        DELIVERYDATE: formData.DELIVERYDATE ? `${formData.DELIVERYDATE}T00:00:00` : undefined,
        samenstellingen: formData.samenstellingen || [],
      };
      newOrders = orders.map((o) => (o.ORDERNO === editingOrder.ORDERNO ? orderData : o));
      toast({ title: "Succes", description: "Order bijgewerkt" });
    } else {
      const newOrderNo = getNextOrderNumber();
      const orderData: Order = {
        ORDERNO: newOrderNo,
        OFFERNO: newOrderNo,
        ALIAS: formData.ALIAS || "",
        NAME: formData.NAME || "",
        CUSTOMERREFERENCE1: formData.CUSTOMERREFERENCE1 || "",
        CUSTOMERREFERENCE2: formData.CUSTOMERREFERENCE2 || "",
        DELIVERYDATE: formData.DELIVERYDATE ? `${formData.DELIVERYDATE}T00:00:00` : undefined,
        samenstellingen: formData.samenstellingen || [],
      };
      newOrders = [...orders, orderData];
      toast({ title: "Succes", description: "Order aangemaakt" });
    }
    saveOrders(newOrders);
    handleCloseDialog();
  };

  const handleDelete = (orderNo: number) => {
    const newOrders = orders.filter((o) => o.ORDERNO !== orderNo);
    saveOrders(newOrders);
    toast({ title: "Verwijderd", description: "Order is verwijderd" });
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleDateString("nl-NL");
    } catch {
      return "-";
    }
  };

  const getTotalLagen = (order: Order): number => {
    return (order.samenstellingen || []).reduce((acc, s) => acc + s.lagen.length, 0);
  };

  const getTotalStuklijst = (order: Order): number => {
    return (order.samenstellingen || []).reduce((acc, s) => acc + s.stuklijst.length, 0);
  };

  const activeSamenstelling = getActiveSamenstelling();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-[#0c3a83]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/panelen">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Orders Beheren</h1>
                <p className="text-white/70 text-sm">Aanmaken, bewerken en bekijken van orders</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="bg-white text-[#0c3a83] hover:bg-white/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Nieuwe Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingOrder ? "Order Bewerken" : "Nieuwe Order"} - Stap {formStep}/2
                  </DialogTitle>
                </DialogHeader>

                {formStep === 1 ? (
                  <div className="space-y-6">
                    {/* Basis info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="NAME">Naam *</Label>
                        <Input
                          id="NAME"
                          value={formData.NAME || ""}
                          onChange={(e) => setFormData({ ...formData, NAME: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ALIAS">Alias</Label>
                        <Input
                          id="ALIAS"
                          value={formData.ALIAS || ""}
                          onChange={(e) => setFormData({ ...formData, ALIAS: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="CUSTOMERREFERENCE1">Klantreferentie 1</Label>
                        <Input
                          id="CUSTOMERREFERENCE1"
                          value={formData.CUSTOMERREFERENCE1 || ""}
                          onChange={(e) => setFormData({ ...formData, CUSTOMERREFERENCE1: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="DELIVERYDATE">Leverdatum</Label>
                        <Input
                          id="DELIVERYDATE"
                          type="date"
                          value={formData.DELIVERYDATE || ""}
                          onChange={(e) => setFormData({ ...formData, DELIVERYDATE: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Samenstellingen sectie */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Samenstellingen ({(formData.samenstellingen || []).length}/10)
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={addSamenstelling} disabled={(formData.samenstellingen || []).length >= 10}>
                          <Plus className="w-4 h-4 mr-1" />
                          Samenstelling toevoegen
                        </Button>
                      </div>

                      {(formData.samenstellingen || []).length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                          <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Nog geen samenstellingen</p>
                          <Button type="button" variant="link" size="sm" onClick={addSamenstelling}>
                            Eerste samenstelling toevoegen
                          </Button>
                        </div>
                      ) : (
                        <Tabs value={activeSamenstellingId} onValueChange={setActiveSamenstellingId}>
                          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
                            {(formData.samenstellingen || []).map((s) => (
                              <TabsTrigger key={s.id} value={String(s.id)} className="text-xs px-3">
                                {s.naam}
                              </TabsTrigger>
                            ))}
                          </TabsList>

                          {(formData.samenstellingen || []).map((samenstelling) => (
                            <TabsContent key={samenstelling.id} value={String(samenstelling.id)} className="space-y-4 mt-4">
                              {/* Samenstelling naam en verwijderen */}
                              <div className="flex items-center gap-2">
                                <Input
                                  value={samenstelling.naam}
                                  onChange={(e) => updateSamenstellingNaam(samenstelling.id, e.target.value)}
                                  className="max-w-xs"
                                  placeholder="Naam samenstelling"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeSamenstelling(samenstelling.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Lagen sectie */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium flex items-center gap-2">
                                    <Layers className="w-4 h-4" />
                                    Lagen ({samenstelling.lagen.length}/10)
                                  </Label>
                                  <Button type="button" variant="outline" size="sm" onClick={addLaag} disabled={samenstelling.lagen.length >= 10}>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Laag
                                  </Button>
                                </div>

                                <div className="flex gap-4">
                                  {/* Lagen lijst */}
                                  <div className="flex-1 space-y-2 max-h-[200px] overflow-y-auto">
                                    {samenstelling.lagen.map((laag, index) => (
                                      <div key={laag.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                        <span className="text-sm font-medium w-8">#{index + 1}</span>
                                        <Select value={laag.type} onValueChange={(v) => updateLaag(laag.id, "type", v)}>
                                          <SelectTrigger className="w-[120px]">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="volkern">Volkern</SelectItem>
                                            <SelectItem value="isolatie">Isolatie</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Select value={laag.materiaal} onValueChange={(v) => updateLaag(laag.id, "materiaal", v)}>
                                          <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {laag.type === "isolatie"
                                              ? ISOLATIE_MATERIALEN.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)
                                              : VOLKERN_MATERIALEN.map((m) => <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)
                                            }
                                          </SelectContent>
                                        </Select>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLaag(laag.id)} className="text-destructive hover:text-destructive ml-auto">
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                    {samenstelling.lagen.length === 0 && (
                                      <p className="text-sm text-muted-foreground text-center py-4">Nog geen lagen toegevoegd</p>
                                    )}
                                  </div>

                                  {/* 3D Sandwich weergave */}
                                  <div className="w-64 flex flex-col">
                                    <span className="text-xs text-muted-foreground mb-2 text-center">3D Preview</span>
                                    <div className="h-48 rounded-lg overflow-hidden border border-border bg-gradient-to-b from-slate-100 to-slate-200">
                                      <SandwichPanel3D lagen={samenstelling.lagen} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={handleCloseDialog}>
                        <X className="w-4 h-4 mr-2" />
                        Annuleren
                      </Button>
                      <Button type="button" onClick={() => setFormStep(2)}>
                        Volgende
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Stuklijst per samenstelling */}
                    {(formData.samenstellingen || []).length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <p className="text-sm text-muted-foreground">Geen samenstellingen aanwezig. Ga terug om samenstellingen toe te voegen.</p>
                      </div>
                    ) : (
                      <Tabs value={activeSamenstellingId} onValueChange={setActiveSamenstellingId}>
                        <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
                          {(formData.samenstellingen || []).map((s) => (
                            <TabsTrigger key={s.id} value={String(s.id)} className="text-xs px-3">
                              {s.naam}
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {(formData.samenstellingen || []).map((samenstelling) => (
                          <TabsContent key={samenstelling.id} value={String(samenstelling.id)} className="space-y-4 mt-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Stuklijst - {samenstelling.naam} ({samenstelling.stuklijst.length}/99)</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addStuklijstItem} disabled={samenstelling.stuklijst.length >= 99}>
                                  <Plus className="w-4 h-4 mr-1" />
                                  Item toevoegen
                                </Button>
                              </div>
                              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                                {samenstelling.stuklijst.map((item, index) => (
                                  <div key={item.id} className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_40px] gap-2 items-center p-2 bg-muted/50 rounded-md">
                                    <span className="text-sm font-medium">#{index + 1}</span>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Aantal</Label>
                                      <Input
                                        type="number"
                                        min={1}
                                        value={item.aantal}
                                        onChange={(e) => updateStuklijstItem(item.id, "aantal", parseInt(e.target.value) || 1)}
                                        className="h-8"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Lengte (mm)</Label>
                                      <Input
                                        type="number"
                                        min={0}
                                        value={item.lengte}
                                        onChange={(e) => updateStuklijstItem(item.id, "lengte", parseInt(e.target.value) || 0)}
                                        className="h-8"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Breedte (mm)</Label>
                                      <Input
                                        type="number"
                                        min={0}
                                        value={item.breedte}
                                        onChange={(e) => updateStuklijstItem(item.id, "breedte", parseInt(e.target.value) || 0)}
                                        className="h-8"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Merk</Label>
                                      <Input
                                        value={item.merk}
                                        onChange={(e) => updateStuklijstItem(item.id, "merk", e.target.value)}
                                        className="h-8"
                                      />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeStuklijstItem(item.id)} className="text-destructive hover:text-destructive mt-4">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                                {samenstelling.stuklijst.length === 0 && (
                                  <p className="text-sm text-muted-foreground text-center py-4">Nog geen items in stuklijst</p>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    )}

                    <div className="flex justify-between pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setFormStep(1)}>
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Terug
                      </Button>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleCloseDialog}>
                          <X className="w-4 h-4 mr-2" />
                          Annuleren
                        </Button>
                        <Button type="button" onClick={handleSubmit}>
                          <Save className="w-4 h-4 mr-2" />
                          {editingOrder ? "Opslaan" : "Aanmaken"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Orders ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nog geen orders aangemaakt.</p>
                <p className="text-sm mt-1">Klik op "Nieuwe Order" om te beginnen.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ordernr</TableHead>
                      <TableHead>Naam</TableHead>
                      <TableHead>Alias</TableHead>
                      <TableHead>Samenstellingen</TableHead>
                      <TableHead>Totaal Lagen</TableHead>
                      <TableHead>Totaal Items</TableHead>
                      <TableHead>Leverdatum</TableHead>
                      <TableHead className="text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.ORDERNO}>
                        <TableCell className="font-mono">{order.ORDERNO}</TableCell>
                        <TableCell>{order.NAME}</TableCell>
                        <TableCell>{order.ALIAS || "-"}</TableCell>
                        <TableCell>{(order.samenstellingen || []).length}</TableCell>
                        <TableCell>{getTotalLagen(order)} lagen</TableCell>
                        <TableCell>{getTotalStuklijst(order)} items</TableCell>
                        <TableCell>{formatDate(order.DELIVERYDATE)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(order)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(order.ORDERNO)} className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PanelenOrders;
