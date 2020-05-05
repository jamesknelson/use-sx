import React from 'react'
import { StyledComponent, StyledComponentProps } from 'styled-components'

export interface Control {
  select: (selectorType: string) => string

  // When defined, these flags should override any styles defined by CSS pseudo
  // selectors.
  //
  // While these can be handled in many cases via CSS selectors, there are times
  // when you'll want to be able to manually set them too. For example, consider
  // a tutorial where you want to temporarily show a control in a different
  // state.
  active?: boolean
  checked?: boolean
  disabled?: boolean
  focus?: boolean
  hover?: boolean
}

export const ControlContext = React.createContext<Control | undefined>(
  undefined,
)

export function control<
  C extends keyof JSX.IntrinsicElements | React.ComponentType<any>,
  T extends object,
  O extends object = {},
  A extends keyof any = never
>(
  Component: StyledComponent<C, T, O, A>,
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<StyledComponentProps<C, T, O, A>> &
    React.RefAttributes<any>
> {
  const controlContext = {
    select: (selectorType: string) => `${Component}${selectorType}`,
  }

  const Control = React.forwardRef<any, StyledComponentProps<C, T, O, A>>(
    (props, ref) => {
      return (
        <ControlContext.Provider value={controlContext}>
          <Component {...props} ref={ref}>
            {props.children}
          </Component>
        </ControlContext.Provider>
      )
    },
  )

  return Control
}
