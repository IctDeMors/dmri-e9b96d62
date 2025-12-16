import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";
import { ordersData } from "@/data/orders";
import { startOfWeek, endOfWeek, addWeeks, format, parseISO, getISOWeek, getYear } from "date-fns";
import { nl } from "date-fns/locale";

const PanelenTimeline = () => {
  const orders = ordersData;

  // Get all delivery dates
  const deliveryDates = orders
    .filter(order => order.DELIVERYDATE)
    .map(order => parseISO(order.DELIVERYDATE!.split("T")[0]));

  // Find min and max dates
  const minDate = deliveryDates.length > 0 ? new Date(Math.min(...deliveryDates.map(d => d.getTime()))) : new Date();
  const maxDate = deliveryDates.length > 0 ? new Date(Math.max(...deliveryDates.map(d => d.getTime()))) : new Date();

  // Get start of first week and end of last week
  const firstWeekStart = startOfWeek(minDate, { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(maxDate, { weekStartsOn: 1 });

  // Group orders by week
  const weekCounts: Record<string, number> = {};
  orders.forEach(order => {
    if (order.DELIVERYDATE) {
      const date = parseISO(order.DELIVERYDATE.split("T")[0]);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekKey = format(weekStart, "yyyy-MM-dd");
      weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
    }
  });

  // Generate all weeks including empty ones
  const weeklyData: { weekKey: string; weekStart: Date; weekEnd: Date; displayWeek: string; fullWeek: string; orders: number }[] = [];
  let currentWeek = firstWeekStart;
  
  while (currentWeek <= lastWeekEnd) {
    const weekKey = format(currentWeek, "yyyy-MM-dd");
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekNum = getISOWeek(currentWeek);
    const year = getYear(currentWeek);
    
    weeklyData.push({
      weekKey,
      weekStart: currentWeek,
      weekEnd,
      displayWeek: `W${weekNum}`,
      fullWeek: `Week ${weekNum}, ${year} (${format(currentWeek, "d MMM", { locale: nl })} - ${format(weekEnd, "d MMM", { locale: nl })})`,
      orders: weekCounts[weekKey] || 0,
    });
    
    currentWeek = addWeeks(currentWeek, 1);
  }

  // Calculate cumulative orders
  let cumulative = 0;
  const cumulativeData = weeklyData.map((item) => {
    cumulative += item.orders;
    return { ...item, cumulative };
  });

  const totalOrders = cumulativeData.length > 0 ? cumulativeData[cumulativeData.length - 1].cumulative : 0;
  const weeksWithOrders = weeklyData.filter(w => w.orders > 0).length;

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Totaal Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Totaal Weken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyData.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Weken met Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeksWithOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Gem. Orders per Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {weeklyData.length > 0
                  ? (totalOrders / weeklyData.length).toFixed(1)
                  : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Orders per Week</CardTitle>
            <CardDescription>Aantal orders per week (inclusief lege weken)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                  <XAxis 
                    dataKey="displayWeek" 
                    tick={{ fontSize: 10 }} 
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.fullWeek;
                      }
                      return "";
                    }}
                  />
                  <Bar
                    dataKey="orders"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
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
                    dataKey="displayWeek" 
                    tick={{ fontSize: 10 }} 
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.fullWeek;
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
