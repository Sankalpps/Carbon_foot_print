import { type ReactNode } from 'react';
import styles from './Card.module.css';

/** Supported card visual variants. */
type CardVariant = 'default' | 'stat' | 'glass';

/** Padding presets for the card. */
type CardPadding = 'sm' | 'md' | 'lg';

/** Props for the {@link Card} component. */
interface CardProps {
  /** Card content. */
  children: ReactNode;
  /** Visual variant. @default 'default' */
  variant?: CardVariant;
  /** Enable hover lift animation. @default false */
  hover?: boolean;
  /** Internal padding size. @default 'md' */
  padding?: CardPadding;
  /** Additional CSS classes. */
  className?: string;
}

/** Map of padding size → CSS module class name. */
const PADDING_MAP: Record<CardPadding, string> = {
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

/**
 * Glassmorphism card component with three visual variants, adjustable padding,
 * and an optional hover-lift animation.
 *
 * @example
 * ```tsx
 * <Card variant="glass" hover padding="lg">
 *   <h3>Revenue</h3>
 *   <p>$1,234</p>
 * </Card>
 * ```
 */
export default function Card({
  children,
  variant = 'default',
  hover = false,
  padding = 'md',
  className,
}: CardProps) {
  const classNames = [
    styles.card,
    styles[variant],
    PADDING_MAP[padding],
    hover ? styles.hoverable : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classNames}>{children}</div>;
}
