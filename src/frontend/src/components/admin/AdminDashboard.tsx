import {
  getCustomers,
  getDesigns,
  getOrders,
  getPayments,
} from "../../lib/storage";

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  emoji: string;
}

function StatCard({ label, value, color, emoji }: StatCardProps) {
  return (
    <div className={`bg-card rounded-2xl shadow-card p-4 ${color}`}>
      <div className="text-2xl mb-1">{emoji}</div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
        {label}
      </p>
    </div>
  );
}

export function AdminDashboard() {
  const designs = getDesigns();
  const customers = getCustomers();
  const orders = getOrders();
  const payments = getPayments();

  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => new Date(o.orderDate).toDateString() === today,
  );
  const pendingOrders = orders.filter((o) => o.status === "Pending");
  const cuttingOrders = orders.filter((o) => o.status === "Cutting");
  const stitchingOrders = orders.filter((o) => o.status === "Stitching");
  const readyOrders = orders.filter((o) => o.status === "Ready");
  const completedOrders = orders.filter((o) => o.status === "Completed");
  const activeOrders = orders.filter((o) => o.status !== "Completed");

  const totalCharged = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = orders.filter(
    (o) => o.totalAmount > 0 && o.advancePaid < o.totalAmount,
  );

  const stats = [
    {
      label: "Total Designs",
      value: designs.length,
      color: "border-l-4 border-l-primary/50",
      emoji: "🧵",
    },
    {
      label: "Total Customers",
      value: customers.length,
      color: "border-l-4 border-l-blue-400",
      emoji: "👥",
    },
    {
      label: "Active Orders",
      value: activeOrders.length,
      color: "border-l-4 border-l-amber-400",
      emoji: "📋",
    },
    {
      label: "Today's Orders",
      value: todayOrders.length,
      color: "border-l-4 border-l-green-400",
      emoji: "📅",
    },
    {
      label: "Pending Orders",
      value: pendingOrders.length,
      color: "border-l-4 border-l-yellow-400",
      emoji: "⏳",
    },
    {
      label: "Cutting",
      value: cuttingOrders.length,
      color: "border-l-4 border-l-cyan-400",
      emoji: "✂️",
    },
    {
      label: "Stitching",
      value: stitchingOrders.length,
      color: "border-l-4 border-l-purple-400",
      emoji: "🪡",
    },
    {
      label: "Ready",
      value: readyOrders.length,
      color: "border-l-4 border-l-emerald-400",
      emoji: "✅",
    },
    {
      label: "Completed",
      value: completedOrders.length,
      color: "border-l-4 border-l-gray-400",
      emoji: "🎉",
    },
    {
      label: "Pending Payments",
      value: pendingPayments.length,
      color: "border-l-4 border-l-red-400",
      emoji: "💰",
    },
  ];

  return (
    <div className="p-4">
      <div className="mb-4 bg-primary/5 border border-primary/20 rounded-xl p-3">
        <p className="text-xs text-muted-foreground">Revenue Overview</p>
        <div className="flex gap-4 mt-1">
          <div>
            <p className="text-lg font-bold text-foreground">
              ₹{totalCharged.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">Total Charged</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">
              ₹{totalPaid.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">Total Collected</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">
              ₹{Math.max(0, totalCharged - totalPaid).toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">Balance Due</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            emoji={stat.emoji}
          />
        ))}
      </div>
    </div>
  );
}
