import React from 'react';

export default function SkeletonGrid({ count = 8, columns = 4 }) {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[columns] || 'grid-cols-2 md:grid-cols-4';

  return (
    <div className={`grid ${colClass} gap-3 w-full`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="border border-[#D8D2C4] bg-[#FBF9F4] animate-pulse flex flex-col"
        >
          <div className="aspect-[4/3] bg-[#E8E4DA]" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-[#E8E4DA] rounded-[1px] w-1/2" />
            <div className="h-3.5 bg-[#E8E4DA] rounded-[1px] w-full" />
            <div className="h-3 bg-[#E8E4DA] rounded-[1px] w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
