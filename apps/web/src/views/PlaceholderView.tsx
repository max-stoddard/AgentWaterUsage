type PlaceholderViewProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PlaceholderView({ eyebrow, title, description }: PlaceholderViewProps) {
  return (
    <section className="panel-shell px-6 py-8 opacity-75 sm:px-8 sm:py-10">
      <div className="max-w-3xl">
        <div className="micro-pill">Coming soon</div>
        <p className="mt-8 section-kicker">{eyebrow}</p>
        <h1 className="mt-4 max-w-2xl text-2xl font-semibold tracking-[-0.06em] text-zinc-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-500">{description}</p>
      </div>
    </section>
  );
}
