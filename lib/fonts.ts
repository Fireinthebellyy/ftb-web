import {
  Caveat,
  Inter,
  Outfit,
  Plus_Jakarta_Sans,
  Righteous,
  Satisfy,
} from "next/font/google";

export const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ["400", "700"],
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const satisfy = Satisfy({
  subsets: ["latin"],
  weight: ["400"],
});

export const righteous = Righteous({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-righteous",
});

export const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-caveat",
});
