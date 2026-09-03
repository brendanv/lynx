package main

import (
	"fmt"
	"html"
	"math"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// Record IDs are fixed so that seeded URLs (/link/<id>/view, /feed/<id>/items,
// ...) stay stable across runs. PocketBase requires exactly 15 lowercase
// alphanumeric characters.
const (
	userDemoID   = "lynxdemouser001"
	userSecondID = "lynxdemouser002"

	tagTechID     = "lynxseedtag0001"
	tagGoID       = "lynxseedtag0002"
	tagFrontendID = "lynxseedtag0003"
	tagLongformID = "lynxseedtag0004"
	tagRecipesID  = "lynxseedtag0005"
	tagUnusedID   = "lynxseedtag0006"

	feedEngineeringID = "lynxseedfeed001"
	feedGoWeeklyID    = "lynxseedfeed002"
	feedNeverFetchID  = "lynxseedfeed003"
)

// seedImageDir is the sub directory of pb_public that placeholder images are
// written to. PocketBase serves pb_public at the root of the backend.
const seedImageDir = "seed-images"

type seedUser struct {
	ID            string
	Username      string
	Email         string
	Name          string
	SettingsID    string
	AutoSummarize bool
	AutoTag       bool
	Primary       bool
}

// seedUsers is ordered: the primary user owns the interesting data, the second
// user exists so tests can prove per-user filtering works.
var seedUsers = []seedUser{
	{
		ID:            userDemoID,
		Username:      "demo",
		Email:         "demo@lynx.test",
		Name:          "Demo Reader",
		SettingsID:    "lynxseedstng001",
		AutoSummarize: true,
		AutoTag:       true,
		Primary:       true,
	},
	{
		ID:         userSecondID,
		Username:   "second",
		Email:      "second@lynx.test",
		Name:       "Second Reader",
		SettingsID: "lynxseedstng002",
	},
}

type seedTag struct {
	ID   string
	User string
	Name string
	Slug string
}

var seedTags = []seedTag{
	{ID: tagTechID, User: userDemoID, Name: "technology", Slug: "technology"},
	{ID: tagGoID, User: userDemoID, Name: "golang", Slug: "golang"},
	{ID: tagFrontendID, User: userDemoID, Name: "frontend", Slug: "frontend"},
	{ID: tagLongformID, User: userDemoID, Name: "longform", Slug: "longform"},
	{ID: tagRecipesID, User: userDemoID, Name: "recipes", Slug: "recipes"},
	// Not attached to any link, so the tags page shows a zero count.
	{ID: tagUnusedID, User: userDemoID, Name: "someday maybe", Slug: "someday-maybe"},
	{ID: "lynxseedtag0007", User: userSecondID, Name: "other user tag", Slug: "other-user-tag"},
}

type seedFeed struct {
	ID          string
	User        string
	Name        string
	FeedURL     string
	Description string
	ImageFile   string
	AutoAdd     bool
	// LastFetchedDaysAgo is negative for a feed that has never been fetched.
	LastFetchedDaysAgo float64
}

var seedFeeds = []seedFeed{
	{
		ID:                 feedEngineeringID,
		User:               userDemoID,
		Name:               "Example Engineering Blog",
		FeedURL:            "https://engineering.example.com/feed.xml",
		Description:        "Posts about building and running the Example platform.",
		ImageFile:          "feed-engineering.svg",
		AutoAdd:            true,
		LastFetchedDaysAgo: 0.2,
	},
	{
		ID:                 feedGoWeeklyID,
		User:               userDemoID,
		Name:               "Go Weekly",
		FeedURL:            "https://goweekly.example.com/rss",
		Description:        "A weekly roundup of Go news, articles and projects.",
		AutoAdd:            false,
		LastFetchedDaysAgo: 2,
	},
	{
		ID:                 feedNeverFetchID,
		User:               userDemoID,
		Name:               "Never Fetched Feed",
		FeedURL:            "https://never-fetched.example.com/atom.xml",
		AutoAdd:            false,
		LastFetchedDaysAgo: -1,
	},
}

type seedLink struct {
	ID    string
	User  string
	Title string
	URL   string
	// AddedDaysAgo also drives the default sort order of the feed.
	AddedDaysAgo float64
	// ArticleDaysAgo is negative when the article has no publication date.
	ArticleDaysAgo float64
	// ReadDaysAgo is negative for an unread link.
	ReadDaysAgo float64
	// StarredDaysAgo is negative for a link that is not starred.
	StarredDaysAgo  float64
	Author          string
	Excerpt         string
	Summary         string
	Tags            []string
	SuggestedTags   []string
	Feed            string
	HeaderImage     string
	Article         string
	ReadTimeSeconds int
	// ReadingProgress is a fraction between 0 and 1.
	ReadingProgress float64
	Archive         bool
}

// seedLinks covers the states the UI renders differently: read/unread,
// starred, summarized, tagged, suggested tags, feed provenance, archived,
// partially read, missing metadata, and very long text. There are more than
// one page worth (the feed paginates at 18) so pagination is exercised too.
var seedLinks = []seedLink{
	{
		ID:              "lynxseedlink001",
		User:            userDemoID,
		Title:           "Designing a read-it-later service that outlives its hype cycle",
		URL:             "https://engineering.example.com/posts/read-it-later-architecture",
		AddedDaysAgo:    0.1,
		ArticleDaysAgo:  1,
		ReadDaysAgo:     -1,
		StarredDaysAgo:  0.05,
		Author:          "Rowan Beck",
		Excerpt:         "Most bookmarking tools die when the company behind them does. Here is how we built one that keeps working after the servers go away.",
		Summary:         "The post argues that self-hostable readers should treat the article archive as the product and the sync layer as an implementation detail. It walks through the storage format, the offline-first parsing pipeline, and the migration path from three hosted competitors.",
		Tags:            []string{tagTechID, tagLongformID},
		Feed:            feedEngineeringID,
		HeaderImage:     "article-architecture.svg",
		Article:         articleArchitecture,
		ReadTimeSeconds: 12 * 60,
		Archive:         true,
	},
	{
		ID:              "lynxseedlink002",
		User:            userDemoID,
		Title:           "A practical guide to error handling in Go",
		URL:             "https://goweekly.example.com/practical-error-handling",
		AddedDaysAgo:    0.4,
		ArticleDaysAgo:  3,
		ReadDaysAgo:     0.2,
		StarredDaysAgo:  -1,
		Author:          "Priya Raman",
		Excerpt:         "Wrapping, sentinel values, custom types: which one to reach for and when it stops paying off.",
		Summary:         "A tour of Go error handling patterns with benchmarks for each. Concludes that wrapped errors plus errors.Is covers almost every case, and that custom error types are only worth it at package boundaries.",
		Tags:            []string{tagGoID, tagTechID},
		Feed:            feedGoWeeklyID,
		HeaderImage:     "article-go.svg",
		Article:         articleGoErrors,
		ReadTimeSeconds: 9 * 60,
		ReadingProgress: 1.0,
	},
	{
		ID:              "lynxseedlink003",
		User:            userDemoID,
		Title:           "The browser is the only runtime that matters now",
		URL:             "https://frontend-weekly.example.com/browser-runtime",
		AddedDaysAgo:    1.1,
		ArticleDaysAgo:  4,
		ReadDaysAgo:     -1,
		StarredDaysAgo:  -1,
		Author:          "Dana Ilić",
		Excerpt:         "Ten years of frontend churn, and the platform quietly won.",
		Tags:            []string{tagFrontendID},
		SuggestedTags:   []string{tagTechID},
		HeaderImage:     "article-frontend.svg",
		Article:         articleFrontend,
		ReadTimeSeconds: 7 * 60,
		ReadingProgress: 0.35,
	},
	{
		ID:              "lynxseedlink004",
		User:            userDemoID,
		Title:           "Braised short ribs with anchovy and rosemary",
		URL:             "https://recipes.example.com/braised-short-ribs",
		AddedDaysAgo:    1.6,
		ArticleDaysAgo:  40,
		ReadDaysAgo:     1.2,
		StarredDaysAgo:  1.0,
		Author:          "Marta Ellery",
		Excerpt:         "Four hours, one pot, and no browning shortcuts. The anchovies dissolve completely — nobody will know.",
		Tags:            []string{tagRecipesID},
		HeaderImage:     "article-recipe.svg",
		Article:         articleRecipe,
		ReadTimeSeconds: 5 * 60,
	},
	{
		ID:              "lynxseedlink005",
		User:            userDemoID,
		Title:           "Why your incident review keeps producing the same three action items",
		URL:             "https://engineering.example.com/posts/incident-review-loops",
		AddedDaysAgo:    2.2,
		ArticleDaysAgo:  6,
		ReadDaysAgo:     -1,
		StarredDaysAgo:  -1,
		Author:          "Rowan Beck",
		Excerpt:         "Add more alerting. Improve the runbook. Add a test. If that is every review's output, the review is not working.",
		Summary:         "Argues that incident reviews converge on generic action items when the facilitator asks what went wrong instead of what made the wrong thing look reasonable at the time.",
		Tags:            []string{tagTechID},
		Feed:            feedEngineeringID,
		Article:         articleIncidents,
		ReadTimeSeconds: 6 * 60,
		Archive:         true,
	},
	{
		ID:              "lynxseedlink006",
		User:            userDemoID,
		Title:           "Notes on shipping a Go binary that embeds its own frontend",
		URL:             "https://goweekly.example.com/embedded-frontend",
		AddedDaysAgo:    3.1,
		ArticleDaysAgo:  9,
		ReadDaysAgo:     2.9,
		StarredDaysAgo:  -1,
		Author:          "Priya Raman",
		Excerpt:         "embed.FS, a single artifact, and the small pile of things that break in production anyway.",
		Tags:            []string{tagGoID},
		Feed:            feedGoWeeklyID,
		Article:         articleGoErrors,
		ReadTimeSeconds: 4 * 60,
		ReadingProgress: 0.62,
	},
	{
		ID:             "lynxseedlink007",
		User:           userDemoID,
		Title:          "This link has no author, no excerpt and no article body, which is exactly what a failed parse looks like in production",
		URL:            "https://example.com/very/deep/path/that/keeps/going/for/a/while/and/then/some?utm_source=newsletter&utm_campaign=weekly",
		AddedDaysAgo:   3.8,
		ArticleDaysAgo: -1,
		ReadDaysAgo:    -1,
		StarredDaysAgo: -1,
	},
	{
		ID:              "lynxseedlink008",
		User:            userDemoID,
		Title:           "The quiet cost of a 300ms API",
		URL:             "https://frontend-weekly.example.com/quiet-cost-latency",
		AddedDaysAgo:    4.5,
		ArticleDaysAgo:  12,
		ReadDaysAgo:     4.1,
		StarredDaysAgo:  4.0,
		Author:          "Dana Ilić",
		Excerpt:         "Latency budgets are a design constraint, not an ops metric.",
		Summary:         "Traces a checkout redesign where a 300ms median API response forced three separate loading states into the UI, and shows the interaction cost of each one.",
		Tags:            []string{tagFrontendID, tagTechID},
		HeaderImage:     "article-latency.svg",
		Article:         articleFrontend,
		ReadTimeSeconds: 8 * 60,
		ReadingProgress: 1.0,
	},
	{
		ID:              "lynxseedlink009",
		User:            userDemoID,
		Title:           "SQLite is enough",
		URL:             "https://engineering.example.com/posts/sqlite-is-enough",
		AddedDaysAgo:    5.2,
		ArticleDaysAgo:  15,
		ReadDaysAgo:     -1,
		StarredDaysAgo:  5.0,
		Author:          "Sam Okafor",
		Excerpt:         "A single file, WAL mode, and one writer. It scales further than the folklore suggests.",
		Tags:            []string{tagTechID, tagLongformID},
		Feed:            feedEngineeringID,
		Article:         articleArchitecture,
		ReadTimeSeconds: 11 * 60,
	},
	{
		ID:              "lynxseedlink010",
		User:            userDemoID,
		Title:           "Reading is not consuming",
		URL:             "https://example.com/essays/reading-is-not-consuming",
		AddedDaysAgo:    6.0,
		ArticleDaysAgo:  20,
		ReadDaysAgo:     5.5,
		StarredDaysAgo:  -1,
		Author:          "Ines Marchetti",
		Excerpt:         "On the difference between a queue you work through and a library you live in.",
		Tags:            []string{tagLongformID},
		Article:         articleIncidents,
		ReadTimeSeconds: 6 * 60,
	},
	{
		ID:              "lynxseedlink011",
		User:            userDemoID,
		Title:           "Interfaces should be discovered, not designed",
		URL:             "https://goweekly.example.com/discovered-interfaces",
		AddedDaysAgo:    7.1,
		ArticleDaysAgo:  22,
		ReadDaysAgo:     -1,
		StarredDaysAgo:  -1,
		Author:          "Priya Raman",
		Excerpt:         "The smallest interface that makes the test readable is usually the right one.",
		Tags:            []string{tagGoID},
		SuggestedTags:   []string{tagTechID, tagLongformID},
		Feed:            feedGoWeeklyID,
		Article:         articleGoErrors,
		ReadTimeSeconds: 5 * 60,
	},
	{
		ID:              "lynxseedlink012",
		User:            userDemoID,
		Title:           "A weeknight dal that does not need a plan",
		URL:             "https://recipes.example.com/weeknight-dal",
		AddedDaysAgo:    8.3,
		ArticleDaysAgo:  60,
		ReadDaysAgo:     8.0,
		StarredDaysAgo:  -1,
		Author:          "Marta Ellery",
		Excerpt:         "Split red lentils, whatever alliums you have, and a tadka you can do while it simmers.",
		Tags:            []string{tagRecipesID},
		HeaderImage:     "article-recipe.svg",
		Article:         articleRecipe,
		ReadTimeSeconds: 4 * 60,
	},
	{
		ID:              "lynxseedlink013",
		User:            userDemoID,
		Title:           "Migrating 40 million rows without a maintenance window",
		URL:             "https://engineering.example.com/posts/online-migration",
		AddedDaysAgo:    9.4,
		ArticleDaysAgo:  25,
		ReadDaysAgo:     -1,
		StarredDaysAgo:  -1,
		Author:          "Sam Okafor",
		Excerpt:         "Dual writes, a backfill worker, and three weeks of watching two tables disagree.",
		Summary:         "A step by step account of an online schema migration, including the reconciliation job that caught 900 rows the dual-write path missed.",
		Tags:            []string{tagTechID},
		Feed:            feedEngineeringID,
		Article:         articleArchitecture,
		ReadTimeSeconds: 14 * 60,
		ReadingProgress: 0.18,
	},
	{
		ID:              "lynxseedlink014",
		User:            userDemoID,
		Title:           "CSS finally has the layout primitives we asked for",
		URL:             "https://frontend-weekly.example.com/layout-primitives",
		AddedDaysAgo:    10.5,
		ArticleDaysAgo:  30,
		ReadDaysAgo:     10.0,
		StarredDaysAgo:  -1,
		Author:          "Dana Ilić",
		Excerpt:         "Subgrid, container queries, :has(). The workarounds can go.",
		Tags:            []string{tagFrontendID},
		HeaderImage:     "article-frontend.svg",
		Article:         articleFrontend,
		ReadTimeSeconds: 7 * 60,
	},
	{
		ID:              "lynxseedlink015",
		User:            userDemoID,
		Title:           "The on-call handbook nobody reads",
		URL:             "https://engineering.example.com/posts/on-call-handbook",
		AddedDaysAgo:    12.0,
		ArticleDaysAgo:  33,
		ReadDaysAgo:     -1,
		StarredDaysAgo:  -1,
		Author:          "Rowan Beck",
		Excerpt:         "Documentation that is only read at 3am should be written for 3am.",
		Tags:            []string{tagTechID},
		Feed:            feedEngineeringID,
		Article:         articleIncidents,
		ReadTimeSeconds: 6 * 60,
	},
	{
		ID:              "lynxseedlink016",
		User:            userDemoID,
		Title:           "Generics, two years in",
		URL:             "https://goweekly.example.com/generics-two-years-in",
		AddedDaysAgo:    14.2,
		ArticleDaysAgo:  45,
		ReadDaysAgo:     13.0,
		StarredDaysAgo:  13.0,
		Author:          "Priya Raman",
		Excerpt:         "Where type parameters earned their place, and where they made the code worse.",
		Tags:            []string{tagGoID, tagLongformID},
		Feed:            feedGoWeeklyID,
		Article:         articleGoErrors,
		ReadTimeSeconds: 10 * 60,
	},
	{
		ID:              "lynxseedlink017",
		User:            userDemoID,
		Title:           "Sourdough without the discourse",
		URL:             "https://recipes.example.com/sourdough-without-discourse",
		AddedDaysAgo:    16.5,
		ArticleDaysAgo:  70,
		ReadDaysAgo:     -1,
		StarredDaysAgo:  -1,
		Author:          "Marta Ellery",
		Excerpt:         "One loaf, one schedule, no hydration arguments.",
		Tags:            []string{tagRecipesID, tagLongformID},
		Article:         articleRecipe,
		ReadTimeSeconds: 9 * 60,
	},
	{
		ID:              "lynxseedlink018",
		User:            userDemoID,
		Title:           "Everything I know about caching I learned by getting it wrong",
		URL:             "https://engineering.example.com/posts/caching-lessons",
		AddedDaysAgo:    19.0,
		ArticleDaysAgo:  80,
		ReadDaysAgo:     18.0,
		StarredDaysAgo:  -1,
		Author:          "Sam Okafor",
		Excerpt:         "Invalidation is the hard part, but staleness is the expensive part.",
		Summary:         "Six caching incidents, each with the invariant that was violated and the smallest change that would have prevented it.",
		Tags:            []string{tagTechID, tagLongformID},
		Feed:            feedEngineeringID,
		HeaderImage:     "article-architecture.svg",
		Article:         articleArchitecture,
		ReadTimeSeconds: 13 * 60,
		Archive:         true,
	},
	// Everything below here lands on page 2 of the feed (page size is 18).
	{
		ID:              "lynxseedlink019",
		User:            userDemoID,
		Title:           "Type checking at the edge of the system",
		URL:             "https://frontend-weekly.example.com/type-checking-edges",
		AddedDaysAgo:    22.0,
		ArticleDaysAgo:  90,
		ReadDaysAgo:     -1,
		StarredDaysAgo:  -1,
		Author:          "Dana Ilić",
		Excerpt:         "Parse, don't validate — in TypeScript, at the fetch boundary.",
		Tags:            []string{tagFrontendID, tagTechID},
		Article:         articleFrontend,
		ReadTimeSeconds: 8 * 60,
	},
	{
		ID:              "lynxseedlink020",
		User:            userDemoID,
		Title:           "The unreasonable effectiveness of a boring deploy",
		URL:             "https://engineering.example.com/posts/boring-deploys",
		AddedDaysAgo:    25.0,
		ArticleDaysAgo:  100,
		ReadDaysAgo:     24.0,
		StarredDaysAgo:  -1,
		Author:          "Rowan Beck",
		Excerpt:         "Twelve minutes, one button, and a rollback that is just another deploy.",
		Tags:            []string{tagTechID},
		Feed:            feedEngineeringID,
		Article:         articleIncidents,
		ReadTimeSeconds: 5 * 60,
	},
	{
		ID:              "lynxseedlink021",
		User:            userDemoID,
		Title:           "Reading queues as debt",
		URL:             "https://example.com/essays/reading-queues-as-debt",
		AddedDaysAgo:    30.0,
		ArticleDaysAgo:  120,
		ReadDaysAgo:     -1,
		StarredDaysAgo:  -1,
		Author:          "Ines Marchetti",
		Excerpt:         "A saved article is a promise to a future version of yourself who has less time than you do.",
		Tags:            []string{tagLongformID},
		Article:         articleIncidents,
		ReadTimeSeconds: 4 * 60,
	},
	{
		ID:              "lynxseedlink022",
		User:            userDemoID,
		Title:           "Vendoring is back and that is fine",
		URL:             "https://goweekly.example.com/vendoring-is-back",
		AddedDaysAgo:    35.0,
		ArticleDaysAgo:  140,
		ReadDaysAgo:     34.0,
		StarredDaysAgo:  -1,
		Author:          "Priya Raman",
		Excerpt:         "Supply chain anxiety made a fifteen year old workflow fashionable again.",
		Tags:            []string{tagGoID},
		Feed:            feedGoWeeklyID,
		Article:         articleGoErrors,
		ReadTimeSeconds: 6 * 60,
	},
	{
		ID:              "lynxseedlink023",
		User:            userDemoID,
		Title:           "One pot, one pan, one sink full of nothing",
		URL:             "https://recipes.example.com/one-pot",
		AddedDaysAgo:    41.0,
		ArticleDaysAgo:  160,
		ReadDaysAgo:     -1,
		StarredDaysAgo:  40.0,
		Author:          "Marta Ellery",
		Excerpt:         "Cooking for people who do the washing up themselves.",
		Tags:            []string{tagRecipesID},
		HeaderImage:     "article-recipe.svg",
		Article:         articleRecipe,
		ReadTimeSeconds: 3 * 60,
	},
	{
		ID:              "lynxseedlink024",
		User:            userDemoID,
		Title:           "The oldest thing in the library",
		URL:             "https://example.com/essays/oldest-thing-in-the-library",
		AddedDaysAgo:    90.0,
		ArticleDaysAgo:  400,
		ReadDaysAgo:     88.0,
		StarredDaysAgo:  -1,
		Author:          "Ines Marchetti",
		Excerpt:         "Saved three years ago, read once, and still the best thing in here.",
		Tags:            []string{tagLongformID},
		Article:         articleArchitecture,
		ReadTimeSeconds: 15 * 60,
		ReadingProgress: 1.0,
	},

	// Second user's links — these must never appear in the demo user's feed.
	{
		ID:             "lynxseedlink101",
		User:           userSecondID,
		Title:          "Another user's private link",
		URL:            "https://example.org/private-to-second-user",
		AddedDaysAgo:   1.0,
		ArticleDaysAgo: 2,
		ReadDaysAgo:    -1,
		StarredDaysAgo: -1,
		Excerpt:        "If this shows up in the demo user's feed, the collection rules are broken.",
	},
	{
		ID:             "lynxseedlink102",
		User:           userSecondID,
		Title:          "Another user's starred link",
		URL:            "https://example.org/also-private",
		AddedDaysAgo:   2.0,
		ArticleDaysAgo: -1,
		ReadDaysAgo:    -1,
		StarredDaysAgo: 1.0,
	},
}

type seedFeedItem struct {
	ID          string
	User        string
	Feed        string
	Title       string
	Description string
	URL         string
	PubDaysAgo  float64
	SavedAsLink string
}

// seedFeedItems gives the feed items page (12 per page) two pages of content,
// with a few already saved to the library.
var seedFeedItems = []seedFeedItem{
	{ID: "lynxseedfitem01", User: userDemoID, Feed: feedEngineeringID, Title: "Designing a read-it-later service that outlives its hype cycle", Description: "Most bookmarking tools die when the company behind them does.", URL: "https://engineering.example.com/posts/read-it-later-architecture", PubDaysAgo: 1, SavedAsLink: "lynxseedlink001"},
	{ID: "lynxseedfitem02", User: userDemoID, Feed: feedEngineeringID, Title: "Why your incident review keeps producing the same three action items", Description: "Add more alerting. Improve the runbook. Add a test.", URL: "https://engineering.example.com/posts/incident-review-loops", PubDaysAgo: 6, SavedAsLink: "lynxseedlink005"},
	{ID: "lynxseedfitem03", User: userDemoID, Feed: feedEngineeringID, Title: "Postmortem: the cache that filled up on a Sunday", Description: "A 40 hour eviction stall, and the metric that would have caught it in ten minutes.", URL: "https://engineering.example.com/posts/postmortem-cache-sunday", PubDaysAgo: 8},
	{ID: "lynxseedfitem04", User: userDemoID, Feed: feedEngineeringID, Title: "What we learned running Postgres on spot instances", Description: "Cheaper, until it was not.", URL: "https://engineering.example.com/posts/postgres-spot-instances", PubDaysAgo: 11},
	{ID: "lynxseedfitem05", User: userDemoID, Feed: feedEngineeringID, Title: "Our build went from 22 minutes to 4", Description: "Most of it was one badly ordered Dockerfile.", URL: "https://engineering.example.com/posts/faster-builds", PubDaysAgo: 14},
	{ID: "lynxseedfitem06", User: userDemoID, Feed: feedEngineeringID, Title: "Feature flags are a database", Description: "Treat them like one and the outages stop.", URL: "https://engineering.example.com/posts/flags-are-a-database", PubDaysAgo: 17},
	{ID: "lynxseedfitem07", User: userDemoID, Feed: feedEngineeringID, Title: "Migrating 40 million rows without a maintenance window", Description: "Dual writes, a backfill worker, and three weeks of watching two tables disagree.", URL: "https://engineering.example.com/posts/online-migration", PubDaysAgo: 25, SavedAsLink: "lynxseedlink013"},
	{ID: "lynxseedfitem08", User: userDemoID, Feed: feedEngineeringID, Title: "The on-call handbook nobody reads", Description: "Documentation that is only read at 3am should be written for 3am.", URL: "https://engineering.example.com/posts/on-call-handbook", PubDaysAgo: 33, SavedAsLink: "lynxseedlink015"},
	{ID: "lynxseedfitem09", User: userDemoID, Feed: feedEngineeringID, Title: "Tracing without the sampling regret", Description: "Head sampling threw away every trace we later needed.", URL: "https://engineering.example.com/posts/tracing-sampling", PubDaysAgo: 38},
	{ID: "lynxseedfitem10", User: userDemoID, Feed: feedEngineeringID, Title: "A style guide for internal HTTP APIs", Description: "Twelve rules, all of them boring.", URL: "https://engineering.example.com/posts/internal-api-style", PubDaysAgo: 44},
	{ID: "lynxseedfitem11", User: userDemoID, Feed: feedEngineeringID, Title: "Deleting code as a maintenance strategy", Description: "The fastest test suite is the one with fewer tests in it.", URL: "https://engineering.example.com/posts/deleting-code", PubDaysAgo: 52},
	{ID: "lynxseedfitem12", User: userDemoID, Feed: feedEngineeringID, Title: "Everything I know about caching I learned by getting it wrong", Description: "Invalidation is the hard part, but staleness is the expensive part.", URL: "https://engineering.example.com/posts/caching-lessons", PubDaysAgo: 80, SavedAsLink: "lynxseedlink018"},
	{ID: "lynxseedfitem13", User: userDemoID, Feed: feedEngineeringID, Title: "How we version our internal libraries", Description: "One repo, many modules, and a release script nobody is scared of.", URL: "https://engineering.example.com/posts/versioning-internal-libs", PubDaysAgo: 95},
	{ID: "lynxseedfitem14", User: userDemoID, Feed: feedEngineeringID, Title: "The unreasonable effectiveness of a boring deploy", Description: "Twelve minutes, one button, and a rollback that is just another deploy.", URL: "https://engineering.example.com/posts/boring-deploys", PubDaysAgo: 100, SavedAsLink: "lynxseedlink020"},

	{ID: "lynxseedfitem20", User: userDemoID, Feed: feedGoWeeklyID, Title: "A practical guide to error handling in Go", Description: "Wrapping, sentinel values, custom types.", URL: "https://goweekly.example.com/practical-error-handling", PubDaysAgo: 3, SavedAsLink: "lynxseedlink002"},
	{ID: "lynxseedfitem21", User: userDemoID, Feed: feedGoWeeklyID, Title: "Issue 512: profiling, pprof and a faster JSON encoder", Description: "This week: allocation profiles, a new encoder, and two release candidates.", URL: "https://goweekly.example.com/issues/512", PubDaysAgo: 5},
	{ID: "lynxseedfitem22", User: userDemoID, Feed: feedGoWeeklyID, Title: "Issue 511: structured logging everywhere", Description: "log/slog adoption notes from four large codebases.", URL: "https://goweekly.example.com/issues/511", PubDaysAgo: 12},
	{ID: "lynxseedfitem23", User: userDemoID, Feed: feedGoWeeklyID, Title: "Generics, two years in", Description: "Where type parameters earned their place.", URL: "https://goweekly.example.com/generics-two-years-in", PubDaysAgo: 45, SavedAsLink: "lynxseedlink016"},
}

type seedCookie struct {
	ID     string
	User   string
	Name   string
	Value  string
	Domain string
}

var seedCookies = []seedCookie{
	{ID: "lynxseedcook001", User: userDemoID, Name: "paywall_session", Value: "seed-value-not-a-real-session", Domain: "engineering.example.com"},
	{ID: "lynxseedcook002", User: userDemoID, Name: "member_token", Value: "seed-value-also-not-real", Domain: "frontend-weekly.example.com"},
}

type seedAPIKey struct {
	ID   string
	User string
	Name string
	Key  string
	// ExpiresDaysAgo is negative for a key that has not expired yet.
	ExpiresDaysAgo  float64
	LastUsedDaysAgo float64
}

var seedAPIKeys = []seedAPIKey{
	{ID: "lynxseedapik001", User: userDemoID, Name: "iOS shortcut", Key: "lynx_seed_key_valid_0000000000001", ExpiresDaysAgo: -150, LastUsedDaysAgo: 0.5},
	{ID: "lynxseedapik002", User: userDemoID, Name: "Old laptop (expired)", Key: "lynx_seed_key_expired_000000001", ExpiresDaysAgo: 10, LastUsedDaysAgo: 200},
}

// hostnameOf mirrors what the URL parser stores on a real link.
func hostnameOf(rawURL string) string {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return ""
	}
	return parsed.Hostname()
}

