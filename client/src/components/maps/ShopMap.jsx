import Map from './Map'

export default function ShopMap({ shop, className = 'h-64' }) {
  const coordinates = shop?.location?.coordinates
  if (!coordinates) return null
  return (
    <Map
      className={className}
      center={coordinates}
      zoom={14}
      markers={[{ coordinates, label: 'Shop', color: '#E85D04', ariaLabel: shop.name }]}
    />
  )
}
