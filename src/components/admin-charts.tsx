// Admin charts (recharts). Imported via React.lazy + Suspense from the admin
// pages so the chart library never blocks the admin first paint.
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";

export type CategoryDatum = { name: string; value: number; fill: string };
export type DayDatum = { name: string; visits: number };

export function CategoryCharts({ data }: { data: CategoryDatum[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-display font-bold">Tools per category</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Count of tools in each category.</p>
        </div>
        <div className="h-72 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value">{data.map((e) => <Cell key={e.name} fill={e.fill} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-display font-bold">Tools by category (share)</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Same catalogue, as a share of all tools.</p>
        </div>
        <div className="h-72 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label>
                {data.map((e) => <Cell key={e.name} fill={e.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function UsageBarChart({ data }: { data: DayDatum[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="visits" fill="#2b3a67" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
