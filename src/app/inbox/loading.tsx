export default function InboxLoading() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-10 w-full animate-pulse rounded-lg bg-muted"
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}
