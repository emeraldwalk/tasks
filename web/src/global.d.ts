declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'ion-icon': {
        name: string
        class?: string
        size?: 'small' | 'large'
      }
    }
  }
}

export {}
