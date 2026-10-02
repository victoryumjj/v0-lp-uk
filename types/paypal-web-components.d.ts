// JSX typings for the PayPal JavaScript SDK v6 web components
import type { DetailedHTMLProps, HTMLAttributes } from "react"

type PayPalElementProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  type?: string
}

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": PayPalElementProps
      "paypal-basic-card-container": PayPalElementProps
      "paypal-basic-card-button": PayPalElementProps
    }
  }
}
