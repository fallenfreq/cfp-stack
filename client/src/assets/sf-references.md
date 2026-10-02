# sf/sl References

Outside work the system draws on, or could learn from. The spec is `sf-system.md`; open
work is `sf-system-todo.md`.

## Layouts that switch by their own width

- Every Layout's [Switcher](https://every-layout.dev/layouts/switcher/), from Heydon Pickering's
  [Flexbox Holy Albatross](https://heydonworks.com/article/the-flexbox-holy-albatross/).
- Temani Afif's grid version:
  [Responsive Layouts, Fewer Media Queries](https://css-tricks.com/responsive-layouts-fewer-media-queries/).

A size worked out from `(threshold - 100%) * a big number` stacks a layout below a width with
no container around it: the `100%` is the layout's own width. It's an alternative to
container-query collapse. The todo has it as "Idea: collapse by a layout's own width".

## Breakout grids

- Ryan Mulligan's [Layout Breakouts with CSS Grid](https://ryanmulligan.dev/blog/layout-breakouts/).
- Kevin Powell's content grid: named lines and a full-width column, nested with
  `grid-template-columns: inherit` so a full-width section keeps its content on the line.

The same idea as `sl-inset` and `sl-bleed`. They add a `breakout` width, between the line and
the edges.

## A block editor with the same full-bleed problem

WordPress Gutenberg. Its
[full-width blocks](https://make.wordpress.org/themes/2022/09/07/full-width-blocks-and-root-padding-in-wordpress-6-1/)
pull out by the side padding with negative margins
([the change](https://github.com/WordPress/gutenberg/pull/42085)). Its bugs make good test
cases:

- [padding missing on nested full-width blocks](https://github.com/WordPress/gutenberg/issues/44404);
- [padding doubled on child blocks](https://github.com/WordPress/gutenberg/issues/43095).

Its Columns block stacks by [screen width](https://github.com/WordPress/gutenberg/pull/31816),
not its own, so a narrow column on a wide screen never stacks.

## Named containers

[Tailwind v4](https://tailwindcss.com/docs/responsive-design): `@container/name` names a box,
and `@md/name:` asks that box rather than the nearest one, as `sf-document` does.
