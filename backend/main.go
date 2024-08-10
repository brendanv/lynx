package main

import (
		"log"
		"strings"
		"os"

		"github.com/pocketbase/pocketbase"
		"github.com/pocketbase/pocketbase/plugins/migratecmd"
)
import _ "main/migrations"

func main() {
		app := pocketbase.New()

		// Enable the migration command, but only enable 
		// Automigrate in dev (if go-run is used)
		isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())
		migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
				Automigrate: isGoRun,
		})

		if err := app.Start(); err != nil {
				log.Fatal(err)
		}
}
