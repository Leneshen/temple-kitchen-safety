import { useId } from "react";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface BaseProps<T extends string> {
  legend: string;
  hint?: string;
  options: (Option<T> | T)[];
  error?: string;
}

interface MultiProps<T extends string> extends BaseProps<T> {
  multiple: true;
  value: T[];
  onChange: (value: T[]) => void;
}

interface SingleProps<T extends string> extends BaseProps<T> {
  multiple?: false;
  value: T | "";
  onChange: (value: T) => void;
}

const normalise = <T extends string>(o: Option<T> | T): Option<T> =>
  typeof o === "string" ? { value: o, label: o } : o;

/**
 * Tap-friendly selection boxes. Uses real checkboxes/radios underneath,
 * so it works with keyboards and screen readers.
 */
export function ChipGroup<T extends string>(props: MultiProps<T> | SingleProps<T>) {
  const name = useId();
  const errorId = `${name}-error`;

  const isChecked = (v: T) =>
    props.multiple ? props.value.includes(v) : props.value === v;

  const toggle = (v: T) => {
    if (props.multiple) {
      props.onChange(
        props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v],
      );
    } else {
      props.onChange(v);
    }
  };

  return (
    <fieldset
      className={`chips${props.error ? " has-error" : ""}`}
      aria-describedby={props.error ? errorId : undefined}
    >
      <legend>{props.legend}</legend>
      {props.hint && <p className="hint">{props.hint}</p>}
      <div className="chip-list">
        {props.options.map(normalise).map((o) => (
          <label key={o.value} className={`chip${isChecked(o.value) ? " selected" : ""}`}>
            <input
              type={props.multiple ? "checkbox" : "radio"}
              name={name}
              value={o.value}
              checked={isChecked(o.value)}
              onChange={() => toggle(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {props.error && (
        <p className="error" id={errorId} role="alert">
          {props.error}
        </p>
      )}
    </fieldset>
  );
}
