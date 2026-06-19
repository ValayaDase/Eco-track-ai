"use client";

import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <Link href="/">Go back to home</Link>
    </div>
  );
}
