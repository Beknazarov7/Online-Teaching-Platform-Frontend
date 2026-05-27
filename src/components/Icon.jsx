/**
 * Tiny wrapper around Material Symbols Outlined font icons.
 *   <Icon name="dashboard" />
 *   <Icon name="add" className="text-sm" />
 */
export default function Icon({ name, className = '', filled = false, ...rest }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      {...rest}
    >
      {name}
    </span>
  )
}
