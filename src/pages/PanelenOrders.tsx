import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, Layers, ChevronRight, ChevronLeft } from "lucide-react";
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

interface Order {
  ORDERNO: number;
  OFFERNO: number;
  ALIAS: string;
  NAME: string;
  CUSTOMERREFERENCE1: string;
  CUSTOMERREFERENCE2: string;
  DELIVERYDATE?: string;
  lagen: Laag[];
  stuklijst: StuklijstItem[];
}

const STORAGE_KEY = "panelen_custom_orders";
const COUNTER_KEY = "panelen_order_counter";

const ISOLATIE_MATERIALEN: IsolatieMateriaal[] = ["Pir", "Pur", "XPS"];
const VOLKERN_MATERIALEN: VolkernMateriaal[] = ["trespa", "renolit", "glas", "staal", "aluminium"];

const PanelenOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<Partial<Order>>({
    ALIAS: "",
    NAME: "",
    CUSTOMERREFERENCE1: "",
    CUSTOMERREFERENCE2: "",
    DELIVERYDATE: "",
    lagen: [],
    stuklijst: [],
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
        setOrders(JSON.parse(saved));
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
      lagen: [],
      stuklijst: [],
    });
    setEditingOrder(null);
    setFormStep(1);
  };

  const handleOpenDialog = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        ...order,
        DELIVERYDATE: order.DELIVERYDATE ? order.DELIVERYDATE.split("T")[0] : "",
        lagen: order.lagen || [],
        stuklijst: order.stuklijst || [],
      });
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

  // Lagen beheer
  const addLaag = () => {
    const lagen = formData.lagen || [];
    if (lagen.length >= 10) {
      toast({ title: "Maximum bereikt", description: "Maximaal 10 lagen toegestaan", variant: "destructive" });
      return;
    }
    const newLaag: Laag = {
      id: Date.now(),
      type: "volkern",
      materiaal: "trespa",
    };
    setFormData({ ...formData, lagen: [...lagen, newLaag] });
  };

  const updateLaag = (id: number, field: keyof Laag, value: string) => {
    const lagen = formData.lagen || [];
    setFormData({
      ...formData,
      lagen: lagen.map((l) => {
        if (l.id !== id) return l;
        if (field === "type") {
          const newType = value as LaagType;
          const defaultMateriaal = newType === "isolatie" ? "Pir" : "trespa";
          return { ...l, type: newType, materiaal: defaultMateriaal };
        }
        return { ...l, [field]: value };
      }),
    });
  };

  const removeLaag = (id: number) => {
    setFormData({ ...formData, lagen: (formData.lagen || []).filter((l) => l.id !== id) });
  };

  // Stuklijst beheer
  const addStuklijstItem = () => {
    const stuklijst = formData.stuklijst || [];
    if (stuklijst.length >= 99) {
      toast({ title: "Maximum bereikt", description: "Maximaal 99 items toegestaan", variant: "destructive" });
      return;
    }
    const newItem: StuklijstItem = {
      id: Date.now(),
      aantal: 1,
      lengte: 0,
      breedte: 0,
      merk: "",
    };
    setFormData({ ...formData, stuklijst: [...stuklijst, newItem] });
  };

  const updateStuklijstItem = (id: number, field: keyof StuklijstItem, value: string | number) => {
    const stuklijst = formData.stuklijst || [];
    setFormData({
      ...formData,
      stuklijst: stuklijst.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const removeStuklijstItem = (id: number) => {
    setFormData({ ...formData, stuklijst: (formData.stuklijst || []).filter((item) => item.id !== id) });
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
        lagen: formData.lagen || [],
        stuklijst: formData.stuklijst || [],
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
        lagen: formData.lagen || [],
        stuklijst: formData.stuklijst || [],
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
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

                    {/* Lagen sectie */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          Lagen ({(formData.lagen || []).length}/10)
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={addLaag} disabled={(formData.lagen || []).length >= 10}>
                          <Plus className="w-4 h-4 mr-1" />
                          Laag toevoegen
                        </Button>
                      </div>
                      
                      <div className="flex gap-4">
                        {/* Lagen lijst */}
                        <div className="flex-1 space-y-2 max-h-[200px] overflow-y-auto">
                          {(formData.lagen || []).map((laag, index) => (
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
                          {(formData.lagen || []).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">Nog geen lagen toegevoegd</p>
                          )}
                        </div>

                        {/* 3D Sandwich weergave */}
                        <div className="w-64 flex flex-col">
                          <span className="text-xs text-muted-foreground mb-2 text-center">3D Preview (sleep om te draaien)</span>
                          <div className="h-48 rounded-lg overflow-hidden border border-border bg-gradient-to-b from-slate-100 to-slate-200">
                            <SandwichPanel3D lagen={formData.lagen || []} />
                          </div>
                        </div>
                      </div>
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
                    {/* Stuklijst sectie */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Stuklijst ({(formData.stuklijst || []).length}/99)</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addStuklijstItem} disabled={(formData.stuklijst || []).length >= 99}>
                          <Plus className="w-4 h-4 mr-1" />
                          Item toevoegen
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-[350px] overflow-y-auto">
                        {(formData.stuklijst || []).map((item, index) => (
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
                        {(formData.stuklijst || []).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">Nog geen items in stuklijst</p>
                        )}
                      </div>
                    </div>

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
                      <TableHead>Lagen</TableHead>
                      <TableHead>Stuklijst</TableHead>
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
                        <TableCell>{(order.lagen || []).length} lagen</TableCell>
                        <TableCell>{(order.stuklijst || []).length} items</TableCell>
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
