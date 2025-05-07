# Testing – Unit Tests

This template outlines the basic structure for unit tests to verify the functionality of individual functions, methods, or components in isolation.

---

## 🔬 Checklist – Unit Test Coverage

- [ ] Functions return expected output for valid inputs
- [ ] Proper error handling for invalid inputs
- [ ] Edge case inputs are accounted for (see @qa/edge-cases.md)
- [ ] Mock dependencies to isolate behavior
- [ ] All major code branches (if/else/switch) are tested
- [ ] Test boundaries for loops and array indexing
- [ ] Utility functions are covered independently
- [ ] Tests do not depend on external services or databases

---

🧠 **Agent Note:**  
Unit tests should focus on logic within a single unit of code. Avoid testing integrations or external APIs here—refer to @testing/manual.md or @testing/integration.md for that scope.
