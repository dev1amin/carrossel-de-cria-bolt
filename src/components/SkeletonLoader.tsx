import React from 'react';

export const PostCardSkeleton: React.FC = () => {
  return (
    <div className="relative w-full max-w-[300px] bg-white rounded-lg overflow-hidden shadow-md flex flex-col animate-pulse">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
      </div>

      {/* Content Area */}
      <div className="relative w-full bg-gray-200" style={{ paddingBottom: '140%' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      {/* Buttons Section */}
      <div className="p-3 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export const NewsCardSkeleton: React.FC = () => {
  return (
    <div className="relative w-full max-w-[300px] rounded-2xl overflow-hidden shadow-lg bg-white flex flex-col animate-pulse">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between text-gray-800 border-b border-gray-200">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
      </div>

      {/* Content Area */}
      <div className="relative w-full" style={{ paddingBottom: '140%' }}>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden bg-white">
          {/* Image Skeleton */}
          <div className="relative w-full h-[200px] bg-gray-200">
            <div className="absolute top-2 left-2 flex gap-1">
              <div className="h-6 w-16 bg-gray-300 rounded-lg"></div>
              <div className="h-6 w-12 bg-gray-300 rounded-lg"></div>
            </div>
          </div>

          {/* Text Content Skeleton */}
          <div className="p-4">
            <div className="h-5 bg-gray-200 rounded mb-2"></div>
            <div className="h-5 bg-gray-200 rounded mb-2 w-4/5"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6 mt-2"></div>
          </div>
        </div>
      </div>

      {/* Buttons Section */}
      <div className="p-3 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export const GalleryCardSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-white rounded-lg overflow-hidden border border-gray-200 shadow-md animate-pulse">
      {/* Preview Area */}
      <div
        className="relative w-full bg-gray-200"
        style={{
          height: 0,
          paddingTop: 'calc(1350 / 1080 * 100%)',
          position: 'relative',
          width: '100%',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 border-t border-gray-200">
        <div className="mb-3">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
          <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export const HomeCarouselSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-white rounded-lg overflow-hidden border border-gray-200 shadow-md animate-pulse">
      {/* Preview Area */}
      <div
        className="relative w-full bg-gray-200"
        style={{
          height: 0,
          paddingTop: 'calc(1350 / 1080 * 100%)',
          position: 'relative',
          width: '100%',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 border-t border-gray-200">
        <div className="mb-3">
          <div className="h-3 bg-gray-200 rounded w-28"></div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
          <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

interface SkeletonGridProps {
  count?: number;
  type: 'post' | 'news' | 'gallery' | 'home';
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({ count = 8, type }) => {
  const SkeletonComponent = {
    post: PostCardSkeleton,
    news: NewsCardSkeleton,
    gallery: GalleryCardSkeleton,
    home: HomeCarouselSkeleton,
  }[type];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={`skeleton-${index}`} />
      ))}
    </div>
  );
};

export default {
  PostCardSkeleton,
  NewsCardSkeleton,
  GalleryCardSkeleton,
  HomeCarouselSkeleton,
  SkeletonGrid,
};
