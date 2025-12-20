import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, Layers, ChevronRight, ChevronLeft, Package, Copy, Download, FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
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

type LaagType = "Volkern" | "Isolatie";

interface ArtikelData {
  DESCRIPTION: string;
  Artikel: string;
  AcCOUNTNO: number;
  OPTIMCODE: string;
  XDIMSIZE: number;
  YDIMSIZE: number;
  ZDIMSIZE: number;
  ALIAS: string;
  CODE: string;
  Artikelgroep: string;
  Eenheid: string;
  Laagtype: LaagType;
}

interface Laag {
  id: number;
  type: LaagType;
  artikelgroep: string;
  artikel: string;
  optimcode: string;
  description: string;
  dikte: number; // ZDIMSIZE in mm
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
}

const STORAGE_KEY = "panelen_custom_orders";
const COUNTER_KEY = "panelen_order_counter";

const migrateOrder = (order: Order): Order => {
  // Ensure samenstellingen exists
  if (!order.samenstellingen) {
    return {
      ...order,
      samenstellingen: [{
        id: Date.now(),
        naam: "Samenstelling 1",
        lagen: [],
        stuklijst: [],
      }],
    };
  }
  return order;
};

const PanelenOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [artikelen, setArtikelen] = useState<ArtikelData[]>([]);
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

  // Load artikelen from JSON
  useEffect(() => {
    fetch("/Artikelen.json")
      .then((res) => res.text())
      .then((text) => {
        // Fix malformed JSON: remove BOM and wrap in array if needed
        let cleanText = text.replace(/^\uFEFF/, '').trim();
        if (!cleanText.startsWith('[')) {
          cleanText = '[' + cleanText + ']';
        }
        const data: ArtikelData[] = JSON.parse(cleanText);
        setArtikelen(data);
      })
      .catch((err) => console.error("Error loading artikelen:", err));
  }, []);

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

  // Get unique artikelgroepen per laagtype
  const getArtikelgroepen = (laagtype: LaagType): string[] => {
    const groepen = new Set<string>();
    artikelen
      .filter((a) => a.Laagtype === laagtype && a.Artikelgroep && a.Artikelgroep.trim() !== "")
      .forEach((a) => groepen.add(a.Artikelgroep));
    return Array.from(groepen).filter(g => g && g.trim() !== "").sort();
  };

  // Get unique artikelen per artikelgroep (1 per OPTIMCODE)
  const getArtikelenByGroep = (artikelgroep: string): ArtikelData[] => {
    const seenOptimcodes = new Set<string>();
    return artikelen
      .filter((a) => a.Artikelgroep === artikelgroep && a.OPTIMCODE && a.OPTIMCODE.trim() !== "")
      .filter((a) => {
        if (seenOptimcodes.has(a.OPTIMCODE)) return false;
        seenOptimcodes.add(a.OPTIMCODE);
        return true;
      })
      .sort((a, b) => a.DESCRIPTION.localeCompare(b.DESCRIPTION));
  };

  const saveOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
  };

  const resetForm = () => {
    // Start with 1 default samenstelling
    const defaultSamenstelling: Samenstelling = {
      id: Date.now(),
      naam: "Samenstelling 1",
      lagen: [],
      stuklijst: [],
    };
    setFormData({
      ALIAS: "",
      NAME: "",
      CUSTOMERREFERENCE1: "",
      CUSTOMERREFERENCE2: "",
      DELIVERYDATE: "",
      samenstellingen: [defaultSamenstelling],
    });
    setActiveSamenstellingId(String(defaultSamenstelling.id));
    setEditingOrder(null);
    setFormStep(1);
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

  const copySamenstelling = (id: number) => {
    const samenstellingen = formData.samenstellingen || [];
    if (samenstellingen.length >= 10) {
      toast({ title: "Maximum bereikt", description: "Maximaal 10 samenstellingen toegestaan", variant: "destructive" });
      return;
    }
    const original = samenstellingen.find((s) => s.id === id);
    if (!original) return;
    
    const newSamenstelling: Samenstelling = {
      id: Date.now(),
      naam: `${original.naam} (kopie)`,
      lagen: original.lagen.map((l) => ({ ...l, id: Date.now() + Math.random() * 1000 })),
      stuklijst: original.stuklijst.map((s) => ({ ...s, id: Date.now() + Math.random() * 1000 })),
    };
    const newSamenstellingen = [...samenstellingen, newSamenstelling];
    setFormData({ ...formData, samenstellingen: newSamenstellingen });
    setActiveSamenstellingId(String(newSamenstelling.id));
    toast({ title: "Gekopieerd", description: `${original.naam} is gekopieerd` });
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
      type: "Volkern",
      artikelgroep: "",
      artikel: "",
      optimcode: "",
      description: "",
      dikte: 0,
    };
    setFormData({
      ...formData,
      samenstellingen: (formData.samenstellingen || []).map((s) =>
        s.id === samenstelling.id ? { ...s, lagen: [...s.lagen, newLaag] } : s
      ),
    });
  };

  const updateLaagType = (id: number, newType: LaagType) => {
    const samenstelling = getActiveSamenstelling();
    if (!samenstelling) return;
    setFormData({
      ...formData,
      samenstellingen: (formData.samenstellingen || []).map((s) =>
        s.id === samenstelling.id
          ? {
              ...s,
              lagen: s.lagen.map((l) =>
                l.id === id
                  ? { ...l, type: newType, artikelgroep: "", artikel: "", optimcode: "", description: "", dikte: 0 }
                  : l
              ),
            }
          : s
      ),
    });
  };

  const updateLaagArtikelgroep = (id: number, artikelgroep: string) => {
    const samenstelling = getActiveSamenstelling();
    if (!samenstelling) return;
    setFormData({
      ...formData,
      samenstellingen: (formData.samenstellingen || []).map((s) =>
        s.id === samenstelling.id
          ? {
              ...s,
              lagen: s.lagen.map((l) =>
                l.id === id
                  ? { ...l, artikelgroep, artikel: "", optimcode: "", description: "", dikte: 0 }
                  : l
              ),
            }
          : s
      ),
    });
  };

  const updateLaagArtikel = (id: number, optimcode: string) => {
    const samenstelling = getActiveSamenstelling();
    if (!samenstelling) return;
    const artikel = artikelen.find((a) => a.OPTIMCODE === optimcode);
    setFormData({
      ...formData,
      samenstellingen: (formData.samenstellingen || []).map((s) =>
        s.id === samenstelling.id
          ? {
              ...s,
              lagen: s.lagen.map((l) =>
                l.id === id
                  ? {
                      ...l,
                      artikel: artikel?.Artikel || "",
                      optimcode: optimcode,
                      description: artikel?.DESCRIPTION || "",
                      dikte: artikel?.ZDIMSIZE || 0,
                    }
                  : l
              ),
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

  const exportOrderToPDF = async (order: Order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // ===== PAGE 1: Cover page with image =====
    try {
      // Load cover image
      const coverImg = new Image();
      coverImg.crossOrigin = "anonymous";
      
      await new Promise<void>((resolve, reject) => {
        coverImg.onload = () => resolve();
        coverImg.onerror = () => reject(new Error("Failed to load cover image"));
        coverImg.src = "/images/offerte-cover.jpg";
      });

      // Add cover image - full page
      const imgRatio = coverImg.height / coverImg.width;
      const imgWidth = pageWidth;
      const imgHeight = imgWidth * imgRatio;
      
      // Center vertically if image is shorter than page
      const imgY = imgHeight >= pageHeight ? 0 : 0;
      doc.addImage(coverImg, "JPEG", 0, imgY, imgWidth, Math.min(imgHeight, pageHeight));
    } catch (err) {
      console.error("Could not load cover image:", err);
      // Fallback: draw a simple cover without image
      doc.setFillColor(12, 58, 131);
      doc.rect(0, 0, pageWidth, pageHeight * 0.6, "F");
    }

    // Add "Offerte" title on cover
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Offerte", margin, pageHeight * 0.35);

    // Add order name / reference on cover
    doc.setFontSize(20);
    doc.setFont("helvetica", "normal");
    const orderTitle = order.CUSTOMERREFERENCE1 || order.NAME || `Order ${order.ORDERNO}`;
    doc.text(orderTitle, margin, pageHeight * 0.35 + 15);

    // Add order number
    doc.setFontSize(14);
    doc.text(`${order.OFFERNO || order.ORDERNO}`, margin, pageHeight * 0.35 + 28);

    // Reset text color for next pages
    doc.setTextColor(0, 0, 0);

    // ===== PAGE 2+: Content pages =====
    doc.addPage();
    let yPos = 20;

    const addHeader = () => {
      // Header: OFFERTE / Order title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("OFFERTE", margin, yPos);
      yPos += 12;

      // Customer info and order details side by side
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      // Left side - Customer
      doc.text("De Mors BV", margin, yPos);
      yPos += 5;
      if (order.NAME) {
        doc.text(`T.a.v. ${order.NAME}`, margin, yPos);
        yPos += 5;
      }
      yPos += 5;

      // Right side - Order details
      const rightCol = pageWidth - margin - 60;
      let rightY = yPos - 15;
      doc.setFont("helvetica", "bold");
      doc.text("Offertenr. :", rightCol, rightY);
      doc.setFont("helvetica", "normal");
      doc.text(`${order.OFFERNO || order.ORDERNO}`, rightCol + 30, rightY);
      rightY += 5;
      
      doc.setFont("helvetica", "bold");
      doc.text("Ordernr. :", rightCol, rightY);
      doc.setFont("helvetica", "normal");
      doc.text(`${order.ORDERNO}`, rightCol + 30, rightY);
      rightY += 5;

      if (order.CUSTOMERREFERENCE1) {
        doc.setFont("helvetica", "bold");
        doc.text("Uw referentie :", rightCol, rightY);
        doc.setFont("helvetica", "normal");
        doc.text(`${order.CUSTOMERREFERENCE1}`, rightCol + 30, rightY);
        rightY += 5;
      }

      if (order.DELIVERYDATE) {
        doc.setFont("helvetica", "bold");
        doc.text("Leverdatum :", rightCol, rightY);
        doc.setFont("helvetica", "normal");
        doc.text(`${formatDate(order.DELIVERYDATE)}`, rightCol + 30, rightY);
      }

      yPos += 15;

      // Horizontal line
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
    };

    addHeader();

    // Build table data for each samenstelling
    const tableBody: any[][] = [];
    let regelNr = 0;

    (order.samenstellingen || []).forEach((sam) => {
      regelNr++;
      
      // Calculate total thickness
      const totalDikte = sam.lagen.reduce((acc, laag) => acc + (laag.dikte || 0), 0);
      
      // Build description with layers
      const laagDescriptions = sam.lagen.map((laag) => {
        const dikteStr = laag.dikte ? `${laag.dikte} MM` : "";
        return `${dikteStr} ${laag.artikelgroep || laag.type}`.trim();
      }).filter(d => d).join("\n");
      
      const hoofdOmschrijving = `SANDWICHPANEEL Totale pakketdikte ${totalDikte} mm\n${laagDescriptions}`;
      
      // Add main row with first stuklijst item
      if (sam.stuklijst.length > 0) {
        const firstItem = sam.stuklijst[0];
        tableBody.push([
          `${regelNr.toString().padStart(2, '0')}.`,
          hoofdOmschrijving,
          `${firstItem.lengte} x ${firstItem.breedte}`,
          firstItem.aantal.toString(),
          firstItem.merk || "",
          ""
        ]);

        // Add remaining stuklijst items as sub-rows
        for (let i = 1; i < sam.stuklijst.length; i++) {
          const item = sam.stuklijst[i];
          tableBody.push([
            "",
            "",
            `${item.lengte} x ${item.breedte}`,
            item.aantal.toString(),
            item.merk || "",
            ""
          ]);
        }

        // Add totaal row
        const totalAantal = sam.stuklijst.reduce((acc, item) => acc + item.aantal, 0);
        const totalM2 = sam.stuklijst.reduce((acc, item) => {
          return acc + (item.aantal * item.lengte * item.breedte / 1000000);
        }, 0);
        tableBody.push([
          "",
          "Totaal",
          "",
          totalAantal.toString(),
          `${totalM2.toFixed(2)} m²`,
          ""
        ]);
      } else {
        tableBody.push([
          `${regelNr.toString().padStart(2, '0')}.`,
          hoofdOmschrijving,
          "-",
          "-",
          "-",
          ""
        ]);
      }
    });

    // Create the main table
    autoTable(doc, {
      head: [["Regel", "Omschrijving", "Afmeting", "Aantal", "Eenheid", "Bedrag"]],
      body: tableBody,
      startY: yPos,
      styles: { 
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      headStyles: { 
        fillColor: [12, 58, 131],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 25 },
        3: { cellWidth: 15, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 20, halign: 'right' },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        // Make "Totaal" row bold
        if (data.row.raw && Array.isArray(data.row.raw) && data.row.raw[1] === "Totaal") {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Check if we need a new page for footer content
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    // Footer info
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Offerte geldig tot : 30 dagen na offertedatum`, margin, yPos);
    yPos += 5;
    doc.text(`Prijs : Netto excl. BTW`, margin, yPos);
    yPos += 5;
    if (order.DELIVERYDATE) {
      doc.text(`Levertijd : ${formatDate(order.DELIVERYDATE)}`, margin, yPos);
      yPos += 5;
    }
    yPos += 10;

    // Closing
    doc.text("Wij hopen u hiermee een passende aanbieding te hebben gemaakt.", margin, yPos);
    yPos += 10;
    doc.text("Met vriendelijke groet,", margin, yPos);
    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.text("De Mors BV", margin, yPos);

    // Add page numbers (skip cover page)
    const totalPagesCount = doc.getNumberOfPages();
    for (let i = 2; i <= totalPagesCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`PAGINA ${i - 1} / ${totalPagesCount - 1}`, pageWidth - margin - 25, pageHeight - 10);
    }

    doc.save(`offerte-${order.ORDERNO}.pdf`);
    toast({ title: "Geëxporteerd", description: `Offerte PDF voor order ${order.ORDERNO} is gedownload` });
  };

  const exportOrderToExcel = (order: Order) => {
    const wb = XLSX.utils.book_new();

    // Order info sheet
    const orderInfo = [{
      "Order Nr": order.ORDERNO,
      "Naam": order.NAME,
      "Alias": order.ALIAS || "",
      "Klantreferentie 1": order.CUSTOMERREFERENCE1 || "",
      "Klantreferentie 2": order.CUSTOMERREFERENCE2 || "",
      "Leverdatum": formatDate(order.DELIVERYDATE),
      "Aantal Samenstellingen": (order.samenstellingen || []).length,
    }];
    const wsOrder = XLSX.utils.json_to_sheet(orderInfo);
    XLSX.utils.book_append_sheet(wb, wsOrder, "Order Info");

    // Stuklijst sheet
    const stuklijstData: any[] = [];
    (order.samenstellingen || []).forEach((sam) => {
      sam.stuklijst.forEach((item, idx) => {
        stuklijstData.push({
          "Samenstelling": sam.naam,
          "#": idx + 1,
          "Aantal": item.aantal,
          "Lengte (mm)": item.lengte,
          "Breedte (mm)": item.breedte,
          "Merk": item.merk || "",
        });
      });
    });
    if (stuklijstData.length > 0) {
      const wsStuklijst = XLSX.utils.json_to_sheet(stuklijstData);
      XLSX.utils.book_append_sheet(wb, wsStuklijst, "Stuklijst");
    }

    // Lagen sheet
    const lagenData: any[] = [];
    (order.samenstellingen || []).forEach((sam) => {
      sam.lagen.forEach((laag, idx) => {
        lagenData.push({
          "Samenstelling": sam.naam,
          "#": idx + 1,
          "Type": laag.type,
          "Artikelgroep": laag.artikelgroep,
          "Artikel": laag.artikel,
          "Omschrijving": laag.description,
        });
      });
    });
    if (lagenData.length > 0) {
      const wsLagen = XLSX.utils.json_to_sheet(lagenData);
      XLSX.utils.book_append_sheet(wb, wsLagen, "Lagen");
    }

    XLSX.writeFile(wb, `order-${order.ORDERNO}.xlsx`);
    toast({ title: "Geëxporteerd", description: `Excel voor order ${order.ORDERNO} is gedownload` });
  };

  const exportOrderToJSON = (order: Order) => {
    const exportData = {
      ordernummer: order.ORDERNO,
      offernummer: order.OFFERNO,
      naam: order.NAME,
      alias: order.ALIAS,
      klantreferentie1: order.CUSTOMERREFERENCE1,
      klantreferentie2: order.CUSTOMERREFERENCE2,
      leverdatum: order.DELIVERYDATE,
      samenstellingen: (order.samenstellingen || []).map((sam) => ({
        naam: sam.naam,
        lagen: sam.lagen.map((l) => ({ type: l.type, artikelgroep: l.artikelgroep, artikel: l.artikel, description: l.description })),
        stuklijst: sam.stuklijst.map((s) => ({
          aantal: s.aantal,
          lengte: s.lengte,
          breedte: s.breedte,
          merk: s.merk,
        })),
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-${order.ORDERNO}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Geëxporteerd", description: `JSON voor order ${order.ORDERNO} is gedownload` });
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
                              {/* Samenstelling naam en acties */}
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
                                  onClick={() => copySamenstelling(samenstelling.id)}
                                  title="Kopieer samenstelling"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeSamenstelling(samenstelling.id)}
                                  className="text-destructive hover:text-destructive"
                                  title="Verwijder samenstelling"
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
                                      <div key={laag.id} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-md">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium w-8">#{index + 1}</span>
                                          <Select value={laag.type} onValueChange={(v) => updateLaagType(laag.id, v as LaagType)}>
                                            <SelectTrigger className="w-[120px]">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Volkern">Volkern</SelectItem>
                                              <SelectItem value="Isolatie">Isolatie</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <Select value={laag.artikelgroep} onValueChange={(v) => updateLaagArtikelgroep(laag.id, v)}>
                                            <SelectTrigger className="w-[180px]">
                                              <SelectValue placeholder="Kies artikelgroep" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {getArtikelgroepen(laag.type).map((groep) => (
                                                <SelectItem key={groep} value={groep}>{groep}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <Button type="button" variant="ghost" size="icon" onClick={() => removeLaag(laag.id)} className="text-destructive hover:text-destructive ml-auto">
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                        {laag.artikelgroep && (
                                          <div className="ml-10">
                                            <Select value={laag.optimcode} onValueChange={(v) => updateLaagArtikel(laag.id, v)}>
                                              <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Kies artikel" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {getArtikelenByGroep(laag.artikelgroep).map((art) => (
                                                  <SelectItem key={art.OPTIMCODE} value={art.OPTIMCODE}>
                                                    {art.DESCRIPTION}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        )}
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
                            <Button variant="ghost" size="icon" onClick={() => exportOrderToPDF(order)} title="Export PDF">
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => exportOrderToExcel(order)} title="Export Excel">
                              <FileSpreadsheet className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => exportOrderToJSON(order)} title="Export JSON">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(order)} title="Bewerken">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(order.ORDERNO)} className="text-destructive hover:text-destructive" title="Verwijderen">
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
