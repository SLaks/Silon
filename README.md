# ![logo](icons/android-chrome-36x36.png) [Silon](http://silon.slaks.net)
_Adders and logic gates in pure CSS_

Silon is an experiment in the true power of CSS selectors.  Most people would not expect CSS selectors to be capable of expressing arbitrary boolean logic.  However, thanks to the sibling selector (AND), the comma selector (OR), and the `:not()` selector, this is actually completely possible.

Silon is also useful as a teaching aid when teaching boolean logic and adders; having a visual, fully interactive, diagram of a full adder is quite helpful in understanding how it works.

# Features
 - Supports all modern browsers and IE10+ (the logic gates themselves actually work fine in older IEs as well, but the tab layout, which uses flexbox, does not)
 - Everything is drawn in pure CSS; no images anywhere (except the Twitter & GitHub icons, which are inline SVGs)
 - All visual changes are animated (this makes the UI surprisingly much nicer)
 - Everything is implemented in CSS; the site has no Javascript anywhere (except the Gulpfile to compile my LESS source, and except for Google Analytics)

# Implementation details
Silon is implemented using LESS to generate CSS selectors for every combination of inputs that will turn each gate on.  In effect, I created a LESS-based DSL that expresses (almost-)arbitrary boolean expressions.  My LESS mixins expand the expression into its truth table, then encode the truth table as CSS selectors using ANDs, ORs, and NOTs.

You can easily use Silon to create your own circuits of logic gates.  In your HTML file, draw the inputs, connectors, gates, and outputs that form the circuit.  Then, write a LESS file that encodes the logic of the circuit in `.coloredOp()` calls, importing [gate-theme.less](styles/gate-theme.less) and [_themed-operators.less](styles/_themed-operators.less).  For more details, read on.

## Basic operators
Operations are declared using the `.op(a, operator, b, result)` mixin.  `a` and `b` are either input selectors (which must match checkbox elements) or other `.op()` calls (as explained below).  `operator` must be the keyword `and`, `or`, or `xor`.  Finally, `result` is a detached ruleset that will be applied if the logical expression evaluates to true.

For example:

```less
.op(input-1, and, input-2, { ~ #result { font-weight: bold; } });
```

This will compile to

```css
#input-1 ~ #input-2 ~ #result {
    font-weight: bold;
}
```

