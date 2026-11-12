# sf/sl System — Open Work

The theme system's open work: what isn't done, ideas not yet decided, and known issues that are
still true. The spec is `sf-system.md`; what was done, and why, is in the commit messages.

## Current state (resume here)

Next: settings for every selected block.

## Bigger work

- **The validator and linter.** Its rules, and where each shows, are in `sf-system.md`,
  "Validator and linter"; new candidates go there. Left for later: the IDE linter, and a theme's
  check when it's saved, once there's a theme editor. The IDE linter's `valid-heading-class`
  would flag the prompt's label, which wears `sf-heading-2` on purpose (`PromptModal.vue`): the
  rule becomes pages only, or the label changes. Its reader takes a component's classes from the
  component's file, as the editor takes them from its drawn root: those written on its root, and
  one set by a setting (`:class`) only as one that may be set. Whether a component's layout
  classes must be written, not set by a setting, is settled with it.
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
  block's ID; its name is looked up only where it's shown, in one place (`nodeRegistry.ts`), and
  every place that names a block shows that name. To decide with the store: a `name` on each
  component (the store's planned field) beside the site's alias, and where each shows (two
  components can share an author's name; the alias is unique on the site).
  The picker's rows are told apart by their label (`ToolbarNodePicker.vue`), which two components
  named alike would break: key them by type. A site's alias (the tag the page writes) can't hold
  a `.` or `#`: the validator's page reader reads `my-card.v2` as `my-card` wearing `v2`, as
  hastscript reads a tag as a selector.

## Layout

- **A table wider than its column makes the whole page scroll sideways.** A table's column widths
  are kept (pasted with it, `<col width>`, or a cell's own `colwidth`), and it's drawn as wide as
  they add up to: two of 900 make it 1800px, and the page scrolls sideways at any width
  (measured, 1440 and 390 wide). Owner, 2026-10-27: the widths stay; fitting the table is the
  layout's to fix, in a session of its own.
- **Columns placed straight in an inset stack late.** An inset holding a collapsing layout as
  its own item is the box that layout measures, but the inset's margins are grid tracks, so the
  layout measures wider than the line by both margins. It happens in every inset (the page
  shell, a card, a band), to the Columns block too. There's no one-line fix: no box is as wide
  as the line. Fine for now (decided with the user); until then, put the columns in a stack
  (example under "For the docs"). The validator's `no-collapse-straight-in-columns` leaves it
  out. `line.spec.ts` has no case for it yet. Collapse by a layout's own width (under
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
    - Atom components can't be selected by clicking.

## Editor

- **The style tools' selection checks never apply.** Colour, Font, Aspect, Corners and Shadow
  check how many blocks are selected (`defaultItemsStyle.ts`), but the toolbar hides them whenever
  any is.
- **Picking before the theme's tokens arrive.** They load in the background; picking padding
  before they arrive leaves an empty row and sets no class, even once they come.
- **No timeout.** A fetch that never answers leaves "Loading editor…" up: tRPC has no timeout.
  A save that never finishes keeps a move away waiting with no sign (agreed: leaving waits for
  the save).
- **A video whose address isn't YouTube's** shows nothing: TipTap writes its iframe without the
  address, so a copy has none, and nor does the code view's code, so an edit there loses it. A
  paste or the code view brings one in: the code view's check counts the address as kept, as the
  page reads it (measured).
- **A span block with a colour in its style** (from its panel, or a saved page) reads back from
  the code view as coloured text, its class and id gone, which the code view refuses: the colour's
  rule takes any span with a colour, before the span block's.
- **The code view's check goes by names, not values.** An attribute the page writes with a value
  of its own (a video's `autoplay`, `loop`), or reads but can't take (`<ol start="x">`, written as
  `start="NaN"`; `<td align="justify">`; `<col width="50%">`, read as 50 pixels), isn't refused;
  nor is an option typed into a video's address (`autoplay=1`), which the page writes again its
  own way. Bold or a link on inline code goes, as inline code takes no other mark, while the
  element keeps it on the rest of its text: the check goes by element.
- **A video's address comes back in the page's form.** After an edit in the code view, a
  `youtu.be/…` or `/shorts/…` address is saved as `watch?v=…`: the same video for visitors. A start
  set on a `youtu.be/…` or `/embed/…` address is lost there, as TipTap writes none in those (nor
  did visitors see it).
- **A theme colour comes back from the code view as a style.** Text given `sf-color-primary`
  (with or without a see-through step) is read as the colour's value, and written as
  `style="color: rgba(…)"`, not as the class: the palette doesn't parse a theme's colour that holds
  a `var()` fallback (`colorPalette.ts`; measured by an agent).
- **A pasted column list's widths can land on the wrong columns.** TipTap reads a cell's width
  from the `<col>` at the cell's place in its row, not its column, and from any `colgroup > col` in
  its table, an inner table's too (`parseColwidth`, extension-table): after a merged cell, in a
  short first row, in a table in a table. The code view's check goes by names, so it can't tell
  (measured by an agent).
- **A table whose first row has fewer cells than the next** gets the missing cell first, not
  last: its text moves a column right (prosemirror-tables' `fixTables`; a shorter later row gets it
  last; measured).
- **The code view, minor.** It sits flush under the top bar. A line break before bare text at the
  top becomes a space when switching back. Keys typed on the page in the moment the code is being
  written (about 0.1s) aren't in the code, and are replaced (undoably) only if the code is then
  edited. With two elements the page doesn't know, the message names the last. A value a setting
  can't take is named, not where it is. Tab could indent (TipTap's `enableTabIndentation`), but
  then Tab wouldn't leave the code view.
- **A sheet's embedded video** stops as the sheet slides away and loads again in the closing
  copy of the page.
- **A table cell's alignment** is also its own `align` attribute: taking `text-align` out of the
  cell's `style` alone leaves it aligned. A cell aligned by its setting alone (pasted as
  `align="center"`, or from a saved page) gets `text-align` in its own style too once copied or
  through the code view.
- **Work on every keystroke.** The scroll hint (`ToolbarScrollHint`) reads where the node path
  sits after every change, which makes the browser lay out the page there and then (1–2 ms a
  letter, the biggest single item; not looked into). Why an arrow press is two changes isn't
  looked into either. TipTap tells everything that reads the editor about each change twice; it's
  TipTap's design.
- **Rule errors read like developer text.** They reach the user with their message, but some
  read like developer text (the class-name check prints its pattern). Rewording them is open.
- **Leaving after the sign-in check.** A Leave that the router-wide sign-in check sends elsewhere
  asks again (read in the code only).
- **The keys after a change in the Attributes panel.** Enter in one of its fields leaves the
  block selected but the keys off the page: Undo and the arrow keys work once you click back in.
- **The handle of a block holding chosen ones.** When the block isn't chosen itself, its handle
  drags the chosen blocks inside it, or itself when there's one (`multiSelect.ts`,
  `buildMultiDragSlice`).
- **The drop line.** ProseMirror's (StarterKit's dropcursor) goes where the pointer is in the
  text, so it can show a different place from where a block lands (a paragraph let go on the top
  of another: the line below it, the block above), and nothing shows that a drop is refused. One
  place for both would be the app's own line (a new class).
