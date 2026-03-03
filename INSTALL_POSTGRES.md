# Installing PostgreSQL on macOS

## Quick Install (Homebrew)

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Add to PATH (add this to your ~/.zshrc)
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Create database
createdb spoiler_alert
```

## Alternative: Use Postgres.app

1. Download from: https://postgresapp.com/
2. Install and open the app
3. Click "Initialize" to create a new server
4. The `psql` command will be available in your terminal

## Verify Installation

```bash
psql --version
createdb --version
```

## Create Database

```bash
createdb spoiler_alert
```
