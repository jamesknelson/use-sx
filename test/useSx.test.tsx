import React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { renderHook } from '@testing-library/react-hooks'
import '@testing-library/jest-dom/extend-expect'

import { control, createUseSx, defaultSelectors, useSx } from '../src'

describe('default useSx hook', () => {
  test('can access styled-components theme context via functions', () => {
    const theme = { borderColor: 'red' }
    const wrapper = ({ children }) => (
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    )
    const { result } = renderHook(
      () =>
        useSx({
          sx: {
            borderColor: (theme) => theme.borderColor,
          },
        }),
      { wrapper },
    )

    expect(result.current).toEqual({
      borderColor: 'red',
    })
  })

  test('supports combined hover and default selectors', () => {
    const { result } = renderHook(() =>
      useSx({
        sx: {
          borderColor: {
            default: 'black',
            hover: 'red',
          },
        },
      }),
    )

    expect(result.current).toEqual({
      borderColor: 'black',
      '&:hover': {
        borderColor: 'red',
      },
    })
  })

  test('allows customization of hover selector via control context', () => {
    const StyledButtonControl = styled.button``
    const ButtonControl = control(StyledButtonControl)
    const theme = {
      borderColor: {
        default: 'black',
        hover: 'red',
      },
    }
    const wrapper = ({ children }) => (
      <ThemeProvider theme={theme}>
        <ButtonControl>{children}</ButtonControl>
      </ThemeProvider>
    )
    const { result } = renderHook(
      () =>
        useSx({
          sx: {
            borderColor: theme.borderColor,
          },
        }),
      { wrapper },
    )

    expect(result.current).toEqual({
      borderColor: 'black',
      '.sc-AxjAm:hover &': {
        borderColor: 'red',
      },
    })
  })

  test('allows mapped selectors', () => {
    const { result } = renderHook(() =>
      useSx({
        maps: {
          color: (value) => ({
            fill: value,
          }),
        },
        sx: {
          color: {
            default: 'black',
            hover: 'red',
          },
        },
      }),
    )

    expect(result.current).toEqual({
      fill: 'black',
      '&:hover': {
        fill: 'red',
      },
    })
  })

  test('allows nested selectors', () => {
    const theme = {
      borderColor: {
        default: 'black',
        hover: 'red',
      },
    }
    const wrapper = ({ children }) => (
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    )
    const { result } = renderHook(
      () =>
        useSx({
          sx: {
            width: {
              default: '100%',
              '@media(min-width: 420px)': {
                div: '50%',
              },
            },
          },
        }),
      { wrapper },
    )

    expect(result.current).toEqual({
      width: '100%',
      '@media(min-width: 420px)': {
        div: {
          width: '50%',
        },
      },
    })
  })
})

describe('custom useSx hook', () => {
  test('can create useSx hook with custom named selectors', () => {
    const useSx = createUseSx({
      ...defaultSelectors,
      mobile: (theme: any) => theme.media.mobile,
    })

    const theme = {
      media: {
        mobile: '@media(max-width: 420px)',
      },
    }

    const wrapper = ({ children }) => (
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    )

    const { result } = renderHook(
      () =>
        useSx({
          sx: {
            width: {
              default: '100%',
              mobile: '50%',
            },
          },
        }),
      { wrapper },
    )

    expect(result.current).toEqual({
      width: '100%',
      '@media(max-width: 420px)': {
        width: '50%',
      },
    })
  })
})
