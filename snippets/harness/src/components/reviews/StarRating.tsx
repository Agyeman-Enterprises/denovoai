"use client";

export function StarRating({ rating, onChange, readonly = false }: { rating: number; onChange?: (r: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`text-lg ${star <= rating ? "text-yellow-400" : "text-white/15"} ${readonly ? "cursor-default" : "cursor-pointer hover:text-yellow-300"}`}
        >
          &#9733;
        </button>
      ))}
    </div>
  );
}
