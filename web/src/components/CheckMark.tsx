import { className } from '../utils/cssUtils'
import styles from './CheckMark.module.css'

export interface CheckMarkProps {
  state: 'complete' | 'incomplete' | 'partial'
}

export function CheckMark(props: CheckMarkProps) {
  return (
    <span class={className(styles.CheckMark, styles[props.state])}>
      <ion-icon
        name={
          props.state === 'complete'
            ? 'checkmark-circle'
            : props.state === 'partial'
            ? 'remove-circle'
            : 'ellipse-outline'
        }
        size="large"></ion-icon>
    </span>
  )
}
