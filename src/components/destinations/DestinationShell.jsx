import { useEffect, useRef } from 'react';
import { motion as Motion, useReducedMotion } from 'motion/react';
import { X } from '../icons/Icons.jsx';

const EASE_OUT = [0.22, 1, 0.36, 1];

/* Staggered child block — wrap each logical section of a destination panel in
   one of these and it fades/rises in sequence when the panel opens. */
export const Reveal = ({ className, children }) => {
    const reduce = useReducedMotion();
    const variants = reduce
        ? {
              hidden: { opacity: 0, transition: { duration: 0.15 } },
              open: { opacity: 1, transition: { duration: 0.3 } },
          }
        : {
              hidden: { opacity: 0, y: 14, transition: { duration: 0.16, ease: 'easeIn' } },
              open: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
          };
    return (
        <Motion.div className={className} variants={variants}>
            {children}
        </Motion.div>
    );
};

/* A destination panel that opens as a modal when its planet is clicked.
   Closes via the backdrop, the × button, or Escape. Panels stay mounted
   (cheap DOM, instant reopen); `inert` removes closed ones from the tab
   order and accessibility tree. */
const DestinationShell = ({ open, onClose, id, index, eyebrow, title, className = '', children }) => {
    const reduce = useReducedMotion();
    const panelRef = useRef(null);
    const restoreRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        restoreRef.current = document.activeElement;
        panelRef.current?.focus({ preventScroll: true });
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            if (restoreRef.current instanceof HTMLElement) {
                restoreRef.current.focus({ preventScroll: true });
            }
        };
    }, [open, onClose]);

    const panelVariants = reduce
        ? {
              hidden: { opacity: 0, transition: { duration: 0.2 } },
              open: { opacity: 1, transition: { duration: 0.3, staggerChildren: 0.04 } },
          }
        : {
              // Exit runs faster than entry so dismissal feels immediate.
              hidden: {
                  opacity: 0,
                  scale: 0.96,
                  y: 24,
                  transition: { duration: 0.22, ease: 'easeIn' },
              },
              open: {
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: {
                      duration: 0.42,
                      ease: EASE_OUT,
                      staggerChildren: 0.05,
                      delayChildren: 0.06,
                  },
              },
          };

    const titleId = `${id}-dest-title`;

    return (
        <div
            className="dest-stage"
            inert={!open}
            style={{ pointerEvents: open ? 'auto' : 'none' }}
        >
            <Motion.div
                className="dest-backdrop"
                initial={false}
                animate={{ opacity: open ? 1 : 0 }}
                transition={{ duration: open ? 0.35 : 0.22 }}
                onClick={onClose}
                aria-hidden="true"
            />
            <Motion.section
                ref={panelRef}
                className={`dest-panel ${className}`}
                data-open={open ? 'true' : 'false'}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                initial={false}
                variants={panelVariants}
                animate={open ? 'open' : 'hidden'}
            >
                <button type="button" className="dest-close" onClick={onClose} aria-label="Close panel">
                    <X />
                </button>
                <div className="dest-panel-scroll">
                    <Reveal>
                        <header className="dest-head">
                            <span className="dest-index">
                                {index} — {eyebrow}
                            </span>
                            <h2 className="dest-title" id={titleId}>
                                {title}
                            </h2>
                        </header>
                    </Reveal>
                    {children}
                </div>
            </Motion.section>
        </div>
    );
};

export default DestinationShell;
