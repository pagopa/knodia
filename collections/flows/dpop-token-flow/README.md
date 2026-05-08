# dpop-token-flow

End-to-end exercise of the `/token` endpoint: sets up an eservice chain,
signs a client assertion, signs a DPoP proof and exchanges it for a DPoP access token.

## Prerequisite

The flow needs:
- an **RSA keypair** to sign the client assertion (always RS256);
- a keypair to sign the DPoP proof — RS256 or ES256.

The simplest setup is a single RSA keypair, used for both:

```
pnpm generate-keypair
```

Generates an RSA keypair under `docker/keys/` and writes
`KEYCHAIN_PRIVATE_RS256_KEY_PATH` + `KEYCHAIN_PUBLIC_RS256_KEY_B64` into
`collections/.env`. Run once, or again to rotate the key.

If you want a separate ES256 keypair for the DPoP proof, also run:

```
pnpm generate-keypair --alg ES256
```

This writes `KEYCHAIN_PRIVATE_ES256_KEY_PATH` + `KEYCHAIN_PUBLIC_ES256_KEY_B64`
into `collections/.env`.

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
