export function assertMetadataExists<T>(
  resource: WithMaybeMetadata<T>,
): asserts resource is WithMetadata<T> {
  if (!resource.metadata) {
    throw missingMetadata();
  }
}

export function assertTargetMetadataExists(
  metadata: undefined | { version: number },
): asserts metadata is { version: number } {
  if (metadata === undefined) {
    throw missingMetadata();
  }
}