func readTimeDisplay(seconds int) string {
	if seconds <= 0 {
		return ""
	}
	return fmt.Sprintf("%d min", int(math.Round(float64(seconds)/60)))
}

var tagPattern = regexp.MustCompile(`<[^>]*>`)
var whitespacePattern = regexp.MustCompile(`\s+`)

// stripTags produces the plain text copy of an article the way the parser does,
// which is what full text search runs against.
func stripTags(articleHTML string) string {
	if articleHTML == "" {
		return ""
	}
	text := tagPattern.ReplaceAllString(articleHTML, " ")
	return strings.TrimSpace(whitespacePattern.ReplaceAllString(html.UnescapeString(text), " "))
}

// archiveHTML builds a stand-in for a SingleFile archive: a complete, self
// contained HTML document with no external references.
func archiveHTML(title, sourceURL, articleBody string) string {
	if articleBody == "" {
		articleBody = "<p>This archive was generated by the Lynx seed script.</p>"
	}
	return fmt.Sprintf(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>%s</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; max-width: 42rem; margin: 3rem auto; padding: 0 1rem; line-height: 1.6; color: #1a1a1a; }
  .seed-archive-banner { background: #fff4d6; border: 1px solid #e3c56a; border-radius: 6px; padding: 0.75rem 1rem; font-family: system-ui, sans-serif; font-size: 0.85rem; margin-bottom: 2rem; }
  img { max-width: 100%%; height: auto; }
  pre { background: #f4f4f5; padding: 1rem; overflow-x: auto; }
</style>
</head>
<body>
<div class="seed-archive-banner">Seeded offline archive — original: %s</div>
<h1>%s</h1>
%s
</body>
</html>`, html.EscapeString(title), html.EscapeString(sourceURL), html.EscapeString(title), articleBody)
}

// seedImages are simple, dependency free SVGs used for header images. They are
// served by the backend out of pb_public, so screenshots never depend on the
// network being reachable.
var seedImages = map[string][2]string{
	"article-architecture.svg": {"#1e3a5f", "#4a90d9"},
	"article-go.svg":           {"#00566b", "#00add8"},
	"article-frontend.svg":     {"#4a1e5f", "#b06fd9"},
	"article-recipe.svg":       {"#5f3a1e", "#d99b4a"},
	"article-latency.svg":      {"#1e5f3a", "#4ad98b"},
	"feed-engineering.svg":     {"#333333", "#888888"},
}

func writeSeedImages(publicDir string) error {
	dir := filepath.Join(publicDir, seedImageDir)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}

	for name, colors := range seedImages {
		svg := fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%%" stop-color="%s"/>
      <stop offset="100%%" stop-color="%s"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <g fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="3">
    <circle cx="960" cy="160" r="90"/>
    <circle cx="960" cy="160" r="150"/>
    <circle cx="960" cy="160" r="210"/>
    <path d="M0 500 L300 380 L600 470 L900 330 L1200 420"/>
    <path d="M0 560 L300 440 L600 530 L900 390 L1200 480"/>
  </g>
</svg>
`, colors[0], colors[1])

		if err := os.WriteFile(filepath.Join(dir, name), []byte(svg), 0o644); err != nil {
			return err
		}
	}
	return nil
}

// figurePattern matches the placeholder figures in the seeded article bodies so
// they can be removed when a link has no image.
var figurePattern = regexp.MustCompile(`(?s)<figure class="seed-figure">.*?</figure>`)
