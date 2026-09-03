package main

// Article bodies for seeded links. These are stored in links.article_html and
// rendered by the link viewer, so between them they need to cover the markup a
// real parsed article contains: headings, lists, blockquotes, code, tables,
// figures and inline links.
//
// {{IMAGE}} is replaced with the URL of a locally served placeholder image; if
// the link has no header image the whole <figure> is dropped (see
// seeder.renderArticle).

const articleArchitecture = `
<p><strong>Every read-it-later service eventually becomes an archive service.</strong> Users do not
notice this at first. They install the extension, they save a few dozen links a month, and for a
year or two the queue behaves like a queue. Then the company gets acquired, the API is turned off,
and eight thousand saved articles turn out to have been pointers all along.</p>

<figure class="seed-figure">
  <img src="{{IMAGE}}" alt="Diagram of the storage pipeline">
  <figcaption>The storage pipeline: fetch, extract, normalize, store.</figcaption>
</figure>

<h2>Storing the article, not the URL</h2>

<p>The first decision that matters is what a saved item actually is. If it is a URL plus some
metadata, the service is a bookmark manager and its value decays with the web. If it is the
extracted article text, stored locally, then the service keeps working when the source is gone.</p>

<p>We store four things for every link:</p>

<ul>
  <li>the cleaned, tracking-parameter-free URL</li>
  <li>the extracted article HTML, normalized to a small tag allowlist</li>
  <li>the plain text, for search</li>
  <li>optionally, a full page archive with images and CSS inlined</li>
</ul>

<p>The last one is expensive and the first three are not, which is why the archive is asynchronous
and everything else happens on the request path.</p>

<h3>Normalizing the extracted HTML</h3>

<p>Readability-style extraction produces markup that is <em>almost</em> clean. The parts that leak
through are the parts that break rendering later: inline styles that assume a light background,
<code>&lt;script&gt;</code> tags that are dropped inconsistently, and images with
<code>srcset</code> attributes pointing at CDNs that will 404 within the year.</p>

<pre><code>func normalize(doc *html.Node) {
    stripAttributes(doc, allowedAttrs)
    absolutizeURLs(doc, base)
    unwrapEmptyContainers(doc)
}</code></pre>

<blockquote>
  <p>An archive that renders differently every time the reader opens it is not an archive. It is a
  cache with good intentions.</p>
</blockquote>

<h2>What the sync layer is for</h2>

<p>Once the article is local, sync stops being the product and becomes a convenience. Reading
position, stars and tags are small, they conflict rarely, and last-write-wins is honest enough for
a single-user service. That is the whole conflict resolution strategy, and in three years it has
produced exactly one complaint.</p>

<table>
  <thead>
    <tr><th>Data</th><th>Size</th><th>Conflict strategy</th></tr>
  </thead>
  <tbody>
    <tr><td>Article HTML</td><td>~40 KB</td><td>Immutable after parse</td></tr>
    <tr><td>Full page archive</td><td>1&ndash;8 MB</td><td>Immutable after capture</td></tr>
    <tr><td>Reading position</td><td>4 bytes</td><td>Last write wins</td></tr>
    <tr><td>Tags</td><td>&lt; 1 KB</td><td>Set union</td></tr>
  </tbody>
</table>

<h2>The migration path</h2>

<p>Nobody adopts a reader by starting from zero. The import path is the product surface that
decides whether someone stays, and it needs to handle exports that are, generously, inconsistent.
Our importer accepts three formats and treats all of them as untrusted: every URL is re-parsed,
every date is bounds-checked, and every title is truncated.</p>

<p>For more on the extraction step, see <a href="https://example.com/extraction">the follow up
post</a>, which goes through the twelve heuristics that decide where an article starts.</p>

<h2>What we would do differently</h2>

<ol>
  <li>Capture the full page archive first and extract from it, rather than fetching twice.</li>
  <li>Store the extraction version alongside the output, so old articles can be re-extracted.</li>
  <li>Make reading position a range, not a scalar, so highlights and position share a mechanism.</li>
</ol>

<p>None of these are hard. All of them are much harder to retrofit than to start with, which is the
usual shape of this kind of regret.</p>
`

