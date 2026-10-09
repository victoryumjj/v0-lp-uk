import SuccessUKClient from "./success-uk-client"

export default async function SuccessUKPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const params = await searchParams
  const sessionId = params.session_id ?? null
  return <SuccessUKClient sessionId={sessionId} />
}
