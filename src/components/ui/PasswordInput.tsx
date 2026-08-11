import { useState, type ComponentPropsWithRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import { IconButton } from './IconButton'
import styles from './controls.module.css'
export function PasswordInput({
  className,
  ...props
}: Omit<ComponentPropsWithRef<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className={styles.controlWrap}>
      <input
        type={visible ? 'text' : 'password'}
        className={clsx(styles.control, styles.passwordControl, className)}
        {...props}
      />
      <IconButton
        className={clsx(styles.passwordToggle)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </IconButton>
    </div>
  )
}
