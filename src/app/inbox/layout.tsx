import { SenderList } from "@/components/inbox/SenderList";
import { InboxKeyboardProvider } from "@/components/inbox/InboxKeyboardProvider";

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh overflow-hidden bg-neutral-50 text-foreground w-full p-8">
      <InboxKeyboardProvider />
      <aside className="h-full w-[280px] shrink-0 overflow-hidden">
        <SenderList />
      </aside>
      <section className="h-full flex-1 overflow-hidden bg-background rounded-2xl">{children}</section>
    </div>
  );
}
