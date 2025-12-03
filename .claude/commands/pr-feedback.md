Please review and address the PR comments for pull request: $ARGUMENTS.

Follow these steps:

1. Use the github cli to fetch all PR comments in a structured format.

2. Analyze each comment to determine if it's actionable:
   - Code change requests (e.g., "use a different default", "rename this variable")
   - Bug fixes (e.g., "this will fail if X", "wrong default value")
   - Style/convention issues (e.g., "use react icons", "follow existing patterns")
   - Questions that need clarification

3. For actionable comments:
   - Search for the file and line mentioned in the comment
   - Implement the requested change
   - If multiple similar changes are needed, address them all
   - Run relevant tests after making changes

4. For non-actionable comments:
   - Explain why the comment may not require changes (e.g., "waiting for design", "intentional pattern")
   - Note any comments that are informational or already resolved
   - Flag any comments that need developer clarification

5. After addressing all comments:
   - Run linting and tests
   - Summarize what was changed and what wasn't
   - List any comments that need follow-up

Remember: Focus on code changes rather than responding to comments in GitHub. The goal is to improve the code based on the feedback.