# use-sx

**CSS-in-JS, inside out and upside down.**

## What if?

What if instead of mapping selectors-to-properties-to-values...

```jsx
<button css={{
  borderStyle: 'solid',
  borderColor: 'black',
  ':hover': {
    borderColor: 'red',
  }
}}>
```

You mapped properties-to-selectors-to-values?

```jsx
<Button sx={{
  borderStyle: 'solid',
  borderColor: {
    default: 'black',
    ':hover': 'red',
  }
}}>
```

If your css attributes could accept functions as values, you could even specify colors for all states in a single theme object...

```jsx
<Button sx={{
  borderStyle: 'solid',
  borderColor: theme => theme.buttons.borderColor
}}>
```

---

And what if instead of tying your pseudo-selectors to individual elements:

```jsx
<button css={{
  ':hover': {
    borderColor: 'red'
  }
}}>
```

You could specified a control boundary, and nested elements would automatically place the `:hover` selector where it makes sense?

```jsx
<ButtonControl onClick={() => {}}>
  <Icon
    glyph={TranslationsMenu}
    sx={{
      fill: {
        default: 'black' 
        hover: 'red',
      }
    }}
  />
  <Caret sx={{
    borderColor: {
      default: 'black' 
      hover: 'red',
    }
  }} />
</ButtonControl>
```

If you could create custom style properties, you could even compose your styled components without a care for where they'll eventually be used...

```jsx
<LinkControl href='/start'>
  <ButtonBody sx={{
    color: {
      default: 'gray',
      hover: 'red',
    },
    margin: '8px 4px',
  }}>
    <ButtonContent
      caret
      glyph={Play}
      label="Play"
      sx={{
        color: 'white'
      }}
    />
  </ButtonBody>
</LinkControl>
```

See this as a [live example]().


How it works
------------

**It's just a hook.**

This package gives you a `useSx()` hook that takes styles in the format of the `sx` prop above, and returns styles in the format expected by a `css` prop -- as supported by [Styled Components](http://styled-components.com/).

*Note: Currently, the `useSx` hook requires Styled Components, as it reads directly from the styled-components `theme` context. Support for emotion would make a great Pull Request! 😉*


## `useSx(options)`

### Basic usage

```js
export const Button = React.forwardRef(({ sx, ...rest }, ref) => {
  const css = useSx({
    // The `sx` option accepts an array of styles
    sx: [
      {
        // Pass your default styles first
        backgroundColor: 'transparent',
        border: '1px solid black',
        borderColor: {
          focus: 'blue',
        }
        color: 'black'
      },
      // Then pass in styles from the component's `sx` prop
      sx,
      {
        // Finally, pass in any override styles -- things you don't want to be
        // customizable by the `sx` prop.
        cursor: 'pointer',
      },
    ],
  })

  return <button {...rest} css={css} ref={ref} />
})

// Then render your component like any other
ReactDOM.render(
  <Button sx={{
    opacity: {
      default: 1,
      hover: 0.9,
      active: 0.8,
    }
  }}>
    Hello, world!
  </Button>,
  document.body
)
```


### Mapped props

By passing a `maps` property to `useSx`, you can add custom style properties to your components. These custom properties can then be used with theme functions and selector objects -- just as with standard CSS properties.

For example, this `<Caret>` component accepts three custom style props:

- `color`, which maps directly to the `borderTopColor` prop
- `direction`, which maps to varying rotate transforms
- `size`, which sets `borderWidth` and a corresponding negative margin

```jsx
export const Caret = React.forwardRef(({ sx, ...rest }, ref) => {
  const css = useSx({
    sx: [
      {
        color: (theme = {}) => theme.foregroundColor || 'black',
        direction: 'down',
        width: 5,
      },
      sx,
      {
        borderColor: 'transparent',
        borderStyle: 'solid',
        height: 0,
        width: 0,
      },
    ],
    maps: {
      color: (value: string) => ({
        borderTopColor: value,
      }),
      direction: (value: CaretDirection) => ({
        transform: {
          down: `rotate(0)`,
          up: `rotate(180deg)`,
          left: `rotate(-90deg)`,
          right: `rotate(90deg)`,
        }[value],
      }),
      width: (value: number) => ({
        borderWidth: value,
        marginBottom: -value,
      }),
    },
  })

  return <div {...rest} css={css} ref={ref} />
})

ReactDOM.render(
  <Caret sx={{
    color: {
      default: 'black',
      hover: 'red',
    },
    width: 5,
  }}>
    Hello, world!
  </Button>,
  document.body
)
```


## `control(StyledComponent)`

This is a Higher Order Function which expects a Styled Component, returning an identical component that acts as a **control boundary** -- i.e. the component to which `:hover` pseudoselectors on nested elements will be applied.


## `mergeSx(sx)`

This function merges anything that can be passed into the `sx` option for `useSx` into a single object.

```jsx
const mergedSx = mergeSx([
  null,
  {
    color: 'inherit', 
  },
  {
    color: 'black',
  }
])

console.log(mergedSx.color) // black
```

This comes in handy when creating composite components that accept an `sx` prop, and pass individual style properties down to specific children.

For example, here's how you might use `mergeSx()` to extract the `color` style from a `<ButtonContent>` component's props, and pass it down to nested `<Icon>` and `<Caret>` elements:

```jsx
export const ButtonContent = React.forwardRef((props, ref) => {
  const { caret, glyph, label, sx, ...rest } = props

  const css = useSx({ sx })
  const color = mergeSx(sx).color

  return (
    <div css={css} ref={ref} {...rest}>
      <Icon
        glyph={glyph}
        label={label}
        sx={{
          color,
          size: 16,
        }}
      />
      {label}
      {caret && (
        <>
          <Space width={4} />
          <Caret sx={{ color }} />
        </>
      )}
    </div>
  )
})
```

License
-------

MIT licensed.
