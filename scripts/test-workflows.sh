#!/bin/bash

# Local GitHub Actions Testing Script
# Uses 'act' to run workflows locally for testing

set -e

echo "🧪 Local GitHub Actions Testing"
echo "================================"

# Create tmp directory if it doesn't exist
mkdir -p tmp

# Log file for full output
LOG_FILE="tmp/gh_workflow.log"
echo "📝 Full logs will be saved to: $LOG_FILE"

# Clear previous log
> "$LOG_FILE"

# Check if act is installed
if ! command -v act &> /dev/null; then
    echo "❌ 'act' is not installed. Install it with: brew install act"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Function to filter act output and show only useful information
filter_output() {
    local job_name="$1"
    
    # Stream processing to show useful info in real-time
    while IFS= read -r line; do
        # Log everything to file
        echo "$line" >> "$LOG_FILE"
        
        # Show only useful information to console
        if [[ "$line" =~ ^\[.*\].*⭐.*Run ]]; then
            # Show step starts
            echo "  $(echo "$line" | sed -E 's/.*⭐[[:space:]]*Run[[:space:]]*/▶️  /')"
        elif [[ "$line" =~ ^\[.*\].*✅.*Success ]]; then
            # Show successful steps
            echo "  $(echo "$line" | sed -E 's/.*✅[[:space:]]*Success[[:space:]]*-[[:space:]]*/✅  /' | sed -E 's/\[[0-9.]+s\]//')"
        elif [[ "$line" =~ ^\[.*\].*❌.*Failure ]]; then
            # Show failed steps
            echo "  $(echo "$line" | sed -E 's/.*❌[[:space:]]*Failure[[:space:]]*-[[:space:]]*/❌  /' | sed -E 's/\[[0-9.]+s\]//')"
        elif [[ "$line" =~ ^[[:space:]]*\|[[:space:]]*.*npm.*warn ]]; then
            # Show npm warnings (but not all npm output)
            echo "  ⚠️  $(echo "$line" | sed 's/^[[:space:]]*|[[:space:]]*//')"
        elif [[ "$line" =~ ^[[:space:]]*\|.*found.*vulnerabilities ]]; then
            # Show vulnerability summary
            echo "  🔒  $(echo "$line" | sed 's/^[[:space:]]*|[[:space:]]*//')"
        elif [[ "$line" =~ exitcode.*failure ]]; then
            # Show exit code failures
            echo "  💥  Exit code failure detected"
        elif [[ "$line" =~ Job.*failed ]]; then
            # Show job failures
            echo "  🚨  $(echo "$line" | sed -E 's/.*🏁[[:space:]]*//')"
        elif [[ "$line" =~ Error: ]]; then
            # Show errors
            echo "  🚨  $(echo "$line")"
        fi
    done
}

# Function to run a specific job
run_job() {
    local job_name="$1"
    local workflow_file="$2"
    local event="$3"
    
    echo ""
    echo "🚀 Running job: $job_name"
    echo "📄 Workflow: $workflow_file"
    echo "🎯 Event: $event"
    echo "---"
    
    # Add job header to log file
    echo "" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    echo "JOB: $job_name ($workflow_file - $event)" >> "$LOG_FILE"
    echo "STARTED: $(date)" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    
    # Use linux/amd64 for M-series Macs, pipe through filter
    if act "$event" \
        --container-architecture linux/amd64 \
        --job "$job_name" \
        --workflows ".github/workflows/$workflow_file" 2>&1 | filter_output "$job_name"; then
        echo "  ✅  Job '$job_name' completed successfully"
    else
        echo "  ❌  Job '$job_name' failed"
        echo "  📄  Check full logs in: $LOG_FILE"
        return 1
    fi
}

# Function to run all CI jobs
run_ci() {
    echo "🔄 Running all CI jobs..."
    
    # Run jobs in dependency order
    echo "1️⃣ Running unit tests..."
    run_job "test" "ci.yml" "push"
    
    echo "2️⃣ Running build..."
    run_job "build" "ci.yml" "push"
    
    echo "3️⃣ Running integration tests..."
    run_job "integration-test" "ci.yml" "push"
}

# Function to run just unit tests (fastest)
run_tests() {
    echo "🧪 Running unit tests only..."
    run_job "test" "ci.yml" "push"
}

# Function to run just the build
run_build() {
    echo "🏗️  Running build only..."
    run_job "build" "ci.yml" "push"
}

# Function to show help
show_help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  ci      Run all CI jobs (test, build, integration-test)"
    echo "  test    Run unit tests only"
    echo "  build   Run build only"
    echo "  list    List all available workflows and jobs"
    echo "  logs    Show the last workflow log file"
    echo "  help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 test          # Quick test run"
    echo "  $0 ci            # Full CI pipeline" 
    echo "  $0 logs          # View full logs from last run"
    echo "  $0 list          # See all available jobs"
    echo ""
    echo "Note: Full verbose logs are always saved to tmp/gh_workflow.log"
}

# Parse command line arguments
case "${1:-help}" in
    "ci")
        run_ci
        ;;
    "test")
        run_tests
        ;;
    "build")
        run_build
        ;;
    "list")
        echo "📋 Available workflows and jobs:"
        act --list
        ;;
    "logs")
        if [[ -f "$LOG_FILE" ]]; then
            echo "📄 Showing last workflow log:"
            echo "================================"
            cat "$LOG_FILE"
        else
            echo "❌ No log file found. Run a workflow first."
        fi
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        show_help
        exit 1
        ;;
esac

echo ""
if [[ "${1}" != "logs" && "${1}" != "list" && "${1}" != "help" && "${1}" != "--help" && "${1}" != "-h" ]]; then
    echo "✅ Local testing completed!"
    echo "📄 Full logs saved to: $LOG_FILE"
fi
