import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function BadgeGrid() {
  const mockBadges = [
    { id: "1", name: "Early Bird", description: "Completed 5 habits before 8 AM", icon: "🌅", unlocked: true },
    { id: "2", name: "Streak Master", description: "Achieved a 7-day streak", icon: "🔥", unlocked: true },
    { id: "3", name: "Consistency", description: "Completed all habits for a week", icon: "⭐", unlocked: false },
    { id: "4", name: "Night Owl", description: "Completed 5 habits after 10 PM", icon: "🦉", unlocked: false },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {mockBadges.map((badge) => (
        <Card
          key={badge.id}
          className={`p-4 flex flex-col items-center justify-center text-center gap-2 transition-all ${
            badge.unlocked ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-dashed opacity-50 grayscale"
          }`}
        >
          <div className="text-4xl mb-1">{badge.icon}</div>
          <div className="font-semibold text-sm">{badge.name}</div>
          <p className="text-xs text-muted-foreground line-clamp-2">{badge.description}</p>
          {badge.unlocked && (
            <Badge variant="default" className="mt-2 text-[10px] px-1.5 py-0 h-4">
              Unlocked
            </Badge>
          )}
        </Card>
      ))}
    </div>
  );
}
