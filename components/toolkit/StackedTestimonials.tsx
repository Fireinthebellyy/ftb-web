"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Placeholder data for the screenshots. 
// Admins or developers can replace these images later.
const PLACEHOLDER_CARDS = [
  { id: 1, src: "", alt: "Screenshot 1", bg: "bg-blue-50" },
  { id: 2, src: "", alt: "Screenshot 2", bg: "bg-green-50" },
  { id: 3, src: "", alt: "Screenshot 3", bg: "bg-purple-50" },
  { id: 4, src: "", alt: "Screenshot 4", bg: "bg-orange-50" },
  { id: 5, src: "", alt: "Screenshot 5", bg: "bg-pink-50" },
  { id: 6, src: "", alt: "Screenshot 6", bg: "bg-yellow-50" },
];

export function StackedTestimonials() {
  const { data: fetchedImages, isLoading } = useQuery({
    queryKey: ["testimonial-images"],
    queryFn: async () => {
      const res = await axios.get("/api/testimonial-images");
      return res.data as { id: string; imageUrl: string }[];
    },
  });

  const [cards, setCards] = useState<any[]>(PLACEHOLDER_CARDS);

  useEffect(() => {
    if (fetchedImages && fetchedImages.length > 0) {
      setCards(
        fetchedImages.map((img, i) => ({
          id: img.id,
          src: img.imageUrl,
          alt: `Screenshot ${i + 1}`,
          bg: "bg-gray-50",
        }))
      );
    }
  }, [fetchedImages]);

  const moveToEnd = () => {
    setCards((prev) => {
      const newArray = [...prev];
      const first = newArray.shift();
      if (first) newArray.push(first);
      return newArray;
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      moveToEnd();
    }, 4000); // Rotates every 4 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-72 w-full max-w-4xl mx-auto flex items-center justify-center overflow-hidden py-6">
      {isLoading ? (
        <div className="flex items-center justify-center">
           {/* Simple skeleton or loader could go here, for now it will just show placeholders momentarily until loaded */}
        </div>
      ) : null}

      {cards.map((card, index) => {
        const isCenter = index === 0;
        const isRight = index === 1;
        const isLeft = index === cards.length - 1;
        
        let animateState = { x: "0%", scale: 0.7, opacity: 0, zIndex: 0 };
        
        if (isCenter) {
          animateState = { x: "0%", scale: 1, opacity: 1, zIndex: 10 };
        } else if (isRight) {
          animateState = { x: "65%", scale: 0.85, opacity: 1, zIndex: 5 };
        } else if (isLeft) {
          animateState = { x: "-65%", scale: 0.85, opacity: 1, zIndex: 5 };
        }

        return (
          <motion.div
            key={card.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={animateState}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              mass: 1,
            }}
            onClick={moveToEnd}
            className={`absolute w-72 h-56 sm:w-80 sm:h-64 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center justify-center text-center cursor-pointer ${card.bg}`}
          >
            {card.src ? (
              <img src={card.src} alt={card.alt} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-gray-800">
                <ImageIcon className="size-10 mb-2 opacity-50" />
                <span className="font-medium text-gray-800">Screenshot Placeholder {card.id}</span>
                {isCenter && <span className="text-xs mt-2 text-gray-500 font-medium bg-white/50 px-3 py-1 rounded-full">Tap to view next chat</span>}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
