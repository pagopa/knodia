# client-assertion-flow

End-to-end exercise of the `/token` endpoint: sets up an eservice chain,
signs a client assertion, and exchanges it for an access token.

## Prerequisite

```
pnpm generate-keypair
```

Generates an RSA keypair under `docker/keys/` and writes
`KEYCHAIN_PRIVATE_KEY_PATH` + `KEYCHAIN_PUBLIC_KEY_B64` into
`collections/.env`. Run once, or again to rotate the key.

## Run

Steps 1–11 set up the chain. Between step 11 and step 12 run the
signing script:

```
pnpm generate-client-assertion \
  --key $KEYCHAIN_PRIVATE_KEY_PATH \
  --keychainId <consumerKeychainId> \
  --purposeId <purposeId>
```

It writes `CLIENT_ASSERTION_JWT` to `collections/.env`. Step 12 picks it
up and calls `/token`; on success the response `access_token` is stashed
as a Bruno var.

If step 12 fails (or any step 1–11 hits 409 "kid already exists") the
bru file prints the exact command to run.
