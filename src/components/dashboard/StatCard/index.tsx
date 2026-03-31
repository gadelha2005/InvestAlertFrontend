import type { LucideIcon } from 'lucide-react'
import './StatCard.css'

interface StatCardProps {
  label: string
  value: string
  meta?: string
  tone?: 'neutral' | 'positive' | 'negative'
  icon: LucideIcon
}

export default function StatCard({
  label,
  value,
  meta,
  tone = 'neutral',
  icon: Icon,
}: StatCardProps) {
  const metaClassName =
    tone === 'positive'
      ? 'stat-card__meta stat-card__meta--positive'
      : tone === 'negative'
        ? 'stat-card__meta stat-card__meta--negative'
        : 'stat-card__meta'

  return (
    <article className="stat-card">
      <div className="stat-card__header">
        <p className="stat-card__label">{label}</p>
        <div className="stat-card__icon-box">
          <Icon size={20} />
        </div>
      </div>

      <p className="stat-card__value">{value}</p>

      {meta ? <div className={metaClassName}>{meta}</div> : null}
    </article>
  )
}
