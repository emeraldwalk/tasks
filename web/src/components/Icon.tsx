import { className } from '../utils/cssUtils'

export interface IconProps {
  class?: string
  name: keyof typeof iconContent
  size?: number | 'large' | 'small'
}

const iconContent = {
  'book-outline': () => (
    <path
      d="M256 160c16-63.16 76.43-95.41 208-96a15.94 15.94 0 0116 16v288a16 16 0 01-16 16c-128 0-177.45 25.81-208 64-30.37-38-80-64-208-64-9.88 0-16-8.05-16-17.93V80a15.94 15.94 0 0116-16c131.57.59 192 32.84 208 96zM256 160v288"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="32"
    />
  ),
  'checkmark-circle': () => (
    <path
      fill="currentColor"
      d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z"
    />
  ),
  'chevron-down-sharp': () => (
    <path
      fill="none"
      stroke="currentColor"
      stroke-linecap="square"
      stroke-miterlimit="10"
      stroke-width="48"
      d="M112 184l144 144 144-144"
    />
  ),
  close: () => (
    <path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z" />
  ),
  'ellipse-outline': () => (
    <circle
      cx="256"
      cy="256"
      r="192"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="32"
    />
  ),
  'list-outline': () => (
    <>
      <path
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="32"
        d="M160 144h288M160 256h288M160 368h288"
      />
      <circle
        cx="80"
        cy="144"
        r="16"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="32"
      />
      <circle
        cx="80"
        cy="256"
        r="16"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="32"
      />
      <circle
        cx="80"
        cy="368"
        r="16"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="32"
      />
    </>
  ),
  menu: () => (
    <path
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-miterlimit="10"
      stroke-width="48"
      d="M88 152h336M88 256h336M88 360h336"
    />
  ),
  'remove-circle': () => (
    <path
      fill="currentcolor"
      d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm80 224H176a16 16 0 010-32h160a16 16 0 010 32z"
    />
  ),
  'time-outline': () => (
    <>
      <path
        d="M256 64C150 64 64 150 64 256s86 192 192 192 192-86 192-192S362 64 256 64z"
        fill="none"
        stroke="currentColor"
        stroke-miterlimit="10"
        stroke-width="32"
      />
      <path
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="32"
        d="M256 128v144h96"
      />
    </>
  ),
}

export function Icon(props: IconProps) {
  const size = () => {
    if (props.size === 'large') return 32
    if (props.size === 'small') return 16
    return props.size ?? 24
  }

  const content = () => iconContent[props.name]()

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class={className('ionicon', `icon-${props.name}`, props.class)}
      viewBox="0 0 512 512"
      width={size()}>
      {content()}
    </svg>
  )
}
