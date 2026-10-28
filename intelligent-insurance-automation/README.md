# Intelligent Insurance Automation

A simple base project with three modules:
1. Premium calculator (calcPremium in app.js)
2. Claim triage and fraud scoring (assessClaim in app.js)
3. Claims dashboard (renderDash in app.js)

## Run
Open index.html in any web browser. No installation needed.

## Files
- index.html : page structure
- style.css  : styling (light and dark themes)
- app.js     : business logic

## Customize
- Edit BASE_RATE in app.js to change premium rates.
- Edit the if-conditions in assessClaim() to change fraud rules and thresholds.

Note: claims are stored in memory only and reset on page refresh.
