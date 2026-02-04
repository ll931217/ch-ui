import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function genTabId() {
  return `tab-${Math.random().toString(36).substring(2, 15)}`;
}

export function formatBytes(bytes: number) {
  if (!bytes) return "";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDate(date: Date, format: string) {
  if (!date) return "";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatNumber(number: number) {
  if (!number) return "";
  return number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}


export function generateRandomPassword(length: number = 12) {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const special = "!@#$%^&*";
  const all = lowercase + uppercase + digits + special;

  // Ensure at least one from each category
  const required = [
    lowercase[Math.floor(Math.random() * lowercase.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  // Fill remaining with random chars
  for (let i = required.length; i < length; i++) {
    required.push(all[Math.floor(Math.random() * all.length)]);
  }

  // Shuffle to randomize positions
  return required.sort(() => Math.random() - 0.5).join("");
}

