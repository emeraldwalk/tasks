import { className } from '../utils/cssUtils'
import styles from './CheckMark.module.css'
import { Icon } from './Icon'

export interface CheckMarkProps {
  state: 'complete' | 'incomplete' | 'partial'
  onClick?: () => void
}

export function CheckMark(props: CheckMarkProps) {
  return (
    <span
      class={className(styles.CheckMark, styles[props.state])}
      onClick={props.onClick}>
      <Icon
        name={
          props.state === 'complete'
            ? 'checkmark-circle'
            : props.state === 'partial'
            ? 'remove-circle'
            : 'ellipse-outline'
        }
        size="large"
      />
    </span>
  )
}
