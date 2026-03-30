import type { LabelHTMLAttributes } from 'react'
import './Label.css'

export default function Label({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={['label', className].join(' ').trim()} {...props} />
}
