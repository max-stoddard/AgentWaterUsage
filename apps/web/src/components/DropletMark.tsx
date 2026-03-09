type DropletMarkProps = {
  className?: string;
};

export function DropletMark({ className = "" }: DropletMarkProps) {
  return <img alt="" aria-hidden="true" className={className} src="/droplet.svg" />;
}
