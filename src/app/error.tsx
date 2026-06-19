"use client";

export default function ErrorPage() {
  return (
    <div>
      <h1>Something went wrong!</h1>
      <button onClick={() => window.location.reload()}>Try again</button>
    </div>
  );
}