- **Paste and blocks that don't fit.** Paste fits what's pasted its own way, not checked against
  the drop's cases (`multiSelect.ts`, `whereBlocksGo`): a list item into an item's text, a
  heading at an item's start. Outside a list, a list item selected whole gets a new list around
  it, of the first kind that can hold it, so a numbered item becomes a bullet (ProseMirror's own
  fitting).
- **A block dragged by its handle onto a list item** becomes a second line of the item, under its
  line, where pasted it goes in as copied lines do (a line an item, a list nested):
  the handle has its own placement (`dropBlocks`, `multiSelect.ts`; owner, 2026-10-31: a fix of
  its own). A picture dragged by itself goes where ProseMirror drops a block, between blocks
  (`dropPoint`): at an item's start, above the list, where pasted it goes in the item Enter makes.
- **An item holding more than one line.** Its second line, copied by its text from inside the
  first, becomes an item of its own when pasted in a list, not a line of the item the first line
  joins (`copyAndPaste.ts`, `putInList`). Pasting at its second line splits the item as Enter
  does, a block copied whole too, which used to stay in the item (owner, 2026-10-31: kept for
  now).
- **Sub-items copied from their item's line end.** Ending inside them, only the sub-items are
  copied, and in a list they join it; going on into the next item, the item comes too, and they
  nest under the item pasted at (`copyAndPaste.ts`, `withSubItems`).
- **Styles from another page.** Items copied from a web page in Chrome can bring the browser's own
  inline styles (`style="box-sizing: border-box; …"`), saved on the blocks pasted (seen with a copy
  made in the page, not yet with a real site).
- **Alt-copy by hand.** A real Option-drag in macOS Chrome and Safari is unchecked: the handle
  allows only a move (`effectAllowed`, `FloatingDragHandle.vue`), and Playwright's Alt may not
  show what a person gets.
- **What's selected after an Alt-copy of a Card or a to-do item.** The selection across the copy
  (`dropBlocks`, `multiSelect.ts`) becomes a cursor in the next block when the copy's id is taken
  off (`allowAttributesExtension.ts`), so the toolbar follows that block.
- **The toolbar's target with the page or a Card selected whole.** After Ctrl-A the node path
  shows only the page, but the toolbar shows the first block's tools, and a list's buttons change
  only that list. A Card selected whole after a deeper crumb was picked keeps its crumb current,
  while the list tools act on its first list (`resolveDragHandleTargetFromSelection`,
  `dragHandle.ts`).
