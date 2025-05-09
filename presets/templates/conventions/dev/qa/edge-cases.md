
# QA – Edge Cases

 This checklist helps identify edge cases that may cause your application to behave unexpectedly under rare or extreme conditions. Use this to make sure your QA process covers more than just the happy path.

 ---

## 🔍 Checklist – Edge Case Scenarios

- [ ] Inputs that exceed max character limits
- [ ] Empty inputs or missing required fields
- [ ] Unexpected data types (e.g., string instead of number)
- [ ] Rapid, repeated user interactions (button spam, etc.)
- [ ] Invalid URLs or malformed query strings
- [ ] Timezone or locale-related display bugs
- [ ] API returns null or undefined values
- [ ] Feature accessed by unauthorized user
- [ ] What happens when the user loses internet connection?
- [ ] Can a user trigger duplicate submissions?

 ---

 🧠 **Agent Note:**
 This checklist is used for verifying behavior in extreme or rare edge cases. If working on automated QA, prioritize simulating these scenarios with @qa/test-matrix.md and @testing/unit.md.
