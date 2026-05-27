/**
 * Surface card — the white-background panel used everywhere in the design.
 * Adapts to dark mode automatically.
 */
export default function Card({ className = '', children, ...rest }) {
  return (
    <div
      className={`bg-surface-container-lowest dark:bg-dark-surface-container border border-outline-variant dark:border-dark-outline-variant rounded-xl shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
