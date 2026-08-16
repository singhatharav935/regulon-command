import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

/**
 * Wrapped Switch that patches Radix's hidden native <input type="checkbox">.
 * Radix creates a visually-hidden checkbox for form submission. Chrome DevTools
 * flags this for missing id/name and label association. This wrapper uses a
 * ref + MutationObserver to inject the necessary attributes.
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, id, name, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
  const containerRef = React.useRef<HTMLSpanElement>(null);

  // Use useLayoutEffect for synchronous DOM patching before paint
  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const patchHiddenInput = () => {
      const hiddenInput = container.querySelector('input[type="checkbox"][aria-hidden="true"]');
      if (hiddenInput) {
        const effectiveName = name || `switch-${Math.random().toString(36).slice(2, 8)}`;
        if (!hiddenInput.getAttribute('name')) {
          hiddenInput.setAttribute('name', effectiveName);
        }
        if (!hiddenInput.getAttribute('id')) {
          hiddenInput.setAttribute('id', `__native_${hiddenInput.getAttribute('name') || effectiveName}`);
        }
        if (!hiddenInput.getAttribute('aria-label')) {
          hiddenInput.setAttribute('aria-label', ariaLabel || name || 'switch');
        }
        if (ariaLabelledBy && !hiddenInput.getAttribute('aria-labelledby')) {
          hiddenInput.setAttribute('aria-labelledby', ariaLabelledBy);
        }
      }
    };

    // Patch synchronously on mount
    patchHiddenInput();

    // Watch for dynamic changes
    const observer = new MutationObserver(patchHiddenInput);
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [name, ariaLabel, ariaLabelledBy]);

  return (
    <span ref={containerRef} style={{ display: 'contents' }}>
      <SwitchPrimitives.Root
        id={id}
        name={name}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
        ref={ref}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
          )}
        />
      </SwitchPrimitives.Root>
    </span>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
