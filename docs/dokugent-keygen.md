# dokugent keygen

Generates a new Ed25519 keypair for signing agent specs.  
Keys are stored securely and include a fingerprint metadata file.

---

## 🔧 What It Does

- Prompts for an agent or key name
- Generates a keypair using Ed25519 algorithm
- Saves `.pem` files and `.meta.json` in `.dokugent/keys/`
- Prevents overwrite if key with same name exists

---

## 🧪 Behavior Overview

### 🟡 Prompt

```ts
🧑 What is the name of this key/agent?
```

If left blank, defaults to `"agent"`.

---

### 🔐 Key Files Generated

```plaintext
.dokugent/keys/
├── agent.private.pem     # Private signing key
├── agent.public.pem      # Public verification key
├── agent.meta.json       # Metadata and SHA256 fingerprint
```

---

### 📝 agent.meta.json Example

```json
{
  "name": "agent",
  "created_at": "2025-05-17T04:10:59.012Z",
  "algorithm": "ed25519",
  "fingerprint": "8c85e4b6e4fcd9d7b1f..."
}
```

The fingerprint is a SHA-256 hash of the public key.

---

### ❌ Prevents Overwrites

If a key with the given name already exists, the command aborts:

```plaintext
⚠️ Key files already exist for 'agent'.
❌ Please choose a different name.
```

---

## 📦 Cross-Platform Notes

Dokugent keygen works across macOS, Linux, and Windows.  
No setup rituals. No fuss. It just works—like it should.

---

## ✅ Example CLI Flow

```bash
dokugent keygen
```

```plaintext
🧑 What is the name of this key/agent? myAgentKey

🔐 Keypair generated for "myAgentKey":
  - 🗝️  Public:  .dokugent/keys/myAgentKey.public.pem
  - 🔒 Private: .dokugent/keys/myAgentKey.private.pem
  - 📄 Metadata: .dokugent/keys/myAgentKey.meta.json
```
