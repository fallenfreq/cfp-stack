# sf/sl System — Open Work

The theme system's open work: what isn't done, ideas not yet decided, and known issues that are
still true. The spec is `sf-system.md`; what was done, and why, is in the commit messages.

## Current state (resume here)

Nothing is in progress on this track. The bigger next steps are the validator and linter, and
settings for every selected block.

## Bigger work

- **The validator and linter** (not built). Its rules are in `sf-system.md`, "Validator and
  linter"; new candidates go there.
- **Settings for every selected block** (proposed, not designed). With blocks selected, the
  toolbar's settings would change all of them, as in Notion, Google Docs or Figma; today it shows
  none. To decide: which settings show (only those every selected block has), how differing
  values show ("mixed"), and how the class row works when the classes differ. Each block already
  changes in place (`multiSelect.ts`).
- **The toolbar's context should carry its block's place** (not designed). `ToolbarItemContext`
  holds the block and its depth, but not its position or parent, so the block tools find them
  again with `resolveActivePos` (14 calls in `defaultItemsBlock.ts` and `defaultItemsShared.ts`).
  For an image or another leaf block that lookup lands one level short, and a Proxy fakes the
  answer. Carrying the place once would remove the Proxy. It touches every block tool, so it
  needs its own sign-off and checks.
    - It would also let the toolbar follow a block's own control: while the code block's
      language picker has focus, the toolbar could show the code block without the cursor moving.
      Today the toolbar follows only the cursor. Selecting the block while its control has focus
      was tried and taken out: typing after Shift+Tab back to the page replaced the block. Worth
      designing with the component store, when blocks with controls of their own are common.
