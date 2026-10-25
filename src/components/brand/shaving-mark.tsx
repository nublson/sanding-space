export function ShavingMark({
  size = 18,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 34C6 18 26 6 37 15C46 23 38 37 27 35C19 33 20 22 28 23"
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        strokeLinecap="round"
      />
    </svg>
  );
}
