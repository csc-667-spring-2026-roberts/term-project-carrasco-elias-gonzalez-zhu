# Pull Request Guide

**CSC 667 Term Project**

This guide outlines the process for creating, validating, and merging a Pull Request (PR).

#### 📷 Visual Reference

Please refer to:

**[docs/guides/pullrequest_screenshots.pdf](pullrequest_screenshots.pdf)**

This file provides a visual walkthrough of the pull request process.

⚠️ Note:

- The screenshots are from a different project
- Branch names and GitHub Actions checks may look different
- The overall PR workflow and steps are the same

---

## 🧠 Prepare Your Changes

### 1. Commit and Push Your Changes

Stage, commit, and push your work:

```bash
git add .
git commit -m "[<milestone>] <short description>"
git push origin <your-branch>
```

#### ⚠️ Local Validation Before Opening a Pull Request

Before opening a PR, run the validation script(s) defined for your branch (if applicable).

👉 If a PR validation script exists for your branch, run it and ensure it passes before creating a PR.  
👉 These checks mirror the validations that will run later in GitHub Actions (CI).

Refer to your milestone’s Work Split document for the appropriate script(s) to run.

### 4. Open a Pull Request

You can open a PR in two ways:

#### Option A (Recommended — Quick Method)

After pushing your branch, GitHub may show a banner at the top of the repository with a **"Compare & pull request"** button.

1. Click **"Compare & pull request"**
2. Verify:
   - **base branch** = `<milestone-branch>`
   - **compare branch** = `<your-branch>`

#### Option B (Manual Method)

1. Go to the GitHub repository
2. Click on the **"Pull requests"** tab
3. Click **"New pull request"**

### 5. Select the Correct Branches

- **Base branch** = `<milestone-branch>`
- **Compare branch** = `<your-branch>`

👉 The **compare branch** is the branch being **merged into** the **base branch**  
👉 **`<milestone-branch>` ← `<your-branch>`**

**⚠️ Important:**

- GitHub may **default to incorrect branches** (often **`main`**)
- **You MUST verify both the base and compare branches** before creating the PR

### 8. Add Title and Description

On the PR page:

#### Example PR Title Format

```txt
[<milestone>] <short description>
```

#### Example PR Description Template

```md
## Changes

- [describe what you implemented]

## Testing

- [how you tested it]

## Checklist

- [x] build passes
- [x] lint/format checks pass
- [x] no breaking changes
```

### 9. Submit the PR

Click **"Create pull request"** to submit.

---

## 🔁 GitHub Actions (CI Checks)

After the PR is created, GitHub will automatically run checks defined for the milestone.

These checks typically include:

```bash
npm ci
npm run build
npm run lint
npm run format:check
# additional validation scripts (if applicable)
```

These checks ensure:

- the project builds correctly in a clean environment
- linting and formatting pass
- required validations for the milestone are satisfied

### If CI fails:

- open the PR
- review the failed checks
- fix issues locally
- push again

The checks will automatically re-run after pushing.

👉 Local validation scripts (if available) are designed to mirror these checks.

### 🚫 Merge Rule

**DO NOT merge a PR unless:**

- All GitHub Actions (CI) checks have passed
- There are no merge conflicts
- The PR follows file ownership and contract rules

Merging without passing checks may **break the project for the team.**

---

## 🔀 Merging the Pull Request

After your PR passes all checks:

- ✅ All CI checks passed
- ✅ No merge conflicts

Follow these steps to merge:

### 1. Merge pull request

On the PR page, click:

- **"Merge pull request"**

### 2. Review Commit Message

You will see a commit message box.

- You can **leave it as the default (recommended)**
- Optionally, update it to better describe the changes

### 3. Confirm Merge

Click: **"Confirm merge"**

### 4. Do NOT Delete the Branch

After merging, GitHub may show a **"Delete branch"** button.

⚠️ Do NOT click this

Branch cleanup will be managed centrally.

This ensures:

- consistency across the team
- proper review and grading
- controlled repository management

---

## 🎯 Rules

- Do NOT modify files you do not own
- Do NOT modify locked contracts without team agreement
- Follow the structure and requirements defined in the Work Split
- Ensure your work passes required local validation before opening a PR

---

## ✏️ Summary

1. Commit + push you changes
2. Run local validation (if applicable)
3. Open PR → `<milestone-branch>`
4. Pass GitHub Actions (CI) checks
5. Merge
