import SuccessUKClient from "./success-uk-client"

export default async function SuccessUKPage({
  searchParams,
}: {
  searchParams: Promise<{ paypal_order?: string }>
}) {
  const params = await searchParams
  const paypalOrderId = params.paypal_order ?? null
  return <SuccessUKClient paypalOrderId={paypalOrderId} />
}
