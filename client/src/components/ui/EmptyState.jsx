export default function EmptyState({ title, body, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      {body ? <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
