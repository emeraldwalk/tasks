import { className } from '../utils/cssUtils'

export interface IconProps {
  class?: string
  name: keyof typeof iconContent
  size?: number | 'large' | 'small'
}

const iconContent = {
  'add-circle': () => (
    <>
      <circle cx="256" cy="256" r="208" fill="currentColor" />
      <rect x="240" y="176" width="32" height="160" rx="8" fill="var(--color-on-accent)" />
      <rect x="176" y="240" width="160" height="32" rx="8" fill="var(--color-on-accent)" />
    </>
  ),
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
  'settings-outline': () => (
    <path
      d="M262.29 192.31a64 64 0 1057.4 57.4 64.13 64.13 0 00-57.4-57.4zM416.39 256a154.34 154.34 0 01-1.53 20.79l45.21 35.46a10.81 10.81 0 012.45 13.75l-42.77 74a10.81 10.81 0 01-13.14 4.59l-44.9-18.08a16.11 16.11 0 00-15.17 1.75A164.48 164.48 0 01325 400.8a15.94 15.94 0 00-8.82 12.14l-6.73 47.89a11.08 11.08 0 01-10.68 9.17h-85.54a11.11 11.11 0 01-10.69-8.87l-6.72-47.82a16.07 16.07 0 00-9-12.22 155.3 155.3 0 01-21.46-12.57 16 16 0 00-15.11-1.71l-44.89 18.07a10.81 10.81 0 01-13.14-4.58l-42.77-74a10.8 10.8 0 012.45-13.75l38.21-30a16.05 16.05 0 006-14.08c-.36-4.17-.58-8.33-.58-12.5s.21-8.27.58-12.35a16 16 0 00-6.07-13.94l-38.19-30A10.81 10.81 0 0149.48 186l42.77-74a10.81 10.81 0 0113.14-4.59l44.9 18.08a16.11 16.11 0 0015.17-1.75A164.48 164.48 0 01187 111.2a15.94 15.94 0 008.82-12.14l6.73-47.89A11.08 11.08 0 01213.23 42h85.54a11.11 11.11 0 0110.69 8.87l6.72 47.82a16.07 16.07 0 009 12.22 155.3 155.3 0 0121.46 12.57 16 16 0 0015.11 1.71l44.89-18.07a10.81 10.81 0 0113.14 4.58l42.77 74a10.8 10.8 0 01-2.45 13.75l-38.21 30a16.05 16.05 0 00-6.05 14.08c.33 4.14.55 8.3.55 12.47z"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="32"
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
      width={size()}
      height={size()}>
      {content()}
    </svg>
  )
}
