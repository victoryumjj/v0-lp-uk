import SuccesFrClient from "./succes-fr-client"

export default async function SuccesFrPage({
  searchParams,
}: {
  searchParams: Promise<{ paypal_order?: string }>
}) {
  const params = await searchParams
  const paypalOrderId = params.paypal_order ?? null
  return <SuccesFrClient paypalOrderId={paypalOrderId} />
}
