import SuccessUKClient from "./success-uk-client"

// Payment is confirmed by the Pagou webhook on the server, which also sends the
// Meta Purchase (Conversions API). This page only thanks the buyer.
export default function SuccessUKPage() {
  return <SuccessUKClient />
}
