// Command seed populates a PocketBase data directory with deterministic test
// data for Lynx: users, tags, feeds, feed items, links, archives, cookies and
// API keys.
//
// It talks to the database directly through the PocketBase library rather than
// over HTTP, so it does not need a running server, and none of the app hooks
// (summarization, tagging, SingleFile archiving) fire — no outbound network
// calls are made.
//
// Usage:
//
//	cd backend
//	go run ./cmd/seed --reset
//	go run main.go serve
//
// Every record uses a fixed ID so URLs stay stable between runs, which makes
// the data usable for screenshot and browser tests. The IDs are also written to
// a manifest file (see --manifest) for test harnesses to consume.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"

	_ "main/migrations"
)

const (
	// Credentials are intentionally weak and public: this data is only ever
	// meant for local development and automated browser tests.
	superuserEmail    = "admin@lynx.test"
	superuserPassword = "lynxtestadmin"
	demoPassword      = "lynxtestuser"
)

type config struct {
	dataDir    string
	publicDir  string
	baseURL    string
	manifest   string
	reset      bool
	quiet      bool
	skipImages bool
}

func main() {
	var cfg config
	flag.StringVar(&cfg.dataDir, "dir", "./pb_data", "PocketBase data directory to seed")
	flag.StringVar(&cfg.publicDir, "public-dir", "./pb_public", "directory served as static files, used for placeholder images")
	flag.StringVar(&cfg.baseURL, "base-url", "http://127.0.0.1:8090", "base URL of the running backend, used to build image URLs")
	flag.StringVar(&cfg.manifest, "manifest", "", "path to write the JSON manifest of seeded IDs (default <dir>/seed-manifest.json)")
	flag.BoolVar(&cfg.reset, "reset", false, "delete the data directory before seeding")
	flag.BoolVar(&cfg.quiet, "quiet", false, "only print errors")
	flag.BoolVar(&cfg.skipImages, "skip-images", false, "do not write placeholder images and leave header_image_url empty")
	flag.Parse()

	if cfg.manifest == "" {
		cfg.manifest = filepath.Join(cfg.dataDir, "seed-manifest.json")
	}

	if err := run(cfg); err != nil {
		log.Fatalf("seed failed: %v", err)
	}
}

func run(cfg config) error {
	if cfg.reset {
		if err := os.RemoveAll(cfg.dataDir); err != nil {
			return fmt.Errorf("reset data dir: %w", err)
		}
		if err := os.RemoveAll(filepath.Join(cfg.publicDir, seedImageDir)); err != nil {
			return fmt.Errorf("reset image dir: %w", err)
		}
	}

	app := pocketbase.NewWithConfig(pocketbase.Config{DefaultDataDir: cfg.dataDir})
	if err := app.Bootstrap(); err != nil {
		return fmt.Errorf("bootstrap: %w", err)
	}
	defer app.ResetBootstrapState() //nolint:errcheck // best effort cleanup

	if err := app.RunAllMigrations(); err != nil {
		return fmt.Errorf("run migrations: %w", err)
	}

	s := &seeder{app: app, cfg: cfg, now: time.Now().UTC()}
	if err := s.seed(); err != nil {
		return err
	}

	if err := s.writeManifest(); err != nil {
		return fmt.Errorf("write manifest: %w", err)
	}

	if !cfg.quiet {
		s.printSummary()
	}
	return nil
}

type seeder struct {
	app *pocketbase.PocketBase
	cfg config
	now time.Time

	manifest manifest
}

// manifest is the machine readable description of what was seeded. Browser
// tests read it instead of hardcoding IDs.
type manifest struct {
	BaseURL string `json:"baseUrl"`
	Admin   struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	} `json:"admin"`
	Users     []manifestUser  `json:"users"`
	Tags      []manifestNamed `json:"tags"`
	Feeds     []manifestNamed `json:"feeds"`
	Links     []manifestLink  `json:"links"`
	APIKeys   []manifestKey   `json:"apiKeys"`
	CreatedAt string          `json:"createdAt"`
}

type manifestUser struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Primary  bool   `json:"primary"`
}

type manifestNamed struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	User string `json:"user"`
}

type manifestLink struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	User       string `json:"user"`
	Read       bool   `json:"read"`
	Starred    bool   `json:"starred"`
	HasArchive bool   `json:"hasArchive"`
	HasArticle bool   `json:"hasArticle"`
}

