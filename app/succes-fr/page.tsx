import SuccesFrClient from "./succes-fr-client"

export default async function SuccesFrPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const params = await searchParams
  const sessionId = params.session_id ?? null
  return <SuccesFrClient sessionId={sessionId} />
}
