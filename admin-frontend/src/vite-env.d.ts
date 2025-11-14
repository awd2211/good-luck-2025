/// <reference types="vite/client" />

declare module '*.css' {
  const content: Record<string, string>
  export default content
}

declare module '*.scss' {
  const content: Record<string, string>
  export default content
}

declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module 'react-quill' {
  import { Component } from 'react'

  export interface ReactQuillProps {
    value?: string
    defaultValue?: string
    placeholder?: string
    readOnly?: boolean
    onChange?: (content: string, delta: any, source: string, editor: any) => void
    onChangeSelection?: (selection: any, source: string, editor: any) => void
    onFocus?: (selection: any, source: string, editor: any) => void
    onBlur?: (previousSelection: any, source: string, editor: any) => void
    onKeyPress?: (event: any) => void
    onKeyDown?: (event: any) => void
    onKeyUp?: (event: any) => void
    bounds?: string | HTMLElement
    children?: React.ReactElement
    className?: string
    formats?: string[]
    id?: string
    modules?: any
    preserveWhitespace?: boolean
    style?: React.CSSProperties
    tabIndex?: number
    theme?: string
  }

  export default class ReactQuill extends Component<ReactQuillProps> {}
}

declare module 'react-quill/dist/quill.snow.css' {
  const content: any
  export default content
}
