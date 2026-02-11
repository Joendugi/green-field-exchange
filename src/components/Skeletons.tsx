import { Skeleton } from "@/components/ui/skeleton";

interface ProductCardSkeletonProps {
    count?: number;
}

export const ProductCardSkeleton = ({ count = 1 }: ProductCardSkeletonProps) => {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card overflow-hidden">
                    {/* Image placeholder - fixed aspect ratio prevents CLS */}
                    <div className="aspect-[4/3] bg-muted animate-pulse" />
                    <div className="p-4 space-y-3">
                        {/* Title */}
                        <Skeleton className="h-5 w-3/4" />
                        {/* Price */}
                        <Skeleton className="h-4 w-1/4" />
                        {/* Description */}
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                        </div>
                        {/* Location */}
                        <Skeleton className="h-3 w-1/2" />
                        {/* Button */}
                        <Skeleton className="h-9 w-full mt-4" />
                    </div>
                </div>
            ))}
        </>
    );
};

export const ProfileCardSkeleton = () => {
    return (
        <div className="rounded-lg border bg-card overflow-hidden">
            {/* Banner */}
            <div className="h-32 bg-muted animate-pulse" />
            <div className="p-6 -mt-16">
                <div className="flex gap-6">
                    {/* Avatar */}
                    <Skeleton className="h-32 w-32 rounded-full shrink-0" />
                    {/* Info */}
                    <div className="flex-1 pt-8 space-y-3">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-5 w-24 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const DashboardSkeleton = () => {
    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-6">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4" />
                        </div>
                        <Skeleton className="h-8 w-16 mt-2" />
                    </div>
                ))}
            </div>
            {/* Content area */}
            <div className="rounded-lg border bg-card p-6 min-h-[300px]">
                <Skeleton className="h-5 w-32 mb-4" />
                <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </div>
        </div>
    );
};

export const MessagesSkeleton = () => {
    return (
        <div className="grid md:grid-cols-3 gap-4 h-[600px]">
            {/* Sidebar */}
            <div className="border rounded-lg p-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                    </div>
                ))}
            </div>
            {/* Chat area */}
            <div className="md:col-span-2 border rounded-lg p-4 flex flex-col">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="flex-1" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
};