const articleGoErrors = `
<p>Go's error handling is famously unfashionable, and after ten years of writing it professionally
I have stopped thinking that is a problem. What <em>is</em> a problem is that most codebases pick
three different error strategies and use all of them in the same package.</p>

<h2>The three options</h2>

<p>There are really only three things you can do when a function fails:</p>

<ol>
  <li>Return a wrapped error with context</li>
  <li>Return a sentinel the caller compares against</li>
  <li>Return a custom type the caller inspects</li>
</ol>

<p>Each of these has a cost, and the costs are not symmetric.</p>

<h3>Wrapping</h3>

<p>Wrapping is the default and should stay the default:</p>

<pre><code>if err := store.Save(ctx, record); err != nil {
    return fmt.Errorf("save %s: %w", record.ID, err)
}</code></pre>

<p>The <code>%w</code> verb preserves the chain, so <code>errors.Is</code> and
<code>errors.As</code> still work at the top. The cost is one allocation and a string format, which
matters in exactly one situation: an error returned in a hot loop, millions of times a second. If
you are not in that situation, wrap.</p>

<h3>Sentinels</h3>

<p>Sentinels are for conditions the caller is <em>expected</em> to branch on:</p>

<pre><code>var ErrNotFound = errors.New("not found")

if errors.Is(err, ErrNotFound) {
    return renderEmptyState()
}</code></pre>

<blockquote>
  <p>A sentinel is API surface. Once it is exported, removing it is a breaking change, so export the
  smallest set you can defend.</p>
</blockquote>

<h3>Custom types</h3>

<p>Custom error types earn their keep when the caller needs <em>data</em> from the failure, not just
its identity — a field name, a retry-after duration, an HTTP status. Below that bar they are
ceremony.</p>

<h2>Where this breaks down</h2>

<p>The pattern that causes the most pain is a package that wraps errors from a dependency without
deciding whether that dependency's errors are part of its own contract. Callers start matching on
<code>sql.ErrNoRows</code> through three layers of abstraction, and the storage layer can never be
replaced. Either translate at the boundary or document the passthrough — silence is the one option
that always ages badly.</p>

<h2>A checklist</h2>

<ul>
  <li>Wrap by default, with the operation and the identifier in the message.</li>
  <li>Do not include the word "error" or "failed" in the wrap text; the chain already says that.</li>
  <li>Export a sentinel only when a caller must branch on it.</li>
  <li>Translate dependency errors at package boundaries.</li>
  <li>Never compare error strings.</li>
</ul>
`

const articleFrontend = `
<p>I have been writing frontend code since jQuery was the sensible choice, and the most striking
thing about the last decade is how much of the churn was the platform catching up in public.</p>

<figure class="seed-figure">
  <img src="{{IMAGE}}" alt="Timeline of browser feature adoption">
  <figcaption>Roughly when each workaround stopped being necessary.</figcaption>
</figure>

<h2>The workarounds we can retire</h2>

<p>Each of these was, at some point, a library:</p>

<ul>
  <li>Selector engines &mdash; <code>querySelectorAll</code></li>
  <li>Promise polyfills &mdash; native promises, then <code>async/await</code></li>
  <li>Layout hacks &mdash; flexbox, then grid, then subgrid</li>
  <li>Media query plumbing &mdash; container queries</li>
  <li>Parent selectors &mdash; <code>:has()</code></li>
  <li>Scroll spies &mdash; <code>IntersectionObserver</code></li>
</ul>

<p>What is interesting is not that the platform absorbed them. It is that in every case the platform
version has a different shape than the library it replaced, and the difference is usually that the
platform version is declarative where the library was imperative.</p>

<h2>Container queries change component design</h2>

<pre><code>.card-container { container-type: inline-size; }

@container (min-width: 30rem) {
  .card { grid-template-columns: 12rem 1fr; }
}</code></pre>

<p>A component that responds to its own width instead of the viewport's is finally a component. The
practical effect is that a card can be dropped into a sidebar, a modal or a full width feed without
the parent having to tell it where it is.</p>

<blockquote>
  <p>Every prop that exists only to tell a component about its context is a container query that had
  not shipped yet.</p>
</blockquote>

<h2>What is still missing</h2>

<ol>
  <li>Styling the inside of form controls without rebuilding them</li>
  <li>A real answer for view transitions across documents</li>
  <li>Anything resembling a standard for data fetching</li>
</ol>

<p>The last one is the reason frameworks are not going anywhere. Rendering is solved; coordination
is not.</p>
`