- **Names when the component store comes** (decided, not designed). Saved pages keep only a
  block's ID; its name is looked up only where it's shown, in one place (`nodeRegistry.ts`).
  Today the node path, the slash menu and the pickers each find it their own way. To decide with
  the store: a `name` on each component (the store's planned field) beside the site's alias, and
  where each shows (two components can share an author's name; the alias is unique on the site).
  The picker's rows are told apart by their label (`ToolbarNodePicker.vue`), which two components
  named alike would break: key them by type.

## Layout

- **Columns placed straight in an inset stack late.** An inset holding a collapsing layout as
  its own item is the box that layout measures, but the inset's margins are grid tracks, so the
  layout measures wider than the line by both margins. It happens in every inset (the page
  shell, a card, a band). There's no one-line fix: no box is as wide as the line. Fine for now
  (decided with the user); until then, put the columns in a stack (example under "For the
  docs"). `line.spec.ts` has no case for it yet. Collapse by a layout's own width (under
  "Ideas") would fix it too.
- **The Split's default alignment.** A plain `sl-split` aligns its sides to the top; the Split
  block stretches them (its align setting's default). One default at the class (dropping
  `align-items: start`) moves to-do items, which are splits (the tick box's label grows from
  26px to 52 or 78px), and plain splits on app screens (`ToolbarAttributeEditor`, `GoogleMap`).
  The user's call.
- **Rules that still count hidden blocks.** A picture that is a box's only child
  (`img:only-child`, `slObject.ts`) and a Split's first column with no widths set (`slLayout.ts`)
  still count a block hidden at this width. The drag preview of several blocks (`multiSelect.ts`)
  loses the space after a shown hide/show block (it's brief).
- **Pictures and shapes.**
    - In Chrome, a picture with a shape in a row that stretches stretches to the row's height;
      WebKit keeps the shape.
    - In WebKit, an image set to cover fills a shaped box's whole height, padding included, so a
      plain box grows by its padding and a Card clips the image.
    - In WebKit, a picture with a shape and no fill, as wide as its pixels or narrower than its
      column, ignores the shape (Chrome keeps it).
    - In WebKit, a box with a shape that clips (a Card) holding more than fits keeps its shape and
      cuts the rest off; Chrome grows it to fit, as CSS says to.
    - In WebKit, a picture covering its Card is 32px taller than the Card's inside once loaded.
      Not looked into.
- **A stretched Card in WebKit.** Clicking the empty lower part of a stretched Card in a row puts
  the caret in the next heading instead of selecting the Card.
- **The class picker** offers only gap, padding, radius and collapse.
- **The `* { transition }` fade** in `main.css` is a look (motion). A theme token would move it
  to the theme: new vocabulary, undecided.

## Component blocks

- **A drag across a component block.** The rule, decided with the user: a drag in from outside
  takes the block whole. Not yet in Chrome: a drag from the text above the interactive block to
  the text below ends as a cursor where it stops (across a Card it takes the Card); WebKit takes
  the block. A check marked expected to fail in Chrome guards it (`componentBlock.spec.ts`).
- **A component block's own parts: known issues.**
    - With an outer block selected, a click on an inner block's heading keeps the outer one
      (`props.selected` is true for blocks inside a selected block).
    - With a block selected through its own text, focus is on its box: the drag handle stops
      following the pointer, and arrows, Enter and Backspace do nothing (Cmd+Z works). In
      Playwright's WebKit, Backspace goes back a page (real Safari doesn't, as far as known).
    - After a click on the block's own text, Select All highlights the whole app page and copy
      takes its text.
    - In Chrome, a drag from the block's own text into its slot or past the block ends with
      nothing highlighted; in WebKit such a drag can highlight from the top of the page.
    - In Chrome, keys pressed within the frame of a click reach the editor before it reads the
      click, in any text: on the demo, which opens with its hero image selected, they replace the
      image. No person types that fast.
    - Arrowing up from the start of a slot inside a stack inside the block lands in the next
      block's slot.
    - The code block's own view says `contenteditable="true"` (`TiptapCodeBlock.vue`), so it stays
      editable in a read-only editor, and slots keep the editability they were drawn with when an
      open editor is switched to read-only. Published pages are read-only from the start, and the
      app never switches an open editor.
    - The slot's `tabindex` comment (`customComponentNode.ts`) speaks of the focus toggle, which
      is gone. Taking the attribute out changes focus in every component block, so it waits for
      a check.
    - Atom components can't be selected by clicking.

## Editor

- **The node path names built-in blocks by their type** ("bulletList", "tableRow") where the
  pickers say "Bullet List".
- **The style tools' selection checks never apply.** Colour, Font, Aspect, Corners and Shadow
  check how many blocks are selected (`defaultItemsStyle.ts`), but the toolbar hides them whenever
  any is.
- **Picking before the theme's tokens arrive.** They load in the background; picking padding
  before they arrive leaves an empty row and sets no class, even once they come.
- **No timeout.** A fetch that never answers leaves "Loading editor…" up: tRPC has no timeout.
  A save that never finishes keeps a move away waiting with no sign (agreed: leaving waits for
  the save).
- **The code view, minor.** It sits flush under the top bar. A line break before bare text at the
  top becomes a space when switching back. Keys typed on the page in the moment the code is being
  written (about 0.1s) aren't in the code, and are replaced (undoably) only if the code is then
  edited. With two refused elements the message names the last. Tab could indent (TipTap's
  `enableTabIndentation`), but then Tab wouldn't leave the code view.
- **A sheet's embedded video** stops as the sheet slides away and loads again in the closing
  copy of the page.
- **A table cell's alignment** is also its own `align` attribute: taking `text-align` out of the
  cell's `style` alone leaves it aligned.
- **Work on every keystroke.** The scroll hint (`ToolbarScrollHint`) reads where the node path
  sits after every change, which makes the browser lay out the page there and then (1–2 ms a
  letter, the biggest single item; not looked into). Why an arrow press is two changes isn't
  looked into either. TipTap tells everything that reads the editor about each change twice; it's
  TipTap's design.
- **The preloaded icon font.** Chrome warns that it isn't used within a few seconds of the editor
  opening. Not looked into.
- **Rule errors read like developer text.** They reach the user with their message, but some
  read like developer text (the class-name check prints its pattern). Rewording them is open.
- **Leaving after the sign-in check.** A Leave that the router-wide sign-in check sends elsewhere
  asks again (read in the code only).
- **The keys after a change in the Attributes panel.** Enter in one of its fields leaves the
  block selected but the keys off the page: Undo and the arrow keys work once you click back in.
- **Dragging blocks selected together.** A drag of several ignores Alt and always moves them
  (`multiSelect.ts`, `handleDrop`). The handle of a block that isn't chosen but holds chosen ones
  drags those, or itself when there's one. The drag's picture counts "nodes", not blocks.
- **The page jumps to its top after a drag, in WebKit.** As a drag by the handle ends, the handle
  gives the editor its focus back (`FloatingDragHandle.vue`, `onDragend`), and WebKit then scrolls
  to the page's top; with that call skipped, it stays (Playwright's WebKit, not tried in Safari).
  `editor.spec.ts`, "blocks selected together move once each", selects a block again because of it.

## Popovers and browsers

- **A panel that fits nowhere, in WebKit.** Where a panel fits nowhere (a short screen, its
  button mid-screen), WebKit lets it run off the top of the screen where Chrome slides it down,
  as the spec says. It's WebKit's, with or without a fixed bar. `align-self: safe start` stops it
  at the top in WebKit, but then Chrome no longer slides a panel up on a page that doesn't
  scroll, so it's out. In the editor the room past the end brings the panel into view; elsewhere,
  at the very end of a page on a short screen, its top could stay cut off (not tried). Marked
  expected to fail in WebKit (`anchorFallback.spec.ts`).
- **Report the Safari 26 bug to WebKit:** a box anchored to an unpositioned element in a fixed
  bar is placed as though the bar scrolled with the page (`SfPopover.vue`). It needs the user's
  account.
- **Scroll-frame arrows in documents.** The `sf-is-overflow-*` script runs only in admin lists
  and toolbars, so a scroll frame on a page shows no arrows.
- **Not tried yet:** component blocks on a real phone, in real Safari and in Firefox; the
  toolbar's panels and tooltips in real Safari 26 (an iPhone or iPad on iOS 26 would do); whether
  Safari on an iPhone asks before a tab with unsaved edits closes (believed not); whether a reload
  from script (the new-version toast's Refresh) asks in a tab behind another.

## Theme and classes

- **`sf-on-*` state rules.** Every state has its bare rule; `sf-on-hover` has no border channel
  yet.
- **Icons:** decide whether in-text icons want `1.1em` (`material-symbols.css`): rounded glyphs
  look smaller.
- **Raw tokens in component CSS.** A few components still read colour tokens directly
  (`rgb(var(--sf-…))`), the escape hatch. Move each to vocabulary classes (`sf-variant-*`,
  `sf-on-*`, `sf-depth-*`) once the right class exists, one component at a time; not to utility
  classes, which are for content authors.

## Small clean-ups

- `extractCssVars` (`client/plugins/`, run from `vite.config.ts`) still writes
  `client/cssVariables.js`, which nothing reads.
- `FloatingEditorMenu.vue` isn't used anywhere (only registered for auto-import).
- Four declared TipTap packages aren't imported: table-header, table-row, task-list and
  dropcursor (`client/package.json`).
- `PromptModal.vue` and `StackableSheet.vue` say `sl-align-x-*` is grid-only; they could now use
  `sl-align-x-end`.
- `LayoutColumns.vue` and `LayoutSplit.vue` write their `align` (up and down) as an inline style,
  not a class.

## Ideas, not decided

- **Collapse by a layout's own width.** Layouts that work out their columns from their own width
  (`sf-references.md`, "Layouts that switch by their own width") would stack without a container
  query. Plain blocks and component blocks would stack alike, bleeding or not, and most of the
  collapse layer's measuring boxes would go (boxes sized by their content, the popover
  exceptions). It must keep `sl-row` (so the grid version, not flex), gaps, and container queries
  for hide and show. Grid maths alone gives only equal columns and can't express a split.
- **Layout blocks without a stepped-aside box** (deferred by the user). A layout block's content
  box steps aside (`display: contents`) so its blocks are the layout's items. Putting the layout
  class on the content box itself would need each layout component to render TipTap's content
  element as its root. Layout blocks stay Vue node views: as plain one-box nodes there would be
  two kinds of block, and clicking beside a block's content would no longer select it.
- **Picking a shell per page.** Every page sits in the page shell today; a choice per page comes
  later (decided with the user).
- **Seed on deploy,** right after migrations, once migrations run on deploy (today both are run
  by hand). Only when the seed version changes, and not once themes are edited live: a seed
  replaces the whole design.
- **A code block's language outside the editor** (the user's words): later, not now.
- **Room past the end on every page** while a panel is open, if a panel at a page's very end
  needs it. Closing it after scrolling into the room would jump the page back.

