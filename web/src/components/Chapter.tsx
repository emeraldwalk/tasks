import { createEffect, createSignal } from 'solid-js'
import styles from './Chapter.module.css'

export interface ChapterProps {
  bookName: string
  number: number
  initialValue: number
  onChange: (value: number) => void
}

export function Chapter(props: ChapterProps) {
  const [value, setValue] = createSignal(props.initialValue)

  let isInitial = true
  createEffect(() => {
    const v = value()
    if (isInitial) {
      isInitial = false
      return
    }
    props.onChange(v)
  })

  function onIncrement() {
    setValue((prev) => prev + 1)
  }

  function onDecrement() {
    setValue((prev) => prev - 1)
  }

  return (
    <div class={styles.Chapter}>
      <span>
        {props.bookName} {props.number}
      </span>
      <button onClick={onDecrement}>-</button>
      <input type="number" value={value()} />
      <button onClick={onIncrement}>+</button>
    </div>
  )
}
