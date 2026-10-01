import { formatINR } from '../../lib/format'

export default function Price({ price, salePrice, unit }) {
  const current = salePrice != null && salePrice < price ? salePrice : price
  return (
    <p className="text-sm">
      <span className="font-semibold">{formatINR(current)}</span>
      {salePrice != null && salePrice < price ? (
        <span className="ml-2 text-muted line-through">{formatINR(price)}</span>
      ) : null}
      {unit ? <span className="text-muted"> / {unit}</span> : null}
    </p>
  )
}
