/**
 * Stitch-themed wrapper around react-datepicker. Renders a read-only-looking
 * input with a calendar icon button that opens a popup with date + time.
 *
 *   <CalendarPicker
 *     value={dateOrNull}
 *     onChange={setDate}
 *     label="Start"
 *     minDate={new Date()}
 *   />
 *
 * Value is a JS Date (or null). Parent code is responsible for converting
 * to ISO via date.toISOString() when sending to the backend.
 */
import { forwardRef } from 'react'
import DatePicker from 'react-datepicker'
import Icon from './Icon'

const InputButton = forwardRef(function InputButton(
  { value, onClick, placeholder, disabled },
  ref,
) {
  return (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      disabled={disabled}
      className="w-full bg-surface-container-low dark:bg-dark-surface-container-low border border-outline-variant dark:border-dark-outline-variant rounded-lg px-3 py-2 text-sm flex items-center justify-between gap-2 hover:border-primary focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors text-left"
    >
      <span className={value ? 'text-on-surface dark:text-dark-on-surface' : 'text-secondary'}>
        {value || placeholder || 'Pick a date and time'}
      </span>
      <Icon name="calendar_month" className="text-primary dark:text-primary-fixed-dim text-[20px]" />
    </button>
  )
})

export default function CalendarPicker({
  value,
  onChange,
  label,
  placeholder,
  minDate,
  disabled,
  showTime = true,
}) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-on-surface-variant dark:text-dark-on-surface-variant mb-1">
          {label}
        </label>
      )}
      <DatePicker
        selected={value}
        onChange={onChange}
        showTimeSelect={showTime}
        timeIntervals={15}
        timeCaption="Time"
        dateFormat={showTime ? 'd MMM yyyy, HH:mm' : 'd MMM yyyy'}
        minDate={minDate}
        disabled={disabled}
        customInput={<InputButton placeholder={placeholder} />}
        popperPlacement="bottom-start"
      />
    </div>
  )
}
