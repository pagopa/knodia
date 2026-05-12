# dpop-token-flow

End-to-end exercise of the `/token` endpoint: sets up an eservice chain,
signs a client assertion, signs a DPoP proof and exchanges it for a DPoP access token.

## Prerequisite

The flow needs two distinct keypairs:
- an **RS256 keypair** to sign the client assertion;
- a separate keypair to sign the DPoP proof — RS256 or ES256.

Reusing the same key for both would collapse the client credential and the
DPoP proof-of-possession key into one, which defeats the sender-constraining
purpose of DPoP. Generate them separately:

```
pnpm generate-keypair             # RS256 — client assertion
pnpm generate-keypair --alg ES256 # ES256 — DPoP proof
```

These write `KEYCHAIN_PRIVATE_RS256_KEY_PATH` + `KEYCHAIN_PUBLIC_RS256_KEY_B64`
and `KEYCHAIN_PRIVATE_ES256_KEY_PATH` + `KEYCHAIN_PUBLIC_ES256_KEY_B64` into
`collections/.env`. Run again to rotate.

If you specifically need to exercise the RS256 DPoP path, generate a second
RS256 keypair and point the DPoP proof at it — never reuse the client
assertion key.

## Run

Steps 1–10 set up the chain. Between step 10 and step 11 run the
signing scripts:

```
pnpm generate-client-assertion \
  --key $KEYCHAIN_PRIVATE_RS256_KEY_PATH \
  --keychainId <consumerKeychainId> \
  --purposeId <purposeId>

pnpm generate-dpop-proof \
  --key $KEYCHAIN_PRIVATE_<RS256|ES256>_KEY_PATH \
  --alg <RS256|ES256> \
  --htu https://test.knodia.org/token
```

They write `CLIENT_ASSERTION_JWT` and `DPOP_PROOF_JWT` to `collections/.env`. Step 11 picks them
up and calls `/token`; on success the response `access_token` is stashed
as a Bruno var.

If step 11 fails (or any step 1–10 hits 409 "kid already exists") the
bru file prints the exact command to run.
