import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface BannerImage {
  url: string;
  link?: string;
}

export function SidebarBanners() {
  const [banners, setBanners] = useState<BannerImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBanners() {
      try {
        const response = await fetch('https://www.n8nbalao.com/api/carousels.php?key=sidebar_promo_banners');
        const data = await response.json();
        
        if (data.images && Array.isArray(data.images)) {
          setBanners(data.images);
        }
      } catch (error) {
        console.error('Error loading sidebar banners:', error);
      }
      setLoading(false);
    }
    loadBanners();
  }, []);

  if (loading || banners.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Promoções
      </h2>
      <div className="space-y-3">
        {banners.map((banner, index) => {
          const content = (
            <div className="relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <img
                src={banner.url}
                alt={`Promoção ${index + 1}`}
                className="w-full h-auto object-cover"
                style={{ aspectRatio: '3/4' }}
              />
            </div>
          );

          if (banner.link) {
            // External link
            if (banner.link.startsWith('http')) {
              return (
                <a
                  key={index}
                  href={banner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {content}
                </a>
              );
            }
            // Internal link
            return (
              <Link key={index} to={banner.link} className="block">
                {content}
              </Link>
            );
          }

          return <div key={index}>{content}</div>;
        })}
      </div>
    </div>
  );
}
