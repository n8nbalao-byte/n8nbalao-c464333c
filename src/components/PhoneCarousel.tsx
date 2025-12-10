import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// Import local images
import phone1 from "@/assets/phone-carousel/phone-1.png";
import phone2 from "@/assets/phone-carousel/phone-2.png";
import phone3 from "@/assets/phone-carousel/phone-3.png";
import phone4 from "@/assets/phone-carousel/phone-4.png";
import phone5 from "@/assets/phone-carousel/phone-5.png";
import phone6 from "@/assets/phone-carousel/phone-6.png";
import phone7 from "@/assets/phone-carousel/phone-7.png";
import phone8 from "@/assets/phone-carousel/phone-8.png";

const localImages = [phone1, phone2, phone3, phone4, phone5, phone6, phone7, phone8];

interface PhoneCarouselProps {
  carouselKey: string;
  fallbackImage?: string;
  className?: string;
  alt?: string;
}

export function PhoneCarousel({ carouselKey, className = "", alt = "Phone image" }: PhoneCarouselProps) {
  const [images, setImages] = useState<string[]>(localImages);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [interval, setIntervalTime] = useState(4000);

  useEffect(() => {
    async function fetchImages() {
      try {
        const data = await api.getCarousel(carouselKey);
        if (data.images && data.images.length > 0) {
          const normalizedImages: string[] = data.images.map((img: any) =>
            typeof img === 'string' ? img : img.url
          );
          setImages(normalizedImages);
        }
        if (data.interval) {
          setIntervalTime(data.interval);
        }
      } catch (error) {
        console.error('Error fetching carousel images:', error);
        // Keep using local images as fallback
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

  const currentImage = images[currentIndex];

  if (!currentImage) {
    return null;
  }

  return (
    <img
      src={currentImage}
      alt={`${alt} ${currentIndex + 1}`}
      className={className}
      style={{
        transition: 'opacity 1s ease-in-out',
      }}
    />
  );
}
