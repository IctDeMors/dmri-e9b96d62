import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Users, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DataTable from "@/components/DataTable";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Order {
  ORDERNO: number;
  OFFERNO: number;
  ALIAS: string;
  NAME: string;
  CUSTOMERREFERENCE1: string;
  CUSTOMERREFERENCE2: string;
  DELIVERYDATE?: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(280, 65%, 60%)",
];

const PanelenDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/orders.json")
      .then((response) => response.json())
      .then((data) => {
        setOrders(data.Orders || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading orders:", error);
        setLoading(false);
      });
  }, []);

  // Calculate statistics
  const totalOrders = orders.length;
  const uniqueCustomers = new Set(orders.map((o) => o.ALIAS)).size;
  const ordersWithDeliveryDate = orders.filter((o) => o.DELIVERYDATE).length;

  // Orders per customer for chart
  const customerCounts = orders.reduce((acc, order) => {
    acc[order.NAME] = (acc[order.NAME] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCustomers = Object.entries(customerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name: name.length > 20 ? name.substring(0, 20) + "..." : name, orders: count }));

  // Orders per month
  const monthCounts = orders.reduce((acc, order) => {
    if (order.DELIVERYDATE) {
      const date = new Date(order.DELIVERYDATE);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const monthlyData = Object.entries(monthCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({
      month: new Date(month + "-01").toLocaleDateString("nl-NL", { month: "short", year: "2-digit" }),
      orders: count,
    }));

  const tableData = orders.map((order) => ({
    "Order Nr": order.ORDERNO,
    "Offerte Nr": order.OFFERNO,
    Klant: order.NAME,
    Alias: order.ALIAS,
    "Referentie 1": order.CUSTOMERREFERENCE1,
    "Referentie 2": order.CUSTOMERREFERENCE2,
    Leverdatum: order.DELIVERYDATE
      ? new Date(order.DELIVERYDATE).toLocaleDateString("nl-NL")
      : "-",
  }));

  const columns = ["Order Nr", "Offerte Nr", "Klant", "Alias", "Referentie 1", "Referentie 2", "Leverdatum"];

  const chartConfig = {
    orders: {
      label: "Orders",
      color: "hsl(var(--primary))",
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-[#0c3a83]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/panelen">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Panelen Dashboard</h1>
              <p className="text-white/70 text-sm">Overzicht van orders</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">orders in systeem</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unieke Klanten</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueCustomers}</div>
              <p className="text-xs text-muted-foreground">verschillende klanten</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Met Leverdatum</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordersWithDeliveryDate}</div>
              <p className="text-xs text-muted-foreground">orders gepland</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gem. per Klant</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {uniqueCustomers > 0 ? (totalOrders / uniqueCustomers).toFixed(1) : 0}
              </div>
              <p className="text-xs text-muted-foreground">orders gemiddeld</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Klanten</CardTitle>
              <CardDescription>Aantal orders per klant</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCustomers} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="orders" fill="hsl(var(--primary))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Monthly Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Orders per Maand</CardTitle>
              <CardDescription>Verdeling van leverdata</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ left: 0, right: 20 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="orders" fill="hsl(var(--primary))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <DataTable data={tableData} columns={columns} />
      </main>
    </div>
  );
};

export default PanelenDashboard;