type manifestKey struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Key     string `json:"key"`
	User    string `json:"user"`
	Expired bool   `json:"expired"`
}

func (s *seeder) seed() error {
	if err := s.seedSuperuser(); err != nil {
		return fmt.Errorf("superuser: %w", err)
	}
	if err := s.seedUsers(); err != nil {
		return fmt.Errorf("users: %w", err)
	}
	if err := s.seedSettings(); err != nil {
		return fmt.Errorf("user settings: %w", err)
	}
	if err := s.seedTags(); err != nil {
		return fmt.Errorf("tags: %w", err)
	}
	if err := s.seedFeeds(); err != nil {
		return fmt.Errorf("feeds: %w", err)
	}
	if !s.cfg.skipImages {
		if err := writeSeedImages(s.cfg.publicDir); err != nil {
			return fmt.Errorf("images: %w", err)
		}
	}
	if err := s.seedLinks(); err != nil {
		return fmt.Errorf("links: %w", err)
	}
	if err := s.seedFeedItems(); err != nil {
		return fmt.Errorf("feed items: %w", err)
	}
	if err := s.seedCookies(); err != nil {
		return fmt.Errorf("cookies: %w", err)
	}
	if err := s.seedAPIKeys(); err != nil {
		return fmt.Errorf("api keys: %w", err)
	}
	return nil
}

// upsert loads the record with the given ID (so re-running the seeder updates
// in place instead of failing on unique constraints) or creates a new one.
func (s *seeder) upsert(collectionName, id string, fill func(r *core.Record) error) (*core.Record, error) {
	collection, err := s.app.FindCollectionByNameOrId(collectionName)
	if err != nil {
		return nil, err
	}

	record, err := s.app.FindRecordById(collectionName, id)
	if err != nil {
		record = core.NewRecord(collection)
		record.Id = id
	}

	if err := fill(record); err != nil {
		return nil, err
	}

	if err := s.app.Save(record); err != nil {
		return nil, fmt.Errorf("save %s/%s: %w", collectionName, id, err)
	}
	return record, nil
}

func (s *seeder) seedSuperuser() error {
	collection, err := s.app.FindCollectionByNameOrId(core.CollectionNameSuperusers)
	if err != nil {
		return err
	}

	record, err := s.app.FindAuthRecordByEmail(collection, superuserEmail)
	if err != nil {
		record = core.NewRecord(collection)
	}
	record.SetEmail(superuserEmail)
	record.SetPassword(superuserPassword)

	if err := s.app.Save(record); err != nil {
		return err
	}

	s.manifest.Admin.Email = superuserEmail
	s.manifest.Admin.Password = superuserPassword
	return nil
}

func (s *seeder) seedUsers() error {
	for _, u := range seedUsers {
		_, err := s.upsert("users", u.ID, func(r *core.Record) error {
			r.SetEmail(u.Email)
			r.SetEmailVisibility(true)
			r.SetVerified(true)
			r.SetPassword(demoPassword)
			r.Set("username", u.Username)
			r.Set("name", u.Name)
			return nil
		})
		if err != nil {
			return err
		}

		s.manifest.Users = append(s.manifest.Users, manifestUser{
			ID:       u.ID,
			Username: u.Username,
			Email:    u.Email,
			Password: demoPassword,
			Primary:  u.Primary,
		})
	}
	return nil
}