const articleRecipe = `
<p>This takes four hours, almost all of it unattended, and the only technique involved is patience.
It is the dish I make when people are coming over and I want to be finished cooking before they
arrive.</p>

<figure class="seed-figure">
  <img src="{{IMAGE}}" alt="The finished dish">
  <figcaption>Best on the second day, if you can manage it.</figcaption>
</figure>

<h2>Ingredients</h2>

<ul>
  <li>2 kg bone-in short ribs, in single-rib pieces</li>
  <li>6 anchovy fillets in oil</li>
  <li>2 onions, halved and sliced thin</li>
  <li>1 head of garlic, cloves smashed</li>
  <li>3 sprigs rosemary</li>
  <li>400 ml dry red wine</li>
  <li>400 g tinned tomatoes, crushed by hand</li>
  <li>Water or stock to cover</li>
</ul>

<h2>Method</h2>

<ol>
  <li>Salt the ribs generously and leave them at room temperature for an hour.</li>
  <li>Brown them hard on every face. This takes longer than you think &mdash; twenty minutes for the
  whole batch, in two loads, is normal.</li>
  <li>Lower the heat, add the onions and a large pinch of salt, and cook until they collapse.</li>
  <li>Add the anchovies and garlic and stir until the anchovies dissolve completely.</li>
  <li>Deglaze with the wine and reduce it by half.</li>
  <li>Return the ribs, add the tomatoes and enough liquid to come three quarters of the way up.</li>
  <li>Cover and cook at 150&deg;C for three hours, turning the ribs once.</li>
</ol>

<blockquote>
  <p>If the sauce is thin at the end, take the meat out and reduce it hard on the stove. Do not try
  to thicken it with flour.</p>
</blockquote>

<h2>Notes</h2>

<p>The anchovies are not optional and they do not make it taste of fish. They make it taste like
someone reduced a stock for two days. Nobody who eats this will identify them.</p>

<p>Leftovers are better than the original. Chill the pot overnight, lift the fat off the top, and
reheat gently.</p>
`

const articleIncidents = `
<p>Look at the last six incident reviews at your company. If the action items are some permutation
of "add alerting", "improve the runbook" and "add a test", the reviews are producing paperwork, not
understanding.</p>

<h2>The question that causes it</h2>

<p>The failure is almost always in the framing. "What went wrong?" is a question with a short
answer, and the short answer is always the last thing that changed. It invites a list of things
that were absent &mdash; a missing alert, a missing test &mdash; and absences generate generic
remedies.</p>

<p>A better question: <strong>what made the wrong thing look reasonable at the time?</strong></p>

<blockquote>
  <p>Nobody deployed the change believing it would take the site down. Something made it look safe.
  That something is the finding.</p>
</blockquote>

<h2>What that turns up</h2>

<p>Once you ask it, the answers stop being generic:</p>

<ul>
  <li>The staging environment had a tenth of the data, so the query plan differed.</li>
  <li>The dashboard showed p50, and the failure was entirely in the tail.</li>
  <li>The runbook was correct for the previous version of the deploy tooling.</li>
  <li>The alert existed, fired, and was routed to a channel nobody had been in for a year.</li>
</ul>

<p>Each of these is a specific, fixable thing. None of them would have appeared on a list of
absences, because in every case the safeguard was present &mdash; it was just measuring the wrong
thing.</p>

<h2>Running the review</h2>

<ol>
  <li>Build the timeline before the meeting, from logs and chat, not from memory.</li>
  <li>Circulate it and let people correct it in writing.</li>
  <li>In the room, walk the timeline and ask what each person believed at each step.</li>
  <li>Stop when you find the belief that was reasonable and wrong.</li>
</ol>

<p>The output is usually one or two action items instead of six, and they are the kind that get
done, because they are specific enough to finish.</p>
`
