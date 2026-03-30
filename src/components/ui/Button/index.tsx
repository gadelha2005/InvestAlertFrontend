import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './Button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export default function Button({ children, className = '', ...props }: ButtonProps) {
  return (
    <button className={['button', className].join(' ').trim()} {...props}>
      {children}
    </button>
  )
}
