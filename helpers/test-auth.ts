export function getTestCredentials() {
  const email = process.env.E2E_TEST_EMAIL
  const password = process.env.E2E_TEST_PASSWORD

  if (!email || !password) {
    throw new Error('Missing E2E credentials. Please set E2E_TEST_EMAIL and E2E_TEST_PASSWORD.')
  }

  return { email, password }
}
