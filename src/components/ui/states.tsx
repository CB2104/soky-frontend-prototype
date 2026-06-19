import { Button } from "./button";

type StateProps = {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  title: string;
};

export function LoadingState({ title = "Cargando" }: Partial<StateProps>) {
  return (
    <div className="grid min-h-48 place-items-center rounded-2xl border border-soky-border bg-soky-white p-6 text-center text-soky-ink">
      <div className="space-y-3">
        <div className="mx-auto h-3 w-32 animate-pulse rounded-full bg-soky-blue/20" />
        <p className="font-bold">{title}</p>
      </div>
    </div>
  );
}

export function EmptyState({ actionHref, actionLabel, description, title }: StateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-soky-border bg-soky-white p-6 text-center text-soky-ink">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-soky-muted">{description}</p>
      {actionHref && actionLabel ? (
        <Button href={actionHref} className="mt-5" variant="secondary">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function ErrorState({ actionHref, actionLabel, description, title }: StateProps) {
  return (
    <div className="rounded-2xl border border-japan-seal/30 bg-soky-white p-6 text-center text-soky-ink">
      <h2 className="text-xl font-black text-japan-seal">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-soky-muted">{description}</p>
      {actionHref && actionLabel ? (
        <Button href={actionHref} className="mt-5" variant="primary">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
