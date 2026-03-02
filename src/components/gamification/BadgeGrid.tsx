import { BadgeCard, BadgeData } from "./BadgeCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface BadgeGridProps {
  badges: BadgeData[];
  earnedBadgeIds: string[];
}

export function BadgeGrid({ badges, earnedBadgeIds }: BadgeGridProps) {
  if (earnedBadgeIds.length === 0) {
    return (
      <EmptyState
        icon={<span className="text-5xl block mb-2">🏅</span>}
        title="No badges earned yet"
        description="Complete habits consistently to unlock your first badge!"
        className="py-16"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {badges.map((badge) => (
        <BadgeCard
          key={badge.id}
          badge={badge}
          isLocked={!earnedBadgeIds.includes(badge.id)}
        />
      ))}
    </div>
  );
}
