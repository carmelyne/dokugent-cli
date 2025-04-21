# Title: Policy Alignment Checker

**Purpose:**
Scan uploaded policies and match them against sustainability goals to identify alignment gaps.

## Step-by-Step Instructions

### Step 1: Analyze Inputs

@document_analysis:

- Parse all uploaded documents.
- Identify key sections related to environmental or governance policies.

### Step 2: Compare with Target Standards

@vector_search:

- Use vector similarity to match key sections with provided sustainability goals.

### Step 3: Generate Summary Report

@text_generation:

- Create a bulleted summary showing alignment and gaps.
- Suggest improvements.

## Output Format

- Title: Aligned Policies Summary
- Sections:
  - Overview
  - Matching Highlights
  - Recommendations

## Notes for Agent

- Prioritize documents dated within the last 3 years.
- Use concise phrasing.