## For the docs

**Next for the docs:** split `sf-system.md` into reference (the classes and tokens), explanation
(the three actors, the vocabulary's rules) and internal design (the validator, editor
integration). User docs begin with the first one: content authors' help in the editor, guides
for theme and component authors in the repo, starting from the examples below. The owner may
make the repository private and split the system (the editor, the theme system) from the site,
versioned, to build other sites with it; whether it stays open source is open.

Examples worth keeping for page builders and component makers:

- **Columns placed straight in an inset stack late** ("Layout" above). They measure the whole
  inset, margins included: with the page at 640px (sm) they stay side by side, and stack only
  once the inset itself is 640px or less. Put them in a stack, which is as wide as the line, or
  use the editor's Columns block (to check: since a component block is one box, it measures the
  layout around it too):

    ```html
    <!-- Stacks late -->
    <div class="sl-bleed sl-inset">
    	<div class="sl-columns sl-collapse-sm">
    		<p>One</p>
    		<p>Two</p>
    	</div>
    </div>

    <!-- Stacks at sm -->
    <div class="sl-bleed sl-inset">
    	<div class="sl-stack">
    		<div class="sl-columns sl-collapse-sm">
    			<p>One</p>
    			<p>Two</p>
    		</div>
    	</div>
    </div>
    <div class="sl-bleed sl-inset">
    	<layout-columns columns="2" class="sl-collapse-sm">…</layout-columns>
    </div>
    ```

- **Don't centre the items of an inset that holds a page.** The page shrinks to its margins
  (48px). Centre the other items in a layout of their own; `page-content` is TipTap's mount box:

    ```html
    <!-- The page is 48px wide -->
    <div class="sl-inset sl-align-x-center">
    	<h1>A title</h1>
    	<div class="page-content">…</div>
    </div>

    <!-- The title is centred, the page full width -->
    <div class="sl-inset">
    	<div class="sl-stack sl-align-x-center"><h1>A title</h1></div>
    	<div class="page-content">…</div>
    </div>
    ```
