import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from "recharts";

interface Order {
  ORDERNO: number;
  OFFERNO: number;
  ALIAS: string;
  NAME: string;
  CUSTOMERREFERENCE1: string;
  CUSTOMERREFERENCE2: string;
  DELIVERYDATE?: string;
}

const PanelenTimeline = () => {
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

  // Group orders by date
  const dateCounts = orders.reduce((acc, order) => {
    if (order.DELIVERYDATE) {
      const date = order.DELIVERYDATE.split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Create timeline data sorted by date
  const timelineData = Object.entries(dateCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({
      date,
      displayDate: new Date(date).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "short",
      }),
      fullDate: new Date(date).toLocaleDateString("nl-NL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      orders: count,
    }));

  // Calculate cumulative orders
  let cumulative = 0;
  const cumulativeData = timelineData.map((item) => {
    cumulative += item.orders;
    return { ...item, cumulative };
  });

  const chartConfig = {
    orders: {
      label: "Orders",
      color: "hsl(var(--primary))",
    },
    cumulative: {
      label: "Cumulatief",
      color: "hsl(var(--chart-2))",
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
              <h1 className="text-xl font-bold text-white">Panelen Tijdlijn</h1>
              <p className="text-white/70 text-sm">Orders per leveringsdatum</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Totaal Geplande Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cumulativeData.length > 0 ? cumulativeData[cumulativeData.length - 1].cumulative : 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aantal Leverdagen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{timelineData.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Gem. Orders per Dag</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {timelineData.length > 0
                  ? (cumulativeData[cumulativeData.length - 1].cumulative / timelineData.length).toFixed(1)
                  : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Tijdlijn</CardTitle>
            <CardDescription>Aantal orders per leveringsdatum</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 10 }} 
                    interval="preserveStartEnd"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.fullDate;
                      }
                      return "";
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorOrders)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Cumulative Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cumulatieve Orders</CardTitle>
            <CardDescription>Totaal aantal orders over tijd</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeData} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 10 }} 
                    interval="preserveStartEnd"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.fullDate;
                      }
                      return "";
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PanelenTimeline;
