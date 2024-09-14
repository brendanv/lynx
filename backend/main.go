package main

import (
	"log"
	"os"
	"strings"

	"main/lynx"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"

	_ "main/migrations"
)

func main() {
	app := pocketbase.New()

	// Enable the migration command, but only enable
	// Automigrate in dev (if go-run is used)
	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())
	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		Automigrate: isGoRun,
	})

	lynx.InitializePocketbase(app)

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
