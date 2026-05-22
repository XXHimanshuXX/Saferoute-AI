# SafeRoute AI — Sovereign GitHub Publisher & Deployer
# Run this script in PowerShell to login and publish your repository instantly!

Clear-Host
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "        SafeRoute AI — Sovereign GitHub Publisher" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check if Git is installed
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git is not installed or not found on your system PATH." -ForegroundColor Red
    Write-Host "Please install Git and rerun this script." -ForegroundColor Yellow
    Exit
}

# 2. Check if GitHub CLI (gh) is installed
if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI (gh) is not installed on your system." -ForegroundColor Red
    Write-Host "Please install it from https://cli.github.com/ to automate publishing." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Alternative (Manual Steps Without gh CLI):" -ForegroundColor Cyan
    Write-Host "1. Create a public repository named 'Saferoute-AI' at https://github.com/new" -ForegroundColor White
    Write-Host "2. Run these commands in your terminal:" -ForegroundColor White
    Write-Host "   git remote add origin https://github.com/<your-username>/Saferoute-AI.git" -ForegroundColor Gray
    Write-Host "   git branch -M master" -ForegroundColor Gray
    Write-Host "   git push -u origin master" -ForegroundColor Gray
    Exit
}

# 3. Check GitHub CLI Authentication Status
Write-Host "🔑 Checking GitHub authentication status..." -ForegroundColor Cyan
$status = gh auth status 2>&1 | Out-String

if ($status -like "*not logged into any GitHub hosts*") {
    Write-Host "⚠️ You are not logged into any GitHub accounts." -ForegroundColor Yellow
    Write-Host "Initializing interactive browser-based login. Follow the terminal prompts..." -ForegroundColor Cyan
    Write-Host ""
    
    # Trigger interactive login
    gh auth login
    
    # Re-verify authentication status
    $status = gh auth status 2>&1 | Out-String
    if ($status -like "*not logged into any GitHub hosts*") {
        Write-Host "❌ GitHub login was not completed or failed." -ForegroundColor Red
        Exit
    }
}

Write-Host "✅ Authenticated successfully!" -ForegroundColor Green
Write-Host ""

# 4. Create and push repository to GitHub
Write-Host "🚀 Spawning public GitHub repository 'Saferoute-AI'..." -ForegroundColor Cyan
Write-Host "📦 Pushing all local commits and files..." -ForegroundColor Cyan
Write-Host ""

# We create the public repository from our active source and push it
gh repo create "Saferoute-AI" --source=. --push --public

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "🎉 Success! SafeRoute AI is now live in public mode on GitHub!" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host ""
