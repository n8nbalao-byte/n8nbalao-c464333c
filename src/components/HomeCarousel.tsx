import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

interface CarouselImage {
  url: string;
  link?: string;
}

interface HomeCarouselProps {
  carouselKey: string;
  fallbackImage?: string;
  className?: string;
  alt?: string;
  imageClassName?: string;
}

export function HomeCarousel({ carouselKey, fallbackImage, className = "", alt = "Carousel image", imageClassName = "" }: HomeCarouselProps) {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [interval, setIntervalTime] = useState(4000);

  useEffect(() => {
    async function fetchImages() {
      try {
        const data = await api.getCarousel(carouselKey);
        if (data.images && data.images.length > 0) {
          // Handle both old format (string[]) and new format (CarouselImage[])
          const normalizedImages: CarouselImage[] = data.images.map((img) =>
            typeof img === 'string' ? { url: img, link: '' } : img
          );
          setImages(normalizedImages);
        }
        // Set interval if available from API
        if (data.interval) {
          setIntervalTime(data.interval);
        }
      } catch (error) {
        console.error('Error fetching carousel images:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, [carouselKey]);

  // Auto-rotate images
  useEffect(() => {
    if (images.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
    );
  }

  // If no images and no fallback, return null (hide completely)
  if (images.length === 0) {
    if (!fallbackImage) {
      return null;
    }
    return (
      <img
        src={fallbackImage}
        alt={alt}
        className={className}
      />
    );
  }

  const renderImage = (image: CarouselImage, index: number) => {
    const imgElement = (
      <img
        src={image.url}
        alt={`${alt} ${index + 1}`}
        className={`flex-shrink-0 w-full ${imageClassName || className}`}
      />
    );

    if (image.link) {
      // External link
      if (image.link.startsWith('http')) {
        return (
          <a
            key={index}
            href={image.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-full"
          >
            {imgElement}
          </a>
        );
      }
      // Internal link
      return (
        <Link key={index} to={image.link} className="flex-shrink-0 w-full">
          {imgElement}
        </Link>
      );
    }

    return <div key={index} className="flex-shrink-0 w-full">{imgElement}</div>;
  };

  return (
    <div className="relative overflow-hidden">
      <div 
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => renderImage(image, index))}
      </div>
      
      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? "bg-primary w-6" 
                  : "bg-primary/40 hover:bg-primary/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
