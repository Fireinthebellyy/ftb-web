import React, { memo } from "react";
import Image from "next/image";
import { useFeatured } from "@/lib/queries";
import { Loader2 } from "lucide-react";

const FeaturedOpportunities: React.FC = memo(() => {
  const { data: featured = [], isLoading, error } = useFeatured(4);

  if (error) {
    return <div>Error loading featured opportunities</div>;
  }

  return (
    <div className="rounded-lg border bg-white px-4 py-3">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Featured</h3>
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        )}
      </div>
      {isLoading ? (
        <div className="py-8 text-center">
          <div className="flex justify-center space-x-1">
            <div className="size-1.5 animate-bounce rounded-full bg-gray-400 delay-75"></div>
            <div className="size-1.5 animate-bounce rounded-full bg-gray-400 delay-100"></div>
            <div className="size-1.5 animate-bounce rounded-full bg-gray-400 delay-150"></div>
          </div>
        </div>
      ) : featured && featured.length > 0 ? (
        <ul className="space-y-4">
          {featured.map((item, index) => (
            <li
              key={item._id || `featured-${index}`}
              className="flex items-start space-x-3"
            >
              <div
                className={`relative h-12 w-12 rounded ${
                  !item.thumbnail
                    ? "bg-gradient-to-br from-gray-100 to-gray-200"
                    : ""
                }`}
              >
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail.asset.url}
                    alt={item.title}
                    className="h-12 w-12 rounded object-cover"
                    width={100}
                    height={100}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {item.title.length > 30
                    ? `${item.title.substring(0, 30)}...`
                    : item.title}
                </a>
                {item.description && (
                  <p className="mt-1 text-xs text-gray-500">
                    {item.description.length > 30
                      ? `${item.description.substring(0, 30)}...`
                      : item.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-8 text-center text-gray-500">
          <div className="mb-2 text-4xl">🌟</div>
          <p className="text-sm">No featured posts yet</p>
        </div>
      )}
    </div>
  );
});

FeaturedOpportunities.displayName = "FeaturedOpportunities";

export default FeaturedOpportunities;
