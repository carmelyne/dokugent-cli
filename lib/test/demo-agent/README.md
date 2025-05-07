# Demo Agent: Weather Dashboard Workflow

This folder contains a complete example of a document-guided agent workflow powered by Dokugent CLI.

## 🧩 Purpose

To simulate a full agent lifecycle from planning to certification using mocked files. This is useful for demos, documentation, and testing the end-to-end behavior of a typical agent integration.

## 🔁 Workflow Summary

1. **plan.md** – Agent goal and step outline  
2. **conventions.md** – Rules and naming standards  
3. **criteria.md** – Quality and success conditions  
4. **compiled.md** – Interpreted execution spec  
5. **compiled.log** – Sample log from an agent run  
6. **compiled.trace.md** – Step-by-step trace log  
7. **compiled.review.md** – Mock reviewer notes  
8. **compiled.cert** – Certification stamp

## ▶️ Run Sequence (Reference Only)

While this demo uses mocked files, the real CLI run would follow this order:

```bash
dokugent init
dokugent plan
dokugent conventions
dokugent criteria
dokugent preview       # ← sanity-check docs BEFORE compiling
dokugent certify
dokugent compile
dokugent trace
dokugent review        # ← for post-trace QA review
```

> Note: `preview` renders the planning files for human inspection before compiling. `review` is used after tracing to provide QA feedback.

## 📌 Notes

- This demo is static and does not execute any real API calls.
- Useful for understanding how agents are guided and certified using structured Markdown.
- Intended for onboarding, documentation, and developer testing.
