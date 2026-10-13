import styles from "@/app/landing.module.css";

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div
      data-reveal="rise"
      className={`mx-auto mb-10 max-w-2xl text-center sm:mb-14 ${styles.reveal}`}
    >
      <p className="mb-3 text-sm font-medium text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="text-balance text-3xl font-bold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  );
}
