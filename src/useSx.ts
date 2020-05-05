import * as CSS from 'csstype'
import { useContext } from 'react'
import { ThemeContext } from 'styled-components'

import { Control, ControlContext } from './control'
import { CSSObject } from './cssObject'
import { CastableToTruthyArrayOf, ensureTruthyArray } from './ensureTruthyArray'
import { isPlainObject } from './isPlainObject'

// Style maps allow custom `sx` properties, which map to one or more css
// properties on the same selector.

export type SxMap<TValue, Theme> = (
  value: TValue,
  theme: Theme,
) => CSS.Properties

export type SxMaps<Theme> = {
  [name: string]: SxMap<any, Theme>
}

// Style selectors allow multiple values to be specified for a single `sx`
// property. All matching selectors will be applied.
//
// This function receives a `Control` object, which can be used to create
// selectors that apply to certain states of any ancestor element which has
// been marked as the control boundary.
//
// Returning null indicates that values for the selector should not be used.

export type SxSelector<Theme> = (
  theme: Theme,
  control?: Control,
) => null | string

export interface SxSelectors<Theme> {
  [name: string]: SxSelector<Theme>
}

// The values of SX properties can be specified either as:
//
// - a value
// - a function mapping theme to value
// - an object mapping selectors values or value functions

export type SxProperty<Value, Theme, S extends SxSelectors<Theme>> =
  | Value
  | ((theme: Theme) => Value)
  | {
      [Selector in keyof S | 'default']: SxProperty<Value, Theme, S>
    }

export type SxObject<
  Theme,
  Properties extends { [name: string]: any } = CSS.Properties,
  Selectors extends SxSelectors<Theme> = DefaultSelectors
> = {
  [Prop in keyof Properties]?: SxProperty<Properties[Prop], Theme, Selectors>
}

export type ThemeableSx<
  Theme,
  Properties extends { [name: string]: any } = CSS.Properties,
  Selectors extends SxSelectors<Theme> = DefaultSelectors
> = CastableToTruthyArrayOf<SxObject<Theme, Properties, Selectors>>

export interface CompileSxOptions<
  Theme,
  Selectors extends SxSelectors<Theme> = DefaultSelectors,
  Maps extends SxMaps<Theme> = any
> {
  control?: Control
  maps?: Maps
  selectors?: Selectors
  theme?: Theme
  sx: ThemeableSx<
    Theme,
    Omit<CSS.Properties, keyof Maps> &
      {
        [Prop in keyof Maps]: SxProperty<
          Maps[Prop] extends SxMap<infer TValue, any> ? TValue : never,
          Theme,
          Selectors
        >
      },
    Selectors
  >
}

export function createUseSx<
  Theme,
  S extends SxSelectors<Theme> = DefaultSelectors
>(selectors: S = defaultSelectors as any) {
  const useStyle = (props: CompileSxOptions<Theme, S>): CSSObject => {
    const control = useContext(ControlContext)
    const theme = useContext(ThemeContext)

    return compileSx<Theme>({
      control: props.control || control,
      selectors: props.selectors || selectors,
      maps: props.maps,
      sx: ensureTruthyArray(props.sx),
      theme: props.theme || theme,
    })
  }

  return useStyle
}

export const defaultSelectors = {
  active: createDefaultSelector('active'),
  checked: createDefaultSelector('checked'),
  disabled: createDefaultSelector('disabled'),
  focus: createDefaultSelector('focus'),
  focusWithin: createDefaultSelector('focus'),
  hover: createDefaultSelector('hover'),
}

function createDefaultSelector<Type extends keyof Control>(type: Type) {
  return (theme: any, control?: Control) => {
    if (!control) {
      return '&:' + type
    } else if (control[type] !== undefined) {
      return control[type] ? '&' : null
    } else {
      return control.select(':' + type) + ' &'
    }
  }
}

export interface DefaultSelectors extends SxSelectors<any> {
  active: SxSelector<any>
  checked: SxSelector<any>
  disabled: SxSelector<any>
  focus: SxSelector<any>
  focusWithin: SxSelector<any>
  hover: SxSelector<any>
}

export type Sx<
  Properties extends { [name: string]: any } = CSS.Properties,
  Selectors extends SxSelectors<any> = DefaultSelectors
> = ThemeableSx<any, Properties, Selectors>

export const useSx = createUseSx(defaultSelectors)

/**
 * Merges an sx prop, which can be an array and can contain falsy values, into
 * a single sx object.
 */
export function mergeSx<
  Theme,
  Properties extends { [name: string]: any },
  Selectors extends SxSelectors<Theme> = DefaultSelectors
>(
  sx: ThemeableSx<Theme, Properties, Selectors>,
): SxObject<Theme, Properties, Selectors> {
  return ensureTruthyArray(sx).reduce((acc, x) => Object.assign(acc, x), {})
}

function compileSx<Theme>(options: CompileSxOptions<Theme, any>): CSSObject {
  const themedCSS = (theme: Theme) => {
    const { maps, sx } = options
    const styleObject = mergeSx(sx)
    const mergedTheme = {
      ...theme,
      ...options.theme,
    }

    if (maps) {
      const mapKeys = Object.keys(maps)
      for (const key of mapKeys) {
        const mapValue = styleObject[key]
        delete styleObject[key]
        Object.assign(styleObject, maps[key](mapValue, mergedTheme))
      }
    }

    const props = Object.keys(styleObject)
    const output: CSSObject = {}
    for (const propName of props) {
      mutableCompileSxProperty(
        mergedTheme,
        options.selectors,
        options.control,
        output,
        propName,
        styleObject[propName],
      )
    }

    return output
  }

  // TODO: return a function that can receive the theme directly from the
  // styled-components and emotion `css` prop.
  return themedCSS(options.theme || ({} as Theme))
}

function mutableCompileSxProperty<Theme>(
  theme: Theme,
  selectors: SxSelectors<Theme> = {},
  control: Control | undefined,
  output: CSSObject,
  propName: string,
  x: SxProperty<any, any, any>,
): void {
  if (typeof x === 'function') {
    output[propName] = x(theme)
  } else if (typeof x === 'number' || typeof x === 'string') {
    output[propName] = x
  } else if (isPlainObject(x)) {
    const selectorNames = Object.keys(x)
    for (const selectorName of selectorNames) {
      let subOutput: CSSObject = output
      if (selectorName !== 'default') {
        const selector = selectors[selectorName]
          ? selectors[selectorName](theme, control)
          : selectorName
        if (!selector) {
          continue
        }
        if (!output[selector]) {
          output[selector] = {} as CSSObject
        }
        subOutput = output[selector] as CSSObject
      }
      mutableCompileSxProperty(
        theme,
        selectors,
        control,
        subOutput,
        propName,
        x[selectorName],
      )
    }
  }
}
