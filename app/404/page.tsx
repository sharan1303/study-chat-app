import { notFound } from "next/navigation";

export default function NotFoundPage() {
  // This will trigger the not-found.tsx component
  notFound();
}
