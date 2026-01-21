import { setupReadmodelTestContainer } from "./packages/test-commons/src/readmodel"

export default async function setup() {    
  const { container } = await setupReadmodelTestContainer();  

  return async function teardown() {
    await container.stop({ removeVolumes: true })
  }
}