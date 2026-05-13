# knode-api-token-flow

End-to-end exercise of the `/knodeApiToken` endpoint: sets up a Knode API
Keychain with a member and a public key, signs a Knode API client
assertion, and exchanges it for a Bearer access token.

## Prerequisite

```
pnpm generate-keypair
```

Generates an RSA keypair under `docker/keys/` and writes
`KEYCHAIN_PRIVATE_RS256_KEY_PATH` + `KEYCHAIN_PUBLIC_RS256_KEY_B64` into
`collections/.env`. Run once, or again to rotate the key.

## Run

Steps 1–4 set up the keychain. Between step 4 and step 5 run the
signing script:

```
pnpm generate-client-assertion \
  --key $KEYCHAIN_PRIVATE_RS256_KEY_PATH \
  --keychainId <knodeApiKeychainId> \
  --knodeId <Orion|Lynx>
```

It writes `KNODE_API_CLIENT_ASSERTION_JWT` to `collections/.env`. Step 5
picks it up and calls `/knodeApiToken`; on success the response
`access_token` is stashed as a Bruno var.

If step 5 fails (or any step 1–4 hits 409 "kid already exists") the
bru file prints the exact command to run.