Passing further operations as operands (chaining) is more complicated.  The inner `.op()` call needs to accept state from the outer call (telling it whether to invert the operation for a `xor` call, and telling it what to output) in an additional parameter.  Because of the way LESS scoping [works](https://github.com/less/less.js/issues/2556), the inner `.op()` must be called from a mixin, and must forward the mixin's parameter to `.op()`.  Thus, chained `.op()` calls accept a context parameter at the beginning, and do not accept a result parameter at the end (since they don't have their own result, but rather contribute to the result of the outermost call).  For more details, see the comments in [_operators.less](styles/_operators.less), or an upcoming blog post.

For example:

```less
.op(
	{ .c(@c) { .op(@c, input-1, xor, input-2); } },
	and,
	input-3, 
	{ ~ #result { font-weight: bold; } }
);
```

This compiles to

```css
#input-1:not(:checked) ~ #input-2:checked ~ #input-3:checked ~ #result {
  font-weight: bold;
}

#input-1:checked ~ #input-2:not(:checked) ~ #input-3:checked ~ #result {
  font-weight: bold;
}
```

The XOR call produces two separate selectors, and the AND call extends both of them to produce the final results.  Passing selectors as operands to XOR produces more interesting results; the entire inner selector will be inverted by one branch of the XOR output.  For example, swapping `and` and `xor` in the previous example yields the following:

```css
#input-1:not(:checked) ~ #input-3:checked ~ #result {
  font-weight: bold;
}

#input-2:not(:checked) ~ #input-3:checked ~ #result {
  font-weight: bold;
}

#input-1:checked ~ #input-2:checked ~ #input-3:not(:checked) ~ #result {
  font-weight: bold;
}
```

The operations expand to `((!a OR !b) AND c) OR ((a AND b) AND !c)`, and each OR becomes a separate selector.

These mixins are enough to compute the output of a complex logical expression, but they do not help you colorize the graph of connectors and intermediary gates.  For that, use the `.coloredOp()` wrapper mixin, described below.

For this reason, the generated CSS in Silon itself is vastly more complicated.  To showcase the minimal CSS for the actual logic alone, I created a simpler, completely unstyled [demo](http://silon.slaks.net/simple.html) ([LESS source](styles/simple.less), [compiled CSS](styles/simple.css)).


### Caveats
The order of the operands is important.  CSS has no unordered sibling combinator, so the elements in your HTML must appear in the same order as the operands in your expression tree.

Furthermore, each operand must appear exactly once in each generated selector; a selector like `#a ~ #a ~ #b` will not match anything.  If the same input appears multiple times (with no intervening ORs or NANDs) in a subtree of a node other than OR or NAND (note that this includes inversions from XOR operands), it will be duplicated in the output selectors, and the logic will break.  This problem occurs in the sum outputs of chained adders; to work around it, I wrote a regex in the [Gulpfile](gulpfile.js) to remove the duplicate parts from the generated css.

## Drawing circuits
The logic gates and connectors are drawn using using absolutely-positioned HTML elements.  These elements are laid out in a `<div class="Canvas">`, with `top` and `left` set in inline `style=""` to position them.  All layout is specified in REMs, allowing the entire assembly to be scaled using media queries.  The positions must align to the fixed sizes of each element as specified in the CSS; see below for more details.  The CSS is designed so that the borders do not affect positioning (they extend beyond the stated size of each element, and will be properly covered by adjacent elements), keeping units even.

### Inputs
The binary inputs are checkbox-label pairs, with the checkbox providing the state to the CSS selectors (via the `:checked` pseudo-class) and the label drawing the box and `0`/`1` (since only Chrome supports pseudo-elements on checkboxes).  To make focus work correctly, both the `<input>` and the `<label>` must have the same location specified in their inline styles (to make focus work, the checkbox cannot have `display: none`, and it must be at the same location as the checkbox or the viewport will scroll when clicked or focused).

Inputs are a 3 REM square.  Outbound connectors should begin at the center of the bottom of their inputs (1.5, 3).

### Connectors
Inputs, gates, and outputs are linked by connector elements.  These are `<div>`s with the `Connector` class, as well as either `Horizontal` or `Vertical`.  In addition to a location, they should also have their size (`width` or `height`, respectively) specified in inline styles.  Connectors should be laid out as if they have zero thickness; the line will be drawn centered around the element's stated position, and will extend outwards on both ends to cover adjacent borders.  

All connectors must be attached to a gate or input, wrapped in a single `<div>` that immediately follows the attachee.  This allows the connectors to automatically assume the color of their parent via generated CSS sibling selectors

Connectors should always meet their adjoining gates and inputs vertically; this requires no extra work (except for OR and XOR gates; see below).   When connectors meet eachother, the later connector should have a `Corner` class. along with `Left`/`Right` or `Top`/`Bottom` (respectively) classes indicating which side of the connector to draw the corner on, as well as `Up`/`Down` or `Left`/`Right` (respectively) classes specifying which direction the corner should open to (the side that the adjoining connector meets).  When a connector branches off of a different connector, the second connector should have the `Junction Right` or `Junction Top` classes (respectively), indicating the side that meets the adjoining connector.  All of these classes assume that the connectors are positioned to meet at the same point, and will extend the element to cover the appropriate border.

Finally, the incoming connectors that meet an OR or XOR gate must have an additional connector element with classes `Vertical Convex Left/Right`, positioned at the end of the connector (with the same `top` as the gate) and no height.  These elements will stretch the connector to exactly meet the convex curve of the gate.  (They must be part of the connector group so that the coloring matches the rest of the connector, and they cannot be part of the same vertical connector because the `overflow` reuqired to make the curve conflicts with corners)

## Gates
The gates themselves are `<div>`s with the `Gate` class, as well as `OR`, `XOR`, or `AND`.  For AND gates, this element should be empty.  OR gates must have two empty `<span>`s as children, and XOR gates require those followed by an empty `<div>` (all of these child elements are required for the cut-off curves that form these gates).

Gates are 4 REMs wide and 5 REMs tall, except for OR gates, which are just 4 REMs tall.  OR and XOR gates stretch slightly beyond this height so that incoming and outgoing connectors are exactly aligned to the curves of the gate; this does not affect declared layout.

## Outputs
The output elements reflect the values of the leaf nodes in the expression tree (the formal outputs of the operation).  These are empty `<div class="Result">` elements placed in the connector group following a gate.

Like inputs, outputs are a 3 REM diameter, with inbound connectors ending at the center top (1.5, 0).

## Colorizing intermediate gates
The final challenge is colorizing the intermediary gates that contribute to a complex expression.  CSS has no way for a selector to refer to a different selector, so I must output the complete truth table for each intermediary node separately.

To do that, I wrote a `.coloredOp()` mixin that wraps `.op()`.  This mixin is called identically to `.op()`, except that it takes a simple selector (matching the gate element for the operation) instead of a detach ruleset for the result, and it accepts this result selector even for chained calls (since unlike simple `.op()`s, chained calls also output their own selectors for the intermediary gates).   

The `.coloredOp()` mixin will pass its parameters to `.op()` to implement the actual logic.  It passes a result ruleset that matches the passed result selector and colorizes the gate and its outgoing connectors & output element.  For each operand that is itself a `.coloredOp()` call (as opposed to an input selector), it will then call the operand directly as a "probe" call, causing the operand to emit its own selectors to colorize its intermediary gates.  For more details, see the comments in [_themed-operators.less](styles/_themed-operators.less)

## Functions
You can also create "function" mixins that encapsulate complex logical operations, such as a full adder.  These must take the `@c` context parameter, just like simple `.coloredOp()` calls, and can also take other input parameters (selectors or further expressions) to pass as operands, or prefixes to compose selectors for intermediary gates and inputs used by the function.  When calling such a function as an input to a `.coloredOp()`, pass `@c` from the `.c()` mixin like any other chained call.  If callng a function as an outer expression, pass the literal `root`.  The function implementation should contain a single `.coloredOp()` call returning the result of the function (which can be passed as an operand), passing its `@c` parameter like any nested call.

If the function also has its own terminal outputs, it should declare them in a separate overload with `when (@c = root), (@c = probe)`, containing as many other `.coloredOp()` calls as necessary.

For an example, see the end of [_themed-operators.less](styles/_themed-operators.less), called in [chained-adder.less](styles/chained-adder.less)

## Decimal adder
The decimal adder has nothing to do with logic gates; it's just a cool demonstration of what can be done with pure CSS.  It creates a strip of numbers from `0` through the largest possible sum of the inputs, and offsets the strip by the value of each binary `1` digit when checked.  In effect, the math happens in the browser's layout engine, by adding the margins of the elements before the strip.