func (s *seeder) seedSettings() error {
	for _, u := range seedUsers {
		if u.SettingsID == "" {
			continue
		}
		_, err := s.upsert("user_settings", u.SettingsID, func(r *core.Record) error {
			r.Set("user", u.ID)
			r.Set("automatically_summarize_new_links", u.AutoSummarize)
			r.Set("automatically_suggest_tags_for_new_links", u.AutoTag)
			r.Set("summarize_model", "anthropic/claude-3.5-haiku")
			r.Set("classification_model", "anthropic/claude-3.5-haiku")
			// Deliberately blank: seeded data must never trigger real LLM calls.
			r.Set("openrouter_api_key", "")
			return nil
		})
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *seeder) seedTags() error {
	for _, t := range seedTags {
		if _, err := s.upsert("tags", t.ID, func(r *core.Record) error {
			r.Set("user", t.User)
			r.Set("name", t.Name)
			r.Set("slug", t.Slug)
			return nil
		}); err != nil {
			return err
		}
		s.manifest.Tags = append(s.manifest.Tags, manifestNamed{ID: t.ID, Name: t.Name, User: t.User})
	}
	return nil
}

func (s *seeder) seedFeeds() error {
	for _, f := range seedFeeds {
		if _, err := s.upsert("feeds", f.ID, func(r *core.Record) error {
			r.Set("user", f.User)
			r.Set("name", f.Name)
			r.Set("feed_url", f.FeedURL)
			r.Set("description", f.Description)
			r.Set("auto_add_feed_items_to_library", f.AutoAdd)
			if f.LastFetchedDaysAgo >= 0 {
				r.Set("last_fetched_at", s.daysAgo(f.LastFetchedDaysAgo))
			} else {
				r.Set("last_fetched_at", "")
			}
			if f.ImageFile != "" && !s.cfg.skipImages {
				r.Set("image_url", s.imageURL(f.ImageFile))
			} else {
				r.Set("image_url", "")
			}
			return nil
		}); err != nil {
			return err
		}
		s.manifest.Feeds = append(s.manifest.Feeds, manifestNamed{ID: f.ID, Name: f.Name, User: f.User})
	}
	return nil
}

func (s *seeder) seedLinks() error {
	for _, l := range seedLinks {
		link := l // capture for the closure
		if _, err := s.upsert("links", link.ID, func(r *core.Record) error {
			r.Set("user", link.User)
			r.Set("added_to_library", s.daysAgo(link.AddedDaysAgo))
			r.Set("original_url", link.URL)
			r.Set("cleaned_url", link.URL)
			r.Set("hostname", hostnameOf(link.URL))
			r.Set("title", link.Title)
			r.Set("excerpt", link.Excerpt)
			r.Set("author", link.Author)
			r.Set("summary", link.Summary)
			r.Set("tags", link.Tags)
			r.Set("suggested_tags", link.SuggestedTags)
			r.Set("reading_progress", link.ReadingProgress)

			if link.ArticleDaysAgo >= 0 {
				r.Set("article_date", s.daysAgo(link.ArticleDaysAgo))
			} else {
				r.Set("article_date", "")
			}

			if link.ReadDaysAgo >= 0 {
				r.Set("last_viewed_at", s.daysAgo(link.ReadDaysAgo))
			} else {
				r.Set("last_viewed_at", "")
			}

			if link.StarredDaysAgo >= 0 {
				r.Set("starred_at", s.daysAgo(link.StarredDaysAgo))
			} else {
				r.Set("starred_at", "")
			}

			if link.Feed != "" {
				r.Set("created_from_feed", link.Feed)
			} else {
				r.Set("created_from_feed", "")
			}

			if link.HeaderImage != "" && !s.cfg.skipImages {
				r.Set("header_image_url", s.imageURL(link.HeaderImage))
			} else {
				r.Set("header_image_url", "")
			}

			if link.SuggestedTags != nil {
				r.Set("tags_suggested_at", s.daysAgo(link.AddedDaysAgo))
			}

			article := ""
			if link.Article != "" {
				article = s.renderArticle(link)
				r.Set("read_time_seconds", link.ReadTimeSeconds)
				r.Set("read_time_display", readTimeDisplay(link.ReadTimeSeconds))
			}
			r.Set("article_html", article)
			r.Set("raw_text_content", stripTags(article))

			if link.Archive {
				// Only re-upload the archive when it is missing, otherwise
				// every run leaves another orphaned file behind.
				if r.GetString("archive") == "" {
					file, err := filesystem.NewFileFromBytes([]byte(archiveHTML(link.Title, link.URL, article)), "archive.html")
					if err != nil {
						return err
					}
					file.Name = "archive.html"
					r.Set("archive", file)
				}
			} else {
				r.Set("archive", "")
			}

			return nil
		}); err != nil {
			return err
		}

		s.manifest.Links = append(s.manifest.Links, manifestLink{
			ID:         link.ID,
			Title:      link.Title,
			User:       link.User,
			Read:       link.ReadDaysAgo >= 0,
			Starred:    link.StarredDaysAgo >= 0,
			HasArchive: link.Archive,
			HasArticle: link.Article != "",
		})
	}
	return nil
}

func (s *seeder) seedFeedItems() error {
	for _, fi := range seedFeedItems {
		item := fi
		if _, err := s.upsert("feed_items", item.ID, func(r *core.Record) error {
			r.Set("user", item.User)
			r.Set("feed", item.Feed)
			r.Set("title", item.Title)
			r.Set("description", item.Description)
			r.Set("url", item.URL)
			r.Set("guid", item.URL)
			r.Set("pub_date", s.daysAgo(item.PubDaysAgo))
			if item.SavedAsLink != "" {
				r.Set("saved_as_link", item.SavedAsLink)
			} else {
				r.Set("saved_as_link", "")
			}
			return nil
		}); err != nil {
			return err
		}
	}
	return nil
}

func (s *seeder) seedCookies() error {
	for _, c := range seedCookies {
		if _, err := s.upsert("user_cookies", c.ID, func(r *core.Record) error {
			r.Set("user", c.User)
			r.Set("name", c.Name)
			r.Set("value", c.Value)
			r.Set("domain", c.Domain)
			return nil
		}); err != nil {
			return err
		}
	}
	return nil
}

func (s *seeder) seedAPIKeys() error {
	for _, k := range seedAPIKeys {
		key := k
		if _, err := s.upsert("api_keys", key.ID, func(r *core.Record) error {
			r.Set("user", key.User)
			r.Set("name", key.Name)
			r.Set("api_key", key.Key)
			r.Set("expires_at", s.daysAgo(key.ExpiresDaysAgo))
			if key.LastUsedDaysAgo >= 0 {
				r.Set("last_used_at", s.daysAgo(key.LastUsedDaysAgo))
			} else {
				r.Set("last_used_at", "")
			}
			return nil
		}); err != nil {
			return err
		}
		s.manifest.APIKeys = append(s.manifest.APIKeys, manifestKey{
			ID:      key.ID,
			Name:    key.Name,
			Key:     key.Key,
			User:    key.User,
			Expired: key.ExpiresDaysAgo > 0,
		})
	}
	return nil
}

// daysAgo renders a timestamp n days in the past in the format PocketBase
// stores dates in. Negative values are in the future.
func (s *seeder) daysAgo(n float64) string {
	return s.now.Add(-time.Duration(n * float64(24*time.Hour))).Format("2006-01-02 15:04:05.000Z")
}

func (s *seeder) imageURL(file string) string {
	return strings.TrimSuffix(s.cfg.baseURL, "/") + "/" + seedImageDir + "/" + file
}

// renderArticle inlines the placeholder image URL into the stored article HTML
// so article bodies stay readable in the fixtures file.
func (s *seeder) renderArticle(l seedLink) string {
	if l.HeaderImage == "" || s.cfg.skipImages {
		// No image to point at, so drop the figures entirely rather than
		// leaving an <img> with an empty src behind.
		return figurePattern.ReplaceAllString(l.Article, "")
	}
	return strings.ReplaceAll(l.Article, "{{IMAGE}}", s.imageURL(l.HeaderImage))
}

func (s *seeder) writeManifest() error {
	s.manifest.BaseURL = s.cfg.baseURL
	s.manifest.CreatedAt = s.now.Format(time.RFC3339)

	if dir := filepath.Dir(s.cfg.manifest); dir != "" {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return err
		}
	}

	data, err := json.MarshalIndent(s.manifest, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.cfg.manifest, append(data, '\n'), 0o644)
}

func (s *seeder) printSummary() {
	fmt.Printf("Seeded %s\n", s.cfg.dataDir)
	fmt.Printf("  superuser   %s / %s\n", superuserEmail, superuserPassword)
	for _, u := range s.manifest.Users {
		suffix := ""
		if u.Primary {
			suffix = "  (primary test user)"
		}
		fmt.Printf("  user        %s / %s%s\n", u.Username, u.Password, suffix)
	}
	fmt.Printf("  %d links, %d tags, %d feeds, %d feed items, %d api keys\n",
		len(s.manifest.Links), len(s.manifest.Tags), len(s.manifest.Feeds), len(seedFeedItems), len(s.manifest.APIKeys))
	fmt.Printf("  manifest    %s\n", s.cfg.manifest)
}