- **A chosen list that changes kind leaves the choice.** A list chosen with Toggle selection, then
  changed to or from a to-do list by the keys or the slash menu, drops out of the blocks chosen:
  `changedInPlace` (`multiSelect.ts`) doesn't count a list written anew.
- **A span's words in a line made code.** Making the line a code block, or joining it to one with
  Backspace or Delete, deletes a span in it with its words, where bold keeps them: ProseMirror
  deletes an inline node a block can't hold (`clearIncompatible`), and only a patch reaches it.
  Rare, and Undo brings them back (owner, 2026-11-01: not worth a patch). If it's ever wanted:
  keep all the text, and warn that the span's look and settings go. A span's words aren't always
  words (an icon's are its name).
- **Text selected from code into a line holding bold or a span.** Delete leaves the rest of the
  line a line of its own, where plain text joins the code; typing over it puts the first letter in
  the code and the next in the line. ProseMirror's fitting won't put formatting or a span in code.
- **Backspace after a quote** (TipTap's own, since 3.32) puts the cursor at the end of the line
  joined to the quote's last line, not where they meet. With code last in the quote, a span in the
  line splits it there: the words before it join the code, the rest stay a line in the quote.

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
  from script ("This page couldn't load"'s Refresh) asks in a tab behind another.

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

- `PromptModal.vue` and `StackableSheet.vue` say `sl-align-x-*` is grid-only; they could now use
  `sl-align-x-end`.
- `LayoutColumns.vue` and `LayoutSplit.vue` write their `align` (up and down) as an inline style,
  not a class.
- The editor's list of components (`editorComponents.ts`) writes each component's settings and
  their defaults again (a Stack's `align`, `'stretch'`, is in `LayoutStack.vue` too). A built
  component keeps its settings and their defaults as data (compiled, 2026-11-10), so the list
  could take them from the component; the choices a setting offers are only in its type.
- Three of the component preview's stories show an error: the account page and the email-change
  card (their forms need the app's query client, which the preview doesn't set up) and the node
  path (its stand-in editor, `fakeEditor` in `stories.ts`, has no `$pos.before`). Nothing runs
  the preview and a story's error doesn't fail it, so it went unbuilt from 2026-10-06 to
  2026-11-12 unnoticed: `pnpm test` could build it and fail on a story's error.

## Ideas, not decided

- **A Card with no layout framing a picture** (a feature, owner 2026-11-09). Today a Card that
  frames a picture takes a layout, such as Stack, and the validator says so
  (`require-picture-size`): its blocks are in a box of its own, which the fill doesn't reach
  (measured in Chrome: 720px, then 1241px with a square picture).
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
- **Pages readable offline** (owner, 2026-11-12: later). A service worker, as `vite-plugin-pwa`
  sets one up, keeping the site's code and the server's answers for public pages (the network
  first, the last copy offline), never signed-in data. A first version, keeping only the code,
  with a new-version toast, was built (2026-10-09) and parked: the plugin's prompt mode, as its
  auto-update mode deletes the old version's files under open tabs; as the plugin does, its
  Refresh reloads every open tab, losing unsaved edits in them. Installing as an app needs only a
  manifest and icons (192 and 512 px), no service worker.
- **Room past the end on every page** while a panel is open, if a panel at a page's very end
  needs it. Closing it after scrolling into the room would jump the page back.
- **Keeping HTML comments written in the code view,** which refuses them for now (owner,
  2026-10-18: not now).
- **Pasting warns of what the page can't keep,** as leaving the code view does (owner,
  2026-10-27).
- **Keeping a style the page turns into a mark** (`font-weight: bold` on `<em>`), which the code
  view refuses for now (owner, 2026-10-27).
- **Tick boxes and column widths in a copy to another app.** A copy has neither, as a block's HTML
  holds each setting once and its view draws them (owner, 2026-10-29: later).
- **The validator's warnings underlined in the code view** as you type (owner, 2026-11-01: later;
  they show on the blocks once you leave it). Tried: Lezer's HTML parser (`@lezer/html`, 5 KB)
  finds each start tag a browser would also start (`<` and a letter); a numbered attribute goes in
  each, in a copy, read with `cantKeep.ts`'s reading, which ties each block to its element.
  ProseMirror's `findPositions` won't do (it misses a picture at a paragraph's start, and is slow
  with many spots); Prettier's reader refuses half-typed code. A check takes about 10 ms at 544
  lines, 44 at 2,173, mostly readings leaving already does; one read could serve them all.

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
  once the inset itself is 640px or less. The editor's Columns block does the same, as a
  component block is one box (measured 2026-11-03). Put them in a stack, which is as wide as the
  line:

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
