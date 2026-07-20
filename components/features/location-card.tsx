import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LocationCardProps {
  location?: string;
}

export default function LocationCard({ location }: LocationCardProps) {
  return (
    <Card className="flex items-center justify-center h-16 p-4">
      <CardContent className="p-0">
        {location ? (
          <h2 className="text-xl font-semibold text-center text-card-foreground">
            {location}
          </h2>
        ) : (
          <Skeleton className="w-48 h-8" />
        )}
      </CardContent>
    </Card>
  );
}
