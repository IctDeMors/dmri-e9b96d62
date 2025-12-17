import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";

interface Order {
  ORDERNO: number;
  OFFERNO: number;
  ALIAS: string;
  NAME: string;
  CUSTOMERREFERENCE1: string;
  CUSTOMERREFERENCE2: string;
  DELIVERYDATE?: string;
}

const STORAGE_KEY = "panelen_custom_orders";

const PanelenOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<Partial<Order>>({
    ORDERNO: 0,
    OFFERNO: 0,
    ALIAS: "",
    NAME: "",
    CUSTOMERREFERENCE1: "",
    CUSTOMERREFERENCE2: "",
    DELIVERYDATE: "",
  });

  // Load orders from localStorage
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

  // Save orders to localStorage
  const saveOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
  };

  const resetForm = () => {
    setFormData({
      ORDERNO: 0,
      OFFERNO: 0,
      ALIAS: "",
      NAME: "",
      CUSTOMERREFERENCE1: "",
      CUSTOMERREFERENCE2: "",
      DELIVERYDATE: "",
    });
    setEditingOrder(null);
  };

  const handleOpenDialog = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        ...order,
        DELIVERYDATE: order.DELIVERYDATE ? order.DELIVERYDATE.split("T")[0] : "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ORDERNO || !formData.NAME) {
      toast({
        title: "Fout",
        description: "Ordernummer en naam zijn verplicht",
        variant: "destructive",
      });
      return;
    }

    const orderData: Order = {
      ORDERNO: Number(formData.ORDERNO),
      OFFERNO: Number(formData.OFFERNO) || 0,
      ALIAS: formData.ALIAS || "",
      NAME: formData.NAME || "",
      CUSTOMERREFERENCE1: formData.CUSTOMERREFERENCE1 || "",
      CUSTOMERREFERENCE2: formData.CUSTOMERREFERENCE2 || "",
      DELIVERYDATE: formData.DELIVERYDATE
        ? `${formData.DELIVERYDATE}T00:00:00`
        : undefined,
    };

    let newOrders: Order[];
    if (editingOrder) {
      newOrders = orders.map((o) =>
        o.ORDERNO === editingOrder.ORDERNO ? orderData : o
      );
      toast({ title: "Succes", description: "Order bijgewerkt" });
    } else {
      // Check if order number already exists
      if (orders.some((o) => o.ORDERNO === orderData.ORDERNO)) {
        toast({
          title: "Fout",
          description: "Ordernummer bestaat al",
          variant: "destructive",
        });
        return;
      }
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
      {/* Header */}
      <header className="border-b border-border bg-[#0c3a83]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/panelen">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 -ml-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Orders Beheren</h1>
                <p className="text-white/70 text-sm">
                  Aanmaken, bewerken en bekijken van orders
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-white text-[#0c3a83] hover:bg-white/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nieuwe Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingOrder ? "Order Bewerken" : "Nieuwe Order"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ORDERNO">Ordernummer *</Label>
                      <Input
                        id="ORDERNO"
                        type="number"
                        value={formData.ORDERNO || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, ORDERNO: Number(e.target.value) })
                        }
                        disabled={!!editingOrder}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="OFFERNO">Offertenummer</Label>
                      <Input
                        id="OFFERNO"
                        type="number"
                        value={formData.OFFERNO || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, OFFERNO: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="NAME">Naam *</Label>
                    <Input
                      id="NAME"
                      value={formData.NAME || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, NAME: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ALIAS">Alias</Label>
                    <Input
                      id="ALIAS"
                      value={formData.ALIAS || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, ALIAS: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="CUSTOMERREFERENCE1">Klantreferentie 1</Label>
                    <Input
                      id="CUSTOMERREFERENCE1"
                      value={formData.CUSTOMERREFERENCE1 || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          CUSTOMERREFERENCE1: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="CUSTOMERREFERENCE2">Klantreferentie 2</Label>
                    <Input
                      id="CUSTOMERREFERENCE2"
                      value={formData.CUSTOMERREFERENCE2 || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          CUSTOMERREFERENCE2: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="DELIVERYDATE">Leverdatum</Label>
                    <Input
                      id="DELIVERYDATE"
                      type="date"
                      value={formData.DELIVERYDATE || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, DELIVERYDATE: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Annuleren
                    </Button>
                    <Button type="submit">
                      <Save className="w-4 h-4 mr-2" />
                      {editingOrder ? "Opslaan" : "Aanmaken"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Orders ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nog geen orders aangemaakt.</p>
                <p className="text-sm mt-1">
                  Klik op "Nieuwe Order" om te beginnen.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ordernr</TableHead>
                      <TableHead>Offertenr</TableHead>
                      <TableHead>Naam</TableHead>
                      <TableHead>Alias</TableHead>
                      <TableHead>Referentie</TableHead>
                      <TableHead>Leverdatum</TableHead>
                      <TableHead className="text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.ORDERNO}>
                        <TableCell className="font-mono">
                          {order.ORDERNO}
                        </TableCell>
                        <TableCell className="font-mono">
                          {order.OFFERNO || "-"}
                        </TableCell>
                        <TableCell>{order.NAME}</TableCell>
                        <TableCell>{order.ALIAS || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {order.CUSTOMERREFERENCE1 || "-"}
                        </TableCell>
                        <TableCell>{formatDate(order.DELIVERYDATE)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(order)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(order.ORDERNO)}
                              className="text-destructive hover:text-destructive"
                            >
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